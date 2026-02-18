/**
 * Upload API module — entry creation + asset upload flow.
 *
 * Flow:
 *   1. createEntry()       → POST /api/entries         → { id, status: DRAFT }
 *   2. initUpload()        → POST /api/uploads/init    → { uploadId, presignedUrl, r2Key }
 *   3. uploadToR2()        → PUT  presignedUrl          (direct to R2)
 *   4. finalizeUpload()    → POST /api/uploads/finalize → { assetId, status }
 *   5. submitForReview()   → PATCH /api/entries/:id/status → { status: IN_REVIEW }
 *
 * TODO: Backend endpoints for steps 1-5 are not yet implemented.
 *       These stubs match the planned API contract from DATA-MODEL.md.
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
import { apiRequest } from '../apiRequest'

/**
 * Create a new entry in DRAFT status.
 * TODO: Backend endpoint POST /api/entries not yet implemented.
 */
export async function createEntry (data: CreateEntryRequest): Promise<CreateEntryResponse> {
  return apiRequest<CreateEntryResponse>('/api/entries', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Initialize an upload — get a presigned R2 PUT URL.
 * TODO: Backend endpoint POST /api/uploads/init not yet implemented.
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
 * Finalize an upload — register the asset in the database.
 * TODO: Backend endpoint POST /api/uploads/finalize not yet implemented.
 */
export async function finalizeUpload (data: FinalizeUploadRequest): Promise<FinalizeUploadResponse> {
  return apiRequest<FinalizeUploadResponse>('/api/uploads/finalize', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Update entry status (e.g. DRAFT → IN_REVIEW).
 * TODO: Backend endpoint PATCH /api/entries/:id/status not yet implemented.
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
