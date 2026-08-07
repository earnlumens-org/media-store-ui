/**
 * Types for unified public feeds (profile, purchased).
 * Both entries and collections are merged server-side via $unionWith.
 */

import type { ProfileBadge } from '@/lib/profileBadge'

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
  profileBadge?: string
  publishedAt?: string
  thumbnailR2Key?: string
  coverR2Key?: string
  /** R2 prefix for thumbnail WebP variants (entries). */
  thumbnailVariantsPrefix?: string
  /** R2 prefix for preview-image WebP variants (entries). */
  previewVariantsPrefix?: string
  /** R2 prefix for cover WebP variants (collections). */
  coverVariantsPrefix?: string
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
  /** True when this entry was detected as a remix (entries only). */
  remix?: boolean
}

export interface PublicFeedPageDto {
  content: PublicFeedItemDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  /**
   * True when the active content-language filter matched nothing and the
   * server automatically re-ran the query without it (showing all languages).
   */
  languageFallback?: boolean
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
  profileBadge?: ProfileBadge
  publishedAt: string
  thumbnailUrl?: string
  coverUrl?: string
  /** Pre-built `<img srcset>` for the entry thumbnail. */
  thumbnailSrcset?: string
  /** Pre-built `<img srcset>` for the collection cover. */
  coverSrcset?: string
  durationSec?: number
  viewCount: number
  isPaid: boolean
  priceXlm?: number
  priceUsd?: number
  priceCurrency?: 'XLM' | 'USD'
  itemCount: number
  locked: boolean
  unlocked: boolean
  /** True when this entry was detected as a remix (entries only). */
  remix?: boolean
}

export interface PublicFeedPageModel {
  items: PublicFeedItemModel[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  /** Server fell back to all languages because the filter matched nothing. */
  languageFallback: boolean
}

// ==================== Request params ====================

export interface FeedRequestParams {
  type?: string
  pricing?: string
  search?: string
  sort?: 'newest' | 'oldest' | 'title_asc' | 'title_desc'
  page?: number
  size?: number
  /**
   * Per-request language filter override.
   * - `'all'` disables language filtering for this request ("Show all
   *   languages" toggle, or paginating a feed the server already fell
   *   back to all languages for).
   * - A CSV of language codes, optionally including the `multi` token
   *   (e.g. `'es,en,multi'`), applies an explicit filter — this is how
   *   guests send the preferences they configured (localStorage).
   * - Omitted: logged-in users are filtered by their persisted prefs
   *   (token claims); users without configured prefs and guests get the
   *   server-side browser-language default (Accept-Language).
   */
  lang?: string
}
