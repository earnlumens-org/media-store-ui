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
  createdAt: string
  updatedAt: string
  publishedAt?: string
  /** Placeholder for future analytics */
  views?: number
  purchases?: number
  revenue?: number
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
