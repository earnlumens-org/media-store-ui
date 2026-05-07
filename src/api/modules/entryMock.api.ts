/**
 * Mock API for entries and collections feed.
 * This is a temporary implementation for development/testing.
 * TODO: Remove when real endpoints are available.
 */

import type {
  CollectionModel,
  CollectionsRequestParams,
  EntriesRequestParams,
  EntryModel,
  FeedPageDto,
  FeedPageModel,
  FeedRequestParams,
} from '../types/entryMock.types'
import axiosClient from '../axios/axiosClient'
import {
  mapCollectionDtoToModel,
  mapEntryDtoToModel,
  mapFeedPageDtoToModel,
} from '../mappers/entryMock.mapper'

const BASE_PATH = '/api/mock/entries'

/**
 * Get a paginated feed of mixed entries and collections.
 */
export async function getMockFeed (params: FeedRequestParams = {}): Promise<FeedPageModel> {
  const response = await axiosClient.get<FeedPageDto>(`${BASE_PATH}/feed`, { params })
  return mapFeedPageDtoToModel(response.data)
}

/**
 * Get a paginated list of entries only.
 */
export async function getMockEntries (params: EntriesRequestParams = {}): Promise<FeedPageModel> {
  const response = await axiosClient.get<FeedPageDto>(`${BASE_PATH}/entries`, { params })
  return mapFeedPageDtoToModel(response.data)
}

/**
 * Get a paginated list of collections only.
 */
export async function getMockCollections (params: CollectionsRequestParams = {}): Promise<FeedPageModel> {
  const response = await axiosClient.get<FeedPageDto>(`${BASE_PATH}/collections`, { params })
  return mapFeedPageDtoToModel(response.data)
}

/**
 * Get a single entry by ID.
 * @param id - Entry ID
 * @param type - Optional: force a specific type (for testing)
 */
export async function getMockEntryById (id: string, type?: string): Promise<EntryModel> {
  const params = type ? { type } : undefined
  const response = await axiosClient.get<EntryModel>(`${BASE_PATH}/entry/${id}`, { params })
  return mapEntryDtoToModel(response.data as any)
}

/**
 * Get a single collection by ID.
 */
export async function getMockCollectionById (id: string): Promise<CollectionModel> {
  const response = await axiosClient.get<CollectionModel>(`${BASE_PATH}/collection/${id}`)
  return mapCollectionDtoToModel(response.data as any)
}
