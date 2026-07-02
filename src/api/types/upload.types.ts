/**
 * Types for the upload / entry creation flow.
 */

// ==================== Entry types ====================

export type EntryType = 'VIDEO' | 'AUDIO' | 'IMAGE' | 'RESOURCE'

export type EntryStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED' | 'DELETED'

export type AssetKind = 'THUMBNAIL' | 'PREVIEW' | 'FULL'

export interface CreateEntryRequest {
  title: string
  description?: string
  resourceContent?: string
  type: EntryType
  isPaid: boolean
  priceXlm?: number | null
  priceUsd?: number | null
  /** "XLM" or "USD". Defaults to XLM if absent (backward compatible). */
  priceCurrency?: 'XLM' | 'USD' | null
  /** Stellar public key (G...) of the seller's connected wallet. Required when isPaid = true. */
  sellerWallet?: string | null
  /** ISO 639-1 language code of the content (e.g. "es", "en"). */
  contentLanguage?: string | null
  /** Whether resells are enabled (paid content only). Defaults to true when omitted. */
  resellerEnabled?: boolean | null
  /** Reseller commission as a percent of the total price (5–20). Defaults to 10. */
  resellerCommissionPercent?: number | null
}

export interface CreateEntryResponse {
  id: string
  title: string
  type: EntryType
  status: EntryStatus
}

export interface UpdateEntryStatusRequest {
  status: EntryStatus
}

// ==================== Upload types ====================

export interface InitUploadRequest {
  entryId: string
  fileName: string
  contentType: string
  kind: AssetKind
  fileSizeBytes: number
}

export interface InitUploadResponse {
  uploadId: string
  /** Single-PUT presigned URL (null when multipart = true). */
  presignedUrl: string | null
  r2Key: string
  /** True when the file must be uploaded in parts (large files). */
  multipart?: boolean
  /** Uniform part size in bytes (multipart only). */
  partSizeBytes?: number | null
  /** Presigned URLs for each part, in order (multipart only). */
  partUrls?: string[] | null
}

/** Server-side upload limits returned by GET /api/uploads/config. */
export interface UploadConfigResponse {
  maxFullBytes: Record<string, number>
  maxThumbnailBytes: number
  maxPreviewBytes: number
  multipartThresholdBytes: number
  partSizeBytes: number
}

export interface FinalizeUploadRequest {
  uploadId: string
  entryId: string
  r2Key: string
  contentType: string
  fileName: string
  fileSizeBytes: number
  kind: AssetKind
  /** Video/image width in pixels (from HTMLVideoElement.videoWidth or naturalWidth) */
  widthPx?: number | null
  /** Video/image height in pixels (from HTMLVideoElement.videoHeight or naturalHeight) */
  heightPx?: number | null
  /** Duration in whole seconds (from HTMLVideoElement.duration or HTMLAudioElement.duration) */
  durationSec?: number | null
  /** Video codec string — reserved for future use */
  codecVideo?: string | null
  /** Audio codec string — reserved for future use */
  codecAudio?: string | null
  /** Approximate bitrate in bits per second (fileSizeBytes * 8 / durationSec) */
  bitrateBps?: number | null
}

export interface FinalizeUploadResponse {
  assetId: string
  status: string
}

// ==================== UI helper types ====================

/** Lowercase content type used in query params and UI routing */
export type UploadContentType = 'video' | 'audio' | 'image' | 'resource'

/** Maps UI content type to backend EntryType */
export function toEntryType (uiType: UploadContentType): EntryType {
  const map: Record<UploadContentType, EntryType> = {
    video: 'VIDEO',
    audio: 'AUDIO',
    image: 'IMAGE',
    resource: 'RESOURCE',
  }
  return map[uiType] ?? 'VIDEO'
}

/** Valid UI content types */
export const UPLOAD_CONTENT_TYPES: UploadContentType[] = ['video', 'audio', 'image', 'resource']

/** Accepted MIME types per content type for the full asset */
export const ACCEPTED_MIMES: Record<UploadContentType, string> = {
  video: 'video/mp4,video/webm,video/quicktime',
  audio: 'audio/mpeg,audio/wav,audio/ogg,audio/flac,audio/mp4',
  image: 'image/jpeg,image/png,image/webp,image/gif',
  // Mirrors the backend allowlist (media + text + documents/ebooks/archives).
  // Executables/scripts are blocked server-side regardless.
  resource: [
    'image/*',
    'video/*',
    'audio/*',
    'text/*',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.oasis.opendocument.presentation',
    'application/rtf',
    'application/epub+zip',
    'application/json',
    'application/xml',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-tar',
    'application/gzip',
    'application/x-7z-compressed',
    'application/vnd.rar',
  ].join(','),
}

/** Accepted MIME types for thumbnails */
export const THUMBNAIL_MIMES = 'image/jpeg,image/png,image/webp'

/** Accepted MIME types for preview clips/images (browser-compatible only) */
export const PREVIEW_MIMES = 'video/mp4,video/webm,image/jpeg,image/png,image/webp'

/** Max file sizes in bytes */
export const MAX_FILE_SIZES: Record<UploadContentType, number> = {
  video: 5 * 1024 * 1024 * 1024, // 5 GB
  audio: 500 * 1024 * 1024, // 500 MB
  image: 50 * 1024 * 1024, // 50 MB
  resource: 2 * 1024 * 1024 * 1024, // 2 GB
}

export const MAX_THUMBNAIL_SIZE = 10 * 1024 * 1024 // 10 MB
export const MAX_PREVIEW_SIZE = 512 * 1024 * 1024 // 512 MB

export function formatFileSize (bytes: number): string {
  if (bytes === 0) {
    return '0 B'
  }
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}
