import { createSession, logout, refreshAccessToken } from './modules/auth.api'
import { getPublishedEntries, getPublishedEntriesByUser, getPublishedEntryById } from './modules/entry.api'
import {
  getMockCollectionById,
  getMockCollections,
  getMockEntries,
  getMockEntryById,
  getMockFeed,
} from './modules/entryMock.api'
import { createEntry, finalizeUpload, initUpload, updateEntryStatus, uploadToR2 } from './modules/upload.api'
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
  entries: {
    getPublished: getPublishedEntries,
    getById: getPublishedEntryById,
    getByUser: getPublishedEntriesByUser,
  },
  upload: {
    createEntry,
    initUpload,
    uploadToR2,
    finalizeUpload,
    updateEntryStatus,
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
export { getPublishedEntries, getPublishedEntriesByUser, getPublishedEntryById } from './modules/entry.api'
export {
  getMockCollectionById,
  getMockCollections,
  getMockEntries,
  getMockEntryById,
  getMockFeed,
} from './modules/entryMock.api'
export { createEntry, finalizeUpload, initUpload, updateEntryStatus, uploadToR2 } from './modules/upload.api'
export { checkUsernameExists, getCurrentUser, getUserByUsername, parseUserFromToken } from './modules/user.api'
export { getWaitlistStats } from './modules/waitlist.api'

export type {
  PublicEntryModel,
  PublicEntryPageModel,
  PublicEntryRequestParams,
  UserEntryRequestParams,
} from './types/entry.types'

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
  AssetKind,
  CreateEntryRequest,
  CreateEntryResponse,
  EntryStatus,
  EntryType,
  FinalizeUploadRequest,
  FinalizeUploadResponse,
  InitUploadRequest,
  InitUploadResponse,
  UpdateEntryStatusRequest,
  UploadContentType,
} from './types/upload.types'

export {
  ACCEPTED_MIMES,
  formatFileSize,
  MAX_FILE_SIZES,
  MAX_THUMBNAIL_SIZE,
  THUMBNAIL_MIMES,
  toEntryType,
  UPLOAD_CONTENT_TYPES,
} from './types/upload.types'

export type {
  MessageResponseDto,
  MessageResponseModel,
  WaitlistStatsDto,
  WaitlistStatsModel,
  WaitlistSubscribeRequestDto,
} from './types/waitlist.types'
