import { createSession, logout, refreshAccessToken } from './modules/auth.api'
import { claimBadge, getMyBadges } from './modules/badge.api'
import {
  addItem,
  archiveCollection as archiveCollectionFn,
  createCollection,
  deleteCollection,
  finalizeCoverUpload,
  getCollectionDetail,
  getMyCollections,
  getPublishedCollections,
  initCoverUpload,
  publishCollection,
  removeItem,
  reorderItems,
  unarchiveCollection as unarchiveCollectionFn,
  updateCollection,
} from './modules/collection.api'
import { archiveEntry, getCreatorDashboardStats, getCreatorEntries, getStudioItems, unarchiveEntry, updateEntryMetadata } from './modules/creator.api'
import { getExploreFeed, getProfileFeed, getPublishedEntries, getPublishedEntriesByUser, getPublishedEntryById } from './modules/entry.api'
import {
  getMockCollectionById,
  getMockCollections,
  getMockCommunityFeed,
  getMockEcosystemFeed,
  getMockEntries,
  getMockEntryById,
  getMockFeed,
  getMockFirstStepsFeed,
} from './modules/entryMock.api'
import { checkFavorite, getFavorites, removeFavorite, toggleFavorite } from './modules/favorite.api'
import { preparePayment, submitPayment } from './modules/payment.api'
import { getPurchaseCollections, getPurchasedFeed, getPurchases } from './modules/purchase.api'
import { getSellerSales } from './modules/sales.api'
import { checkSubscription, getMySubscriberCount, getMySubscribers, getMySubscriptions, getPublicSubscriberCount, subscribe, unsubscribe } from './modules/subscription.api'
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
  badges: {
    claim: claimBadge,
    me: getMyBadges,
  },
  waitlist: {
    getStats: getWaitlistStats,
    subscribe: subscribeWaitlist,
  },
  entries: {
    getPublished: getPublishedEntries,
    getById: getPublishedEntryById,
    getByUser: getPublishedEntriesByUser,
    getProfileFeed,
    getExploreFeed,
  },
  creator: {
    getEntries: getCreatorEntries,
    getStudioItems,
    getDashboardStats: getCreatorDashboardStats,
    updateMetadata: updateEntryMetadata,
    archiveEntry,
    unarchiveEntry,
    getSales: getSellerSales,
  },
  upload: {
    createEntry,
    initUpload,
    uploadToR2,
    finalizeUpload,
    updateEntryStatus,
  },
  payment: {
    prepare: preparePayment,
    submit: submitPayment,
  },
  purchases: {
    list: getPurchases,
    collections: getPurchaseCollections,
    feed: getPurchasedFeed,
  },
  collections: {
    getPublished: getPublishedCollections,
    getDetail: getCollectionDetail,
    create: createCollection,
    update: updateCollection,
    publish: publishCollection,
    archive: archiveCollectionFn,
    unarchive: unarchiveCollectionFn,
    delete: deleteCollection,
    getMine: getMyCollections,
    addItem,
    removeItem,
    reorderItems,
    initCoverUpload,
    finalizeCoverUpload,
  },
  favorites: {
    list: getFavorites,
    toggle: toggleFavorite,
    check: checkFavorite,
    remove: removeFavorite,
  },
  subscriptions: {
    subscribe,
    unsubscribe,
    check: checkSubscription,
    mySubscriptions: getMySubscriptions,
    mySubscribers: getMySubscribers,
    mySubscriberCount: getMySubscriberCount,
    publicCount: getPublicSubscriberCount,
  },
  /** Mock API - TODO: Remove when real endpoints are available */
  mock: {
    getFeed: getMockFeed,
    getCommunityFeed: getMockCommunityFeed,
    getEcosystemFeed: getMockEcosystemFeed,
    getFirstStepsFeed: getMockFirstStepsFeed,
    getEntries: getMockEntries,
    getCollections: getMockCollections,
    getEntryById: getMockEntryById,
    getCollectionById: getMockCollectionById,
  },
} as const

export { ApiError, apiRequest } from './apiRequest'
export { createSession, logout, refreshAccessToken } from './modules/auth.api'
export {
  addItem,
  archiveCollection as archiveCollectionFn,
  createCollection,
  deleteCollection,
  finalizeCoverUpload,
  getCollectionDetail,
  getMyCollections,
  getPublishedCollections,
  initCoverUpload,
  publishCollection,
  removeItem,
  reorderItems,
  unarchiveCollection as unarchiveCollectionFn,
  updateCollection,
} from './modules/collection.api'
export { archiveEntry, getCreatorDashboardStats, getCreatorEntries, getStudioItems, unarchiveEntry, updateEntryMetadata } from './modules/creator.api'
export { getPublishedEntries, getPublishedEntriesByUser, getPublishedEntryById } from './modules/entry.api'
export {
  getMockCollectionById,
  getMockCollections,
  getMockCommunityFeed,
  getMockEcosystemFeed,
  getMockEntries,
  getMockEntryById,
  getMockFeed,
  getMockFirstStepsFeed,
} from './modules/entryMock.api'
export { checkFavorite, getFavorites, removeFavorite, toggleFavorite } from './modules/favorite.api'
export { preparePayment, submitPayment } from './modules/payment.api'
export { getPurchaseCollections, getPurchases } from './modules/purchase.api'
export { getSellerSales } from './modules/sales.api'
export { checkSubscription, getMySubscriberCount, getMySubscribers, getMySubscriptions, getPublicSubscriberCount, subscribe, unsubscribe } from './modules/subscription.api'
export { createEntry, finalizeUpload, initUpload, updateEntryStatus, uploadToR2 } from './modules/upload.api'

export { checkUsernameExists, getCurrentUser, getUserByUsername, parseUserFromToken } from './modules/user.api'

export { getWaitlistStats } from './modules/waitlist.api'

export type {
  CollectionDetailModel,
  CollectionEntryItemModel,
  CollectionItemModel,
  CollectionPageModel,
} from './types/collection.types'

export type {
  CreatorDashboardStats,
  CreatorEntryFilters,
  CreatorEntryModel,
  CreatorEntryPageModel,
  StudioItemModel,
  StudioPageModel,
  UpdateEntryMetadataRequest,
} from './types/creator.types'

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
  FavoriteItemModel,
  FavoritePageModel,
} from './types/favorite.types'

export type {
  PreparePaymentModel,
  PreparePaymentResponseDto,
  SubmitPaymentModel,
  SubmitPaymentResponseDto,
} from './types/payment.types'
export type {
  PurchasedEntryModel,
  PurchasedEntryPageModel,
} from './types/purchase.types'
export type {
  PurchasedCollectionModel,
  PurchasedCollectionPageModel,
} from './types/purchase.types'

export type {
  SellerSaleModel,
  SellerSaleSplit,
} from './types/sales.types'

export type {
  SubscriptionPageModel,
  SubscriptionUserModel,
} from './types/subscription.types'

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
