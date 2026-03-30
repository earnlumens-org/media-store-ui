/**
 * API module for public entry endpoints.
 * These are the REAL endpoints (not mock) for published entries.
 */

import type { PublicEntryDto, PublicEntryModel, PublicEntryPageDto, PublicEntryPageModel, PublicEntryRequestParams, UserEntryRequestParams } from '../types/entry.types'
import type { FeedRequestParams, PublicFeedPageDto, PublicFeedPageModel } from '../types/feed.types'

import { getToken } from '@/services/tokenWorkerClient'

import axiosClient from '../axios/axiosClient'
import { mapPublicEntryDtoToModel, mapPublicEntryPageDtoToModel } from '../mappers/entry.mapper'
import { mapFeedPageDtoToModel } from '../mappers/feed.mapper'

const BASE_PATH = '/public/entries'

/**
 * Get a paginated list of published entries for the current tenant.
 * Sorted by publishedAt descending (most recent first).
 * No authentication required.
 */
export async function getPublishedEntries (params: PublicEntryRequestParams = {}): Promise<PublicEntryPageModel> {
  const response = await axiosClient.get<PublicEntryPageDto>(BASE_PATH, { params })
  return mapPublicEntryPageDtoToModel(response.data)
}

/**
 * Get a paginated list of published entries by a specific user.
 * Optionally filtered by type (video, audio, image, entry, file).
 * No authentication required.
 */
export async function getPublishedEntriesByUser (username: string, params: UserEntryRequestParams = {}): Promise<PublicEntryPageModel> {
  const response = await axiosClient.get<PublicEntryPageDto>(`${BASE_PATH}/by-user/${username}`, { params })
  return mapPublicEntryPageDtoToModel(response.data)
}

/**
 * Get a single published entry by ID.
 * Returns the authoritative entry data from the database.
 * No authentication required.
 */
export async function getPublishedEntryById (id: string): Promise<PublicEntryModel> {
  const response = await axiosClient.get<PublicEntryDto>(`${BASE_PATH}/${id}`)
  return mapPublicEntryDtoToModel(response.data)
}

/**
 * Get a unified profile feed (entries + collections merged server-side).
 * Uses the viewer's auth token (if present) to resolve locked/unlocked state.
 */
export async function getProfileFeed (username: string, params: FeedRequestParams = {}): Promise<PublicFeedPageModel> {
  const headers: Record<string, string> = {}
  try {
    const result = await getToken()
    if (result?.accessToken) {
      headers['Authorization'] = `Bearer ${result.accessToken}`
    }
  } catch {
    // continue without token — anonymous viewer
  }
  const response = await axiosClient.get<PublicFeedPageDto>(`${BASE_PATH}/by-user/${username}/feed`, { params, headers })
  return mapFeedPageDtoToModel(response.data)
}

/**
 * Get a unified explore feed (ALL published entries + collections merged server-side).
 * No authentication required. Locked/unlocked resolved client-side.
 */
export async function getExploreFeed (params: FeedRequestParams = {}): Promise<PublicFeedPageModel> {
  const response = await axiosClient.get<PublicFeedPageDto>(`${BASE_PATH}/feed`, { params })
  return mapFeedPageDtoToModel(response.data)
}
