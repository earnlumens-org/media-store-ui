/**
 * Types for the unified public search experience (channels + content).
 * Mirrors the media-store-api /public/search payloads.
 */

import type { PublicFeedPageDto, PublicFeedPageModel } from './feed.types'
import type { ProfileBadge } from '@/lib/profileBadge'

// ==================== DTOs (from server) ====================

export interface SearchChannelDto {
  username: string
  avatarUrl?: string
  badge?: string
  contentCount: number
}

export interface SearchResultsDto {
  channels: SearchChannelDto[]
  content: PublicFeedPageDto
  /**
   * True when an anonymous visitor has exhausted their free search budget
   * and the backend wants them to sign in before serving more results.
   */
  requiresLogin: boolean
}

export interface SearchSuggestionsDto {
  suggestions: string[]
}

// ==================== Models (for UI) ====================

export interface SearchChannelModel {
  username: string
  avatarUrl?: string
  profileBadge?: ProfileBadge
  contentCount: number
}

export interface SearchResultsModel {
  channels: SearchChannelModel[]
  content: PublicFeedPageModel
  requiresLogin: boolean
}

// ==================== Request params ====================

export interface SearchRequestParams {
  q: string
  /** "video" | "audio" | "image" | "resource" | "collection" — omit for all. */
  type?: string
  sort?: 'relevance' | 'newest' | 'oldest' | 'views'
  page?: number
  size?: number
}
