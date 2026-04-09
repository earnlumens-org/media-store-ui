/**
 * Types for the favorites API endpoints.
 * Mirrors the backend FavoriteItemResponse / FavoritePageResponse DTOs.
 */

import type { ProfileBadge } from '@/lib/profileBadge'

// ── DTO (from server) ─────────────────────────────────────

export interface FavoriteItemDto {
  id: string
  itemId: string
  itemType: 'entry' | 'collection'
  entryType?: 'video' | 'audio' | 'image' | 'resource'
  title: string
  authorName?: string
  authorAvatarUrl?: string
  profileBadge?: string
  publishedAt?: string
  thumbnailUrl?: string
  coverUrl?: string
  durationSec?: number
  collectionType?: string
  itemsCount?: number
  locked: boolean
  unlocked: boolean
  addedAt?: string
}

export interface FavoritePageDto {
  content: FavoriteItemDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface ToggleFavoriteRequest {
  itemType: 'ENTRY' | 'COLLECTION'
}

export interface ToggleFavoriteResponse {
  favorited: boolean
}

export interface CheckFavoriteResponse {
  favorited: boolean
}

// ── Models (for UI) ───────────────────────────────────────

export interface FavoriteItemModel {
  id: string
  itemId: string
  itemType: 'entry' | 'collection'
  entryType?: 'video' | 'audio' | 'image' | 'resource'
  title: string
  authorName?: string
  authorAvatarUrl?: string
  profileBadge?: ProfileBadge
  publishedAt: string
  thumbnailUrl?: string
  coverUrl?: string
  durationSec?: number
  collectionType?: string
  itemsCount?: number
  locked: boolean
  unlocked: boolean
  addedAt: string
}

export interface FavoritePageModel {
  items: FavoriteItemModel[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}
