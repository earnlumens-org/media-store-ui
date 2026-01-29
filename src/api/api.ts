import { createSession, logout, refreshAccessToken } from './modules/auth.api'
import {
  getMockCollectionById,
  getMockCollections,
  getMockEntries,
  getMockEntryById,
  getMockFeed,
} from './modules/entryMock.api'
import { checkUsernameExists, getCurrentUser, getUserByUsername } from './modules/user.api'
import { getWaitlistStats, subscribeWaitlist } from './modules/waitlist.api'

export const api = {
  auth: {
    createSession,
    refresh: refreshAccessToken,
    logout,
  },
  user: {
    me: getCurrentUser,
    getByUsername: getUserByUsername,
    checkExists: checkUsernameExists,
  },
  waitlist: {
    getStats: getWaitlistStats,
    subscribe: subscribeWaitlist,
  },
  /** Mock API - TODO: Remove when real endpoints are available */
  mock: {
    getFeed: getMockFeed,
    getEntries: getMockEntries,
    getCollections: getMockCollections,
    getEntryById: getMockEntryById,
    getCollectionById: getMockCollectionById,
  },
} as const

export { ApiError, apiRequest } from './apiRequest'
export { createSession, logout, refreshAccessToken } from './modules/auth.api'
export {
  getMockCollectionById,
  getMockCollections,
  getMockEntries,
  getMockEntryById,
  getMockFeed,
} from './modules/entryMock.api'
export { checkUsernameExists, getCurrentUser, getUserByUsername, parseUserFromToken } from './modules/user.api'
export { getWaitlistStats } from './modules/waitlist.api'

export type {
  CollectionModel,
  CollectionsRequestParams,
  EntriesRequestParams,
  EntryModel,
  FeedItemModel,
  FeedPageModel,
  FeedRequestParams,
} from './types/entryMock.types'

export type {
  MessageResponseDto,
  MessageResponseModel,
  WaitlistStatsDto,
  WaitlistStatsModel,
  WaitlistSubscribeRequestDto,
} from './types/waitlist.types'
