/**
 * Types for the collection API endpoints.
 * Maps to backend CollectionResponse, CollectionDetailResponse, CollectionPageResponse.
 */

// ── DTOs (from server) ────────────────────────────────────

export interface CollectionDto {
  id: string
  title: string
  description?: string
  collectionType?: string
  coverR2Key?: string
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
  durationSec?: number
  isPaid: boolean
  priceXlm?: number
  locked: boolean
  unlocked: boolean
}

export interface CollectionDetailDto {
  id: string
  title: string
  description?: string
  collectionType?: string
  coverR2Key?: string
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
  isOwner: boolean
  contentLanguage?: string
  items: CollectionEntryItemDto[]
}

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
  durationSec?: number
  isPaid: boolean
  priceXlm?: number
  locked: boolean
  unlocked: boolean
}

export interface CollectionDetailModel {
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
  isOwner: boolean
  contentLanguage?: string
  items: CollectionEntryItemModel[]
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
  contentLanguage?: string
}

export interface InitCoverUploadResponse {
  presignedUrl: string
  r2Key: string
}
