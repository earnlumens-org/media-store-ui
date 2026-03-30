/**
 * Types for unified public feeds (profile, purchased).
 * Both entries and collections are merged server-side via $unionWith.
 */

// ==================== DTOs (from server) ====================

export interface PublicFeedItemDto {
  id: string
  /** "entry" or "collection" */
  kind: 'entry' | 'collection'
  /** Entry type (video, audio, image, resource) or collection type — lowercase */
  type: string
  title: string
  description?: string
  authorUsername: string
  authorAvatarUrl?: string
  publishedAt?: string
  thumbnailR2Key?: string
  coverR2Key?: string
  durationSec?: number
  viewCount: number
  isPaid: boolean
  priceXlm?: number
  priceUsd?: number
  priceCurrency?: string
  /** Number of items — only for collections */
  itemCount: number
  locked: boolean
  unlocked: boolean
}

export interface PublicFeedPageDto {
  content: PublicFeedItemDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

// ==================== Models (for UI) ====================

export interface PublicFeedItemModel {
  id: string
  kind: 'entry' | 'collection'
  type: string
  title: string
  description?: string
  authorName: string
  authorAvatarUrl?: string
  publishedAt: string
  thumbnailUrl?: string
  coverUrl?: string
  durationSec?: number
  viewCount: number
  isPaid: boolean
  priceXlm?: number
  priceUsd?: number
  priceCurrency?: 'XLM' | 'USD'
  itemCount: number
  locked: boolean
  unlocked: boolean
}

export interface PublicFeedPageModel {
  items: PublicFeedItemModel[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

// ==================== Request params ====================

export interface FeedRequestParams {
  type?: string
  search?: string
  sort?: 'newest' | 'oldest' | 'title_asc' | 'title_desc'
  page?: number
  size?: number
}
