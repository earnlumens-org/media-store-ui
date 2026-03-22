/**
 * Types for the purchases API endpoint (GET /api/purchases).
 * Represents entries the authenticated user has purchased.
 */

// ── DTO (from server) ─────────────────────────────────────

export interface PurchasedEntryDto {
  id: string
  type: 'video' | 'audio' | 'image' | 'resource'
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
  purchasedAt?: string
}

export interface PurchasedEntryPageDto {
  content: PurchasedEntryDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

// ── Models (for UI) ───────────────────────────────────────

export interface PurchasedEntryModel {
  id: string
  type: 'video' | 'audio' | 'image' | 'resource'
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
  purchasedAt: string
}

export interface PurchasedEntryPageModel {
  items: PurchasedEntryModel[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

// ── Purchased Collections ─────────────────────────────────

export interface PurchasedCollectionDto {
  id: string
  title: string
  description?: string
  collectionType?: string
  coverR2Key?: string
  authorUsername?: string
  authorAvatarUrl?: string
  publishedAt?: string
  isPaid: boolean
  priceXlm?: number
  itemCount: number
  purchasedAt?: string
}

export interface PurchasedCollectionPageDto {
  content: PurchasedCollectionDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface PurchasedCollectionModel {
  id: string
  title: string
  description?: string
  collectionType?: string
  coverUrl?: string
  authorName?: string
  authorAvatarUrl?: string
  publishedAt: string
  isPaid: boolean
  priceXlm?: number
  itemCount: number
  purchasedAt: string
}

export interface PurchasedCollectionPageModel {
  items: PurchasedCollectionModel[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}
