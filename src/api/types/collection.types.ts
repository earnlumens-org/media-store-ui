/**
 * Types for the collection API endpoints.
 * Maps to backend CollectionResponse, CollectionDetailResponse, CollectionPageResponse.
 */

import type { ProfileBadge } from '@/lib/profileBadge'

// ── DTOs (from server) ────────────────────────────────────

export interface CollectionDto {
  id: string
  title: string
  description?: string
  collectionType?: string
  coverR2Key?: string
  /** R2 prefix for cover WebP variants (320/640/1280). */
  coverVariantsPrefix?: string
  status?: string
  visibility?: string
  authorUsername?: string
  authorAvatarUrl?: string
  publishedAt?: string
  isPaid: boolean
  priceXlm?: number
  priceUsd?: number
  priceCurrency?: string
  itemCount: number
  locked: boolean
  unlocked: boolean
  contentLanguage?: string
}

export interface CollectionPageDto {
  content: CollectionDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface CollectionEntryItemDto {
  entryId: string
  position: number
  type: string
  title: string
  description?: string
  authorUsername?: string
  thumbnailR2Key?: string
  /** R2 prefix for thumbnail WebP variants. */
  thumbnailVariantsPrefix?: string
  durationSec?: number
  isPaid: boolean
  priceXlm?: number
  locked: boolean
  unlocked: boolean
  /** Entry is under a moderation block (H3). */
  blocked?: boolean
  /** Removed from the collection after the viewer's purchase; the viewer keeps access (H2 / D-20). */
  retained?: boolean
}

export interface CollectionDetailDto {
  id: string
  title: string
  description?: string
  collectionType?: string
  coverR2Key?: string
  /** R2 prefix for cover WebP variants. */
  coverVariantsPrefix?: string
  status?: string
  visibility?: string
  authorUsername?: string
  authorAvatarUrl?: string
  profileBadge?: string
  publishedAt?: string
  isPaid: boolean
  priceXlm?: number
  priceUsd?: number
  priceCurrency?: string
  itemCount: number
  locked: boolean
  unlocked: boolean
  isOwner: boolean
  contentLanguage?: string
  items: CollectionEntryItemDto[]  /** Items the creator removed after this buyer's purchase, which the buyer retains (H2 / D-20). */
  retainedItems?: CollectionEntryItemDto[]}

// ── Models (for UI) ───────────────────────────────────────

export interface CollectionItemModel {
  id: string
  title: string
  description?: string
  collectionType?: string
  coverUrl?: string
  status?: string
  visibility?: string
  authorName?: string
  authorAvatarUrl?: string
  publishedAt: string
  isPaid: boolean
  priceXlm?: number
  priceUsd?: number
  priceCurrency?: string
  itemCount: number
  locked: boolean
  unlocked: boolean
  contentLanguage?: string
}

export interface CollectionPageModel {
  items: CollectionItemModel[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface CollectionEntryItemModel {
  entryId: string
  position: number
  type: string
  title: string
  description?: string
  authorName?: string
  thumbnailUrl?: string
  /** Pre-built `<img srcset>` for the thumbnail (WebP variants). */
  thumbnailSrcset?: string
  durationSec?: number
  isPaid: boolean
  priceXlm?: number
  locked: boolean
  unlocked: boolean
  blocked: boolean
  retained: boolean
}

export interface CollectionDetailModel {
  id: string
  title: string
  description?: string
  collectionType?: string
  coverUrl?: string
  /** Pre-built `<img srcset>` for the cover (WebP variants). */
  coverSrcset?: string
  status?: string
  visibility?: string
  authorName?: string
  authorAvatarUrl?: string
  profileBadge?: ProfileBadge
  publishedAt: string
  isPaid: boolean
  priceXlm?: number
  priceUsd?: number
  priceCurrency?: string
  itemCount: number
  locked: boolean
  unlocked: boolean
  isOwner: boolean
  contentLanguage?: string
  items: CollectionEntryItemModel[]
  /** Items the viewer retains although the creator removed them (H2 / D-20). Empty for non-buyers. */
  retainedItems: CollectionEntryItemModel[]
}

// ── Request types ─────────────────────────────────────────

export interface CreateCollectionRequest {
  title: string
  description?: string
  collectionType: string
  visibility?: string
  isPaid: boolean
  priceXlm?: number
  priceUsd?: number
  priceCurrency?: string
  sellerWallet?: string
  contentLanguage?: string
}

export interface UpdateCollectionRequest {
  title?: string
  description?: string
  visibility?: string
  isPaid?: boolean
  priceXlm?: number
  priceUsd?: number
  priceCurrency?: string
  sellerWallet?: string
}

export interface InitCoverUploadResponse {
  presignedUrl: string
  r2Key: string
}
