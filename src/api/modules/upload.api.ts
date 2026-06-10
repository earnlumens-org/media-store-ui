/**
 * Upload API module — entry creation + asset upload flow.
 *
 * Flow:
 *   1. createEntry()       → POST /api/entries         → { id, status: DRAFT }
 *   2. initUpload()        → POST /api/uploads/init    → { uploadId, presignedUrl | partUrls, r2Key }
 *   3. uploadFileToR2()    → PUT  presignedUrl(s)       (direct to R2, retries + stall watchdog)
 *   4. finalizeUpload()    → POST /api/uploads/finalize → { assetId, status }
 *   5. submitForReview()   → PATCH /api/entries/:id/status → { status: IN_REVIEW }
 *
 * Reliability features (designed for poor connections):
 *   - Every PUT to R2 has a stall watchdog: if no bytes move for
 *     {@link STALL_TIMEOUT_MS} the attempt is aborted and retried.
 *   - Transient failures (network drop, stall, 5xx/429/408) are retried
 *     with exponential backoff + jitter, up to {@link MAX_PUT_ATTEMPTS}.
 *   - Expired presigned URLs (403) are transparently refreshed.
 *   - Files >= the server multipart threshold are uploaded in parts, so a
 *     failure only retries the current ~16 MB part instead of the whole file.
 *   - All uploads accept an AbortSignal so the user can cancel.
 */

import type {
  CreateEntryRequest,
  CreateEntryResponse,
  FinalizeUploadRequest,
  FinalizeUploadResponse,
  InitUploadRequest,
  InitUploadResponse,
  UpdateEntryStatusRequest,
  UploadConfigResponse,
} from '../types/upload.types'
import { ApiError, apiRequest } from '../apiRequest'

/**
 * Error code returned by /api/uploads/init and /api/uploads/finalize
 * (HTTP 403) when the tenant owner has flipped the uploads kill switch
 * off. Callers should catch this and surface a friendly snackbar /
 * banner instead of the generic "request failed" message.
 */
export const UPLOADS_DISABLED_ERROR = 'UPLOADS_DISABLED'

/**
 * Type guard: returns true when the given error is a 403 raised by the
 * uploads kill switch. Centralized so UI code does not have to know the
 * exact wire shape.
 */
export function isUploadsDisabledError (error: unknown): boolean {
  return error instanceof ApiError
    && error.status === 403
    && (error.message === UPLOADS_DISABLED_ERROR
      || (error.data as { error?: string } | undefined)?.error === UPLOADS_DISABLED_ERROR)
}

// ==================== R2 upload error model ====================

export type UploadErrorKind = 'network' | 'http' | 'stalled' | 'aborted'

/** Error raised by direct-to-R2 PUT attempts. */
export class R2UploadError extends Error {
  constructor (
    message: string,
    public kind: UploadErrorKind,
    public status?: number,
  ) {
    super(message)
    this.name = 'R2UploadError'
  }
}

/** True when the error means the user (or navigation) cancelled the upload. */
export function isUploadAborted (error: unknown): boolean {
  return (error instanceof R2UploadError && error.kind === 'aborted')
    || (error instanceof DOMException && error.name === 'AbortError')
}

// ==================== Tuning constants ====================

/** Abort an attempt when no bytes have moved for this long. */
const STALL_TIMEOUT_MS = 75_000
/** Max attempts per PUT (1 initial + 3 retries). */
const MAX_PUT_ATTEMPTS = 4
/** Backoff schedule between attempts (jitter is applied on top). */
const RETRY_DELAYS_MS = [2000, 4000, 8000]

function backoffDelay (retryIndex: number): number {
  const base = RETRY_DELAYS_MS[Math.min(retryIndex, RETRY_DELAYS_MS.length - 1)] ?? 8000
  // ±20% jitter to avoid thundering-herd retries
  return Math.round(base * (0.8 + Math.random() * 0.4))
}

