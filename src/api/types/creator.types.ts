/**
 * Types for the Creator Studio — creator's own entries management.
 */

import type { EntryStatus, EntryType } from './upload.types'

// ==================== Models ====================

export interface CreatorEntryModel {
  id: string
  type: EntryType | 'video' | 'audio' | 'image' | 'resource'
  title: string
  description?: string
  status: EntryStatus
  thumbnailUrl?: string
  isPaid: boolean
  priceXlm?: number
  priceUsd?: number
  priceCurrency?: 'XLM' | 'USD'
  contentLanguage?: string
  sellerWallet?: string
  createdAt: string
  updatedAt: string
  publishedAt?: string
  /** Placeholder for future analytics */
  views?: number
  purchases?: number
  revenue?: number
  /** Active transcoding job status for video entries (PENDING, DISPATCHED, PROCESSING, FAILED, DEAD) */
  transcodingStatus?: string
  /** Human-readable moderation feedback (rejection/suspension reason). */
  moderationFeedback?: string
  /** Resource-type body text (only for resource entries). */
  resourceContent?: string
}

export interface CreatorEntryPageModel {
  items: CreatorEntryModel[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface CreatorDashboardStats {
  totalEntries: number
  published: number
  drafts: number
  inReview: number
  rejected: number
  archived: number
  totalViews: number
  totalSales: number
}

export interface UpdateEntryMetadataRequest {
  title?: string
  description?: string
  isPaid?: boolean
  priceXlm?: number | null
  priceUsd?: number | null
  priceCurrency?: 'XLM' | 'USD' | null
  contentLanguage?: string | null
  sellerWallet?: string | null
  resourceContent?: string | null
}

// ==================== Filter / sort params ====================

export interface CreatorEntryFilters {
  status?: EntryStatus | 'ALL'
  type?: EntryType | 'ALL'
  search?: string
  page?: number
  size?: number
  sort?: 'newest' | 'oldest' | 'title_asc' | 'title_desc'
}

// ==================== Unified Studio Feed ====================

export interface StudioItemModel {
  id: string
  /** "entry" or "collection" */
  kind: 'entry' | 'collection'
  /** Entry type (video, audio, image, resource) or collection type — lowercase */
  type: string
  title: string
  description?: string
  status: string
  thumbnailUrl?: string
  coverUrl?: string
  isPaid: boolean
  priceXlm?: number
  priceUsd?: number
  priceCurrency?: string
  contentLanguage?: string
  durationSec?: number
  viewCount: number
  /** Number of items — only for collections */
  itemCount: number
  createdAt: string
  updatedAt: string
  publishedAt?: string
  /** Transcoding status — only for video entries */
  transcodingStatus?: string
  sellerWallet?: string
  /** Human-readable moderation feedback (rejection/suspension reason). */
  moderationFeedback?: string
  /** Resource-type body text (only for resource entries). */
  resourceContent?: string
}

export interface StudioPageModel {
  items: StudioItemModel[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}
