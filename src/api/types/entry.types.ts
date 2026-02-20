/**
 * Types for the public entries endpoint (GET /public/entries).
 * These represent REAL published entries from the backend.
 */

// ==================== DTOs (from server) ====================

export interface PublicEntryDto {
  id: string
  type: 'video' | 'audio' | 'image' | 'entry' | 'file'
  title: string
  description?: string
  authorName: string
  authorAvatarUrl?: string
  publishedAt?: string
  thumbnailR2Key?: string
  previewR2Key?: string
  durationSec?: number
  isPaid: boolean
  priceXlm?: number
  tags?: string[]
}

export interface PublicEntryPageDto {
  content: PublicEntryDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

// ==================== Models (for UI) ====================

export interface PublicEntryModel {
  id: string
  type: 'video' | 'audio' | 'image' | 'entry' | 'file'
  title: string
  description?: string
  authorName: string
  authorAvatarUrl?: string
  publishedAt: string
  thumbnailUrl?: string
  previewUrl?: string
  durationSec?: number
  isPaid: boolean
  priceXlm?: number
  tags: string[]
}

export interface PublicEntryPageModel {
  items: PublicEntryModel[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

// ==================== Request params ====================

export interface PublicEntryRequestParams {
  page?: number
  size?: number
}