function sleep (ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new R2UploadError('Upload aborted', 'aborted'))
      return
    }
    const onAbort = () => {
      clearTimeout(timer)
      reject(new R2UploadError('Upload aborted', 'aborted'))
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

/** Transient errors worth retrying. */
function isRetriable (error: unknown): boolean {
  if (!(error instanceof R2UploadError)) {
    return false
  }
  if (error.kind === 'network' || error.kind === 'stalled') {
    return true
  }
  if (error.kind === 'http' && error.status !== undefined) {
    return error.status >= 500 || error.status === 429 || error.status === 408
  }
  return false
}

/** 403 from R2 almost always means the presigned URL expired. */
function isExpiredUrl (error: unknown): boolean {
  return error instanceof R2UploadError && error.kind === 'http' && error.status === 403
}

// ==================== Low-level PUT with stall watchdog ====================

interface PutBlobOptions {
  /** Content-Type header. Omit for multipart part PUTs (not part of the signature). */
  contentType?: string
  signal?: AbortSignal
  /** Raw byte progress for this single attempt. */
  onProgress?: (loaded: number, total: number) => void
  stallTimeoutMs?: number
}

/**
 * Single PUT attempt to a presigned R2 URL. No retries — callers wrap
 * this with retry orchestration. Rejects with {@link R2UploadError}.
 */
function putBlob (url: string, body: Blob, options: PutBlobOptions = {}): Promise<void> {
  const { contentType, signal, onProgress, stallTimeoutMs = STALL_TIMEOUT_MS } = options

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new R2UploadError('Upload aborted', 'aborted'))
      return
    }

    const xhr = new XMLHttpRequest()
    let settled = false
    let stalledByWatchdog = false
    let lastActivity = Date.now()

    const watchdog = setInterval(() => {
      if (Date.now() - lastActivity > stallTimeoutMs) {
        stalledByWatchdog = true
        xhr.abort()
      }
    }, 5000)

    function cleanup () {
      clearInterval(watchdog)
      signal?.removeEventListener('abort', onAbortSignal)
    }

    function settle (fn: () => void) {
      if (settled) {
        return
      }
      settled = true
      cleanup()
      fn()
    }

    function onAbortSignal () {
      xhr.abort()
    }
    signal?.addEventListener('abort', onAbortSignal, { once: true })

    xhr.open('PUT', url, true)
    if (contentType) {
      xhr.setRequestHeader('Content-Type', contentType)
    }

    xhr.upload.addEventListener('progress', e => {
      lastActivity = Date.now()
      if (e.lengthComputable && onProgress) {
        onProgress(e.loaded, e.total)
      }
    })
    xhr.addEventListener('readystatechange', () => {
      lastActivity = Date.now()
    })

    xhr.addEventListener('load', () => {
      settle(() => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve()
        } else {
          reject(new R2UploadError(`R2 upload failed with status ${xhr.status}`, 'http', xhr.status))
        }
      })
    })

    xhr.addEventListener('error', () => {
      settle(() => reject(new R2UploadError('R2 upload network error', 'network')))
    })

    xhr.addEventListener('abort', () => {
      settle(() => {
        if (stalledByWatchdog) {
          reject(new R2UploadError('R2 upload stalled (no progress)', 'stalled'))
        } else {
          reject(new R2UploadError('Upload aborted', 'aborted'))
        }
      })
    })

    xhr.send(body)
  })
}

// ==================== Upload orchestration ====================

export interface UploadFileOptions {
  /** Overall progress 0-100 across the whole file. */
  onProgress?: (percent: number) => void
  /** Cancel the upload (user pressed cancel / navigated away). */
  signal?: AbortSignal
  /**
   * Called when a presigned single-PUT URL has expired (403); must return
   * a fresh InitUploadResponse (typically by calling initUpload again).
   * When omitted, expired URLs are retried as-is.
   */
  refresh?: () => Promise<InitUploadResponse>
  /** Notified before each retry wait — lets the UI show "retrying…". */
  onRetry?: (attempt: number) => void
}

/**
 * Upload a file to R2 using the init response from the server. Handles
 * single-PUT and multipart uploads transparently, with retries, stall
 * detection and URL refresh.
 *
 * @returns the InitUploadResponse that was actually used — callers MUST
 *          finalize with the returned uploadId/r2Key (the upload session
 *          may have been re-initialized after a URL refresh).
 */
export async function uploadFileToR2 (
  init: InitUploadResponse,
  file: File,
  options: UploadFileOptions = {},
): Promise<InitUploadResponse> {
  if (init.multipart && init.partUrls?.length && init.partSizeBytes) {
    return uploadMultipart(init, file, options)
  }
  return uploadSinglePut(init, file, options)
}

async function uploadSinglePut (
  init: InitUploadResponse,
  file: File,
  options: UploadFileOptions,
): Promise<InitUploadResponse> {
  const { onProgress, signal, refresh, onRetry } = options
  let current = init

  for (let attempt = 0; ; attempt++) {
    try {
      if (!current.presignedUrl) {
        throw new R2UploadError('Missing presigned URL', 'http', 500)
      }
      await putBlob(current.presignedUrl, file, {
        contentType: file.type || 'application/octet-stream',
        signal,
        onProgress: loaded => onProgress?.(Math.round((loaded / file.size) * 100)),
      })
      return current
    } catch (error) {
      if (isUploadAborted(error)) {
        throw error
      }
      const expired = isExpiredUrl(error)
      if (attempt >= MAX_PUT_ATTEMPTS - 1 || (!isRetriable(error) && !expired)) {
        throw error
      }
      onRetry?.(attempt + 1)
      await sleep(backoffDelay(attempt), signal)
      if (expired && refresh) {
        try {
          current = await refresh()
        } catch {
          // keep the old URL — the next attempt may still work
        }
      }
    }
  }
}

