/**
 * Upload API module — entry creation + asset upload flow.
 *
 * Flow:
 *   1. createEntry()       → POST /api/entries         → { id, status: DRAFT }
 *   2. initUpload()        → POST /api/uploads/init    → { uploadId, presignedUrl, r2Key }
 *   3. uploadToR2()        → PUT  presignedUrl          (direct to R2)
 *   4. finalizeUpload()    → POST /api/uploads/finalize → { assetId, status }
 *   5. submitForReview()   → PATCH /api/entries/:id/status → { status: IN_REVIEW }
 */

import type {
  CreateEntryRequest,
  CreateEntryResponse,
  FinalizeUploadRequest,
  FinalizeUploadResponse,
  InitUploadRequest,
  InitUploadResponse,
  UpdateEntryStatusRequest,
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
 * Initialize an upload — get a presigned R2 PUT URL.
 */
export async function initUpload (data: InitUploadRequest): Promise<InitUploadResponse> {
  return apiRequest<InitUploadResponse>('/api/uploads/init', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Upload a file directly to R2 using the presigned URL.
 * This bypasses our API server — goes straight to Cloudflare R2.
 *
 * @param presignedUrl - The presigned PUT URL from initUpload()
 * @param file - The file to upload
 * @param onProgress - Optional progress callback (0-100)
 */
export async function uploadToR2 (
  presignedUrl: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', presignedUrl, true)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')

    if (onProgress) {
      xhr.upload.addEventListener('progress', e => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      })
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`R2 upload failed with status ${xhr.status}`))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('R2 upload network error')))
    xhr.addEventListener('abort', () => reject(new Error('R2 upload aborted')))

    xhr.send(file)
  })
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
