/**
 * API module for public entry endpoints.
 * These are the REAL endpoints (not mock) for published entries.
 */

import type { PublicEntryDto, PublicEntryModel, PublicEntryPageDto, PublicEntryPageModel, PublicEntryRequestParams, UserEntryRequestParams } from '../types/entry.types'

import axiosClient from '../axios/axiosClient'
import { mapPublicEntryDtoToModel, mapPublicEntryPageDtoToModel } from '../mappers/entry.mapper'

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
