/**
 * API module for public entry endpoints.
 * These are the REAL endpoints (not mock) for published entries.
 */

import type { PublicEntryPageDto, PublicEntryPageModel, PublicEntryRequestParams } from '../types/entry.types'

import axiosClient from '../axios/axiosClient'
import { mapPublicEntryPageDtoToModel } from '../mappers/entry.mapper'

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
