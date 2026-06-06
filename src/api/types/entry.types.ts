/**
 * Types for the public entries endpoint (GET /public/entries).
 * These represent REAL published entries from the backend.
 */

import type { ProfileBadge } from '@/lib/profileBadge'

// ==================== DTOs (from server) ====================

export interface PublicEntryDto {
  id: string
  type: 'video' | 'audio' | 'image' | 'resource'
  title: string
  description?: string
  resourceContent?: string
  authorId?: string
  authorName: string
  authorAvatarUrl?: string
  profileBadge?: string
  publishedAt?: string
  thumbnailR2Key?: string
  previewR2Key?: string
  /** R2 prefix for thumbnail WebP variants (320/640/1280). */
  thumbnailVariantsPrefix?: string
  /** R2 prefix for preview-image WebP variants (320/640/1280). */
  previewVariantsPrefix?: string
  durationSec?: number
  isPaid: boolean
  priceXlm?: number
  priceUsd?: number
  priceCurrency?: 'XLM' | 'USD'
  contentLanguage?: string
  viewCount?: number
  tags?: string[]
  asset?: {
    fileName: string
    fileSizeBytes: number
    contentType: string
    scannedAt?: string
  }
  hlsReady?: boolean
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
  type: 'video' | 'audio' | 'image' | 'resource'
  title: string
  description?: string
  resourceContent?: string
  authorId?: string
  authorName: string
  authorAvatarUrl?: string
  profileBadge?: ProfileBadge
  publishedAt: string
  thumbnailUrl?: string
  previewUrl?: string
  /** Pre-built `<img srcset>` for the thumbnail (WebP variants). */
  thumbnailSrcset?: string
  /** Pre-built `<img srcset>` for the preview image (WebP variants). */
  previewSrcset?: string
  durationSec?: number
  viewCount?: number
  isPaid: boolean
  priceXlm?: number
  priceUsd?: number
  priceCurrency?: 'XLM' | 'USD'
  contentLanguage?: string
  tags: string[]
  asset?: {
    fileName: string
    fileSizeBytes: number
    contentType: string
    scannedAt?: string
  }
  hlsReady: boolean
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

export interface UserEntryRequestParams {
  type?: 'video' | 'audio' | 'image' | 'resource'
  page?: number
  size?: number
}
