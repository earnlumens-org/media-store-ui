import type { ProfileBadge } from '@/lib/profileBadge'

// ==================== DTOs (from server) ====================

export interface EntryDto {
  kind: 'entry'
  id: string
  type: 'video' | 'audio' | 'entry' | 'image'
  title: string
  authorName: string
  authorAvatarUrl?: string
  profileBadge?: string
  publishedAt: string
  thumbnailUrl?: string
  durationSec?: number
  locked?: boolean
}

export interface CollectionDto {
  kind: 'collection'
  id: string
  collectionType: string
  title: string
  authorName: string
  authorAvatarUrl?: string
  profileBadge?: string
  publishedAt: string
  coverUrl?: string
  itemsCount?: number
  totalDurationSec?: number
  locked?: boolean
}

export type FeedItemDto = EntryDto | CollectionDto

export interface FeedPageDto {
  content: FeedItemDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

// ==================== Models (for UI) ====================

export interface EntryModel {
  id: string
  type: 'video' | 'audio' | 'entry' | 'image'
  title: string
  authorName: string
  authorAvatarUrl?: string
  profileBadge?: ProfileBadge
  publishedAt: string | Date
  thumbnailUrl?: string
  durationSec?: number
  locked?: boolean
}

export interface CollectionModel {
  id: string
  collectionType: string
  title: string
  authorName: string
  authorAvatarUrl?: string
  profileBadge?: ProfileBadge
  publishedAt: string | Date
  coverUrl?: string
  itemsCount?: number
  totalDurationSec?: number
  locked?: boolean
}

export type FeedItemModel = { kind: 'entry', entry: EntryModel } | { kind: 'collection', collection: CollectionModel }

export interface FeedPageModel {
  items: FeedItemModel[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

// ==================== Request params ====================

export interface FeedRequestParams {
  page?: number
  size?: number
}

export interface EntriesRequestParams extends FeedRequestParams {
  type?: 'video' | 'audio' | 'entry' | 'image'
}

export interface CollectionsRequestParams extends FeedRequestParams {
  collectionType?: string
}