async function uploadMultipart (
  init: InitUploadResponse,
  file: File,
  options: UploadFileOptions,
): Promise<InitUploadResponse> {
  const { onProgress, signal, onRetry } = options
  const partSize = init.partSizeBytes!
  const partUrls = init.partUrls!
  const totalBytes = file.size

  for (const [i, partUrl] of partUrls.entries()) {
    const start = i * partSize
    const end = Math.min(start + partSize, totalBytes)
    const part = file.slice(start, end)
    let url = partUrl ?? ''

    for (let attempt = 0; ; attempt++) {
      try {
        await putBlob(url, part, {
          signal,
          onProgress: loaded =>
            onProgress?.(Math.round(((start + loaded) / totalBytes) * 100)),
        })
        break // part done — move on to the next one
      } catch (error) {
        if (isUploadAborted(error)) {
          throw error
        }
        const expired = isExpiredUrl(error)
        if (attempt >= MAX_PUT_ATTEMPTS - 1 || (!isRetriable(error) && !expired)) {
          throw error
        }
        onRetry?.(attempt + 1)
        await sleep(backoffDelay(attempt), signal)
        if (expired) {
          const fresh = await getUploadPartUrl(init.uploadId, i + 1).catch(() => null)
          if (fresh) {
            url = fresh
          }
        }
      }
    }
  }

  // All parts uploaded — ask the server to assemble the object.
  for (let attempt = 0; ; attempt++) {
    try {
      await completeMultipartUpload(init.uploadId)
      break
    } catch (error) {
      const retriable = error instanceof ApiError
        && (error.status >= 500 || error.status === 429 || error.status === 408)
      const networkErr = error instanceof TypeError // fetch network failure
      if (attempt >= 2 || (!retriable && !networkErr)) {
        throw error
      }
      await sleep(backoffDelay(attempt), signal)
    }
  }

  return init
}

/**
 * Legacy single-PUT helper (kept for callers that manage their own
 * presigned URL, e.g. franchise branding uploads). Includes the same
 * retry + stall-watchdog behaviour but no URL refresh.
 *
 * @param presignedUrl - The presigned PUT URL
 * @param file - The file to upload
 * @param onProgress - Optional progress callback (0-100)
 * @param signal - Optional cancellation signal
 */
export async function uploadToR2 (
  presignedUrl: string,
  file: File,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  await uploadSinglePut(
    { uploadId: '', presignedUrl, r2Key: '' },
    file,
    { onProgress, signal },
  )
}

// ==================== Server endpoints ====================

/**
 * Create a new entry in DRAFT status.
 */
export async function createEntry (data: CreateEntryRequest): Promise<CreateEntryResponse> {
  return apiRequest<CreateEntryResponse>('/api/entries', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Initialize an upload — get presigned R2 PUT URL(s).
 */
export async function initUpload (data: InitUploadRequest): Promise<InitUploadResponse> {
  return apiRequest<InitUploadResponse>('/api/uploads/init', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Complete a multipart upload — the server assembles the parts in R2.
 */
export async function completeMultipartUpload (uploadId: string): Promise<void> {
  await apiRequest<{ status: string }>('/api/uploads/complete', {
    method: 'POST',
    body: JSON.stringify({ uploadId }),
  })
}

/**
 * Get a fresh presigned URL for a single part of a multipart upload.
 * Returns null when the backend does not support the endpoint yet.
 */
export async function getUploadPartUrl (uploadId: string, partNumber: number): Promise<string | null> {
  try {
    const res = await apiRequest<{ url: string }>('/api/uploads/part-url', {
      method: 'POST',
      body: JSON.stringify({ uploadId, partNumber }),
    })
    return res.url ?? null
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null
    }
    throw error
  }
}

/**
 * Abort an in-flight upload so the server can clean up R2 garbage.
 * Best-effort: never throws (also tolerates older backends without
 * the endpoint).
 */
export async function abortUpload (uploadId: string): Promise<void> {
  try {
    await apiRequest<{ aborted: boolean }>('/api/uploads/abort', {
      method: 'POST',
      body: JSON.stringify({ uploadId }),
    })
  } catch {
    // best-effort cleanup — server-side stale-session GC covers the rest
  }
}

/**
 * Fetch server-side upload limits (max sizes, multipart threshold).
 * Returns null when the backend does not support the endpoint yet —
 * callers should fall back to the client-side constants.
 */
export async function getUploadConfig (): Promise<UploadConfigResponse | null> {
  try {
    return await apiRequest<UploadConfigResponse>('/api/uploads/config', {
      method: 'GET',
    })
  } catch {
    return null
  }
}

/**
 * Finalize an upload — register the asset in the database with media metadata.
 */
export async function finalizeUpload (data: FinalizeUploadRequest): Promise<FinalizeUploadResponse> {
  return apiRequest<FinalizeUploadResponse>('/api/uploads/finalize', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Update entry status (e.g. DRAFT → IN_REVIEW).
 */
export async function updateEntryStatus (
  entryId: string,
  data: UpdateEntryStatusRequest,
): Promise<void> {
  return apiRequest<void>(`/api/entries/${entryId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}
