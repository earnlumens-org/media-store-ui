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
  restoreDeletedCollection as restoreDeletedCollectionFn,
  softDeleteCollection as softDeleteCollectionFn,
  unarchiveCollection as unarchiveCollectionFn,
  updateCollection,
} from './modules/collection.api'
import { archiveEntry, deleteEntry, getCreatorDashboardStats, getCreatorEntries, getStudioItems, restoreDeletedEntry, unarchiveEntry, updateEntryMetadata } from './modules/creator.api'
import { getExploreFeed, getProfileFeed, getPublishedEntries, getPublishedEntriesByUser, getPublishedEntryById } from './modules/entry.api'
import { checkFavorite, getFavorites, removeFavorite, toggleFavorite } from './modules/favorite.api'
import { createFranchise, getFranchiseConfig,
  getPublicFranchise,
  listMyFranchises,
  listPublicFranchises,
  presignFranchiseImage,
  updateMyFranchise,
  uploadFranchiseImage } from './modules/franchise.api'
import { getPaymentOrder, preparePayment, prepareTip, submitPayment } from './modules/payment.api'
import { createResellerLink, getResellerEntryInfo, listMyResellerLinks, updateResellerLinkWallet } from './modules/reseller.api'
import { getPurchaseCollections, getPurchasedFeed, getPurchases } from './modules/purchase.api'
import { deleteRating, getMyRating, getRatings, getRatingSummary, submitRating } from './modules/rating.api'
import { getSellerSales } from './modules/sales.api'
import { getSuggestions, search } from './modules/search.api'
import { getSpaceFeed, listSidebarSpaces } from './modules/spaces.api'
import { checkSubscription, getMySubscriberCount, getMySubscribers, getMySubscriptions, getPublicSubscriberCount, subscribe, unsubscribe } from './modules/subscription.api'
import { abortUpload, completeMultipartUpload, createEntry, finalizeUpload, getUploadConfig, getUploadPartUrl, initUpload, updateEntryStatus, uploadFileToR2, uploadToR2 } from './modules/upload.api'
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
    deleteEntry,
    restoreDeletedEntry,
    getSales: getSellerSales,
  },
  upload: {
    createEntry,
    initUpload,
    uploadToR2,
    uploadFileToR2,
    completeMultipartUpload,
    getUploadPartUrl,
    abortUpload,
    getUploadConfig,
    finalizeUpload,
    updateEntryStatus,
  },
  payment: {
    prepare: preparePayment,
    prepareTip,
    submit: submitPayment,
    getOrder: getPaymentOrder,
  },
  purchases: {
    list: getPurchases,
    collections: getPurchaseCollections,
    feed: getPurchasedFeed,
  },
  ratings: {
    get: getRatings,
    summary: getRatingSummary,
    submit: submitRating,
    remove: deleteRating,
    mine: getMyRating,
  },
  collections: {
    getPublished: getPublishedCollections,
    getDetail: getCollectionDetail,
    create: createCollection,
    update: updateCollection,
    publish: publishCollection,
    archive: archiveCollectionFn,
    unarchive: unarchiveCollectionFn,
    softDelete: softDeleteCollectionFn,
    restoreDeleted: restoreDeletedCollectionFn,
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
  /**
   * Tenant-managed publishing destinations. Drives the storefront sidebar
   * and per-space content pages.
   */
  spaces: {
    listSidebar: listSidebarSpaces,
    getFeed: getSpaceFeed,
  },
  /** Unified search: creator channels + content for the resolved tenant. */
  search: {
    query: search,
    suggestions: getSuggestions,
  },
  /** Public franchise storefronts under the resolved tenant. */
  franchises: {
    list: listPublicFranchises,
    getBySlug: getPublicFranchise,
    // Authenticated franchisee self-service.
    config: getFranchiseConfig,
    mine: listMyFranchises,
    create: createFranchise,
    updateMine: updateMyFranchise,
    presignImage: presignFranchiseImage,
    uploadImage: uploadFranchiseImage,
  },
  /** Reseller links: earn a commission for distributing a creator's paid content. */
  resellers: {
    entryInfo: getResellerEntryInfo,
    create: createResellerLink,
    mine: listMyResellerLinks,
    updateWallet: updateResellerLinkWallet,
  },
} as const

export { ApiError, apiRequest } from './apiRequest'
export { AccountBannedError, createSession, logout, refreshAccessToken } from './modules/auth.api'
export type { AccountBannedPayload } from './modules/auth.api'
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
export { archiveEntry, deleteEntry, getCreatorDashboardStats, getCreatorEntries, getStudioItems, restoreDeletedEntry, unarchiveEntry, updateEntryMetadata } from './modules/creator.api'
export { getPublishedEntries, getPublishedEntriesByUser, getPublishedEntryById } from './modules/entry.api'
export { checkFavorite, getFavorites, removeFavorite, toggleFavorite } from './modules/favorite.api'
export { createFranchise, getFranchiseConfig, getPublicFranchise, listMyFranchises, listPublicFranchises, presignFranchiseImage, updateMyFranchise, uploadFranchiseImage } from './modules/franchise.api'
export type { CreateFranchisePayload, FranchiseConfigDto, FranchiseImageSlot, FranchiseImageUploadInit, ManagedFranchiseDto, PublicFranchiseDto, UpdateFranchisePayload } from './modules/franchise.api'
export { getPaymentOrder, preparePayment, submitPayment } from './modules/payment.api'
export { createResellerLink, getResellerEntryInfo, listMyResellerLinks, updateResellerLinkWallet } from './modules/reseller.api'
export type { ResellerEntryInfoDto, ResellerLinkDto } from './modules/reseller.api'
export { getPurchaseCollections, getPurchases } from './modules/purchase.api'
export { getSellerSales } from './modules/sales.api'
export { checkSubscription, getMySubscriberCount, getMySubscribers, getMySubscriptions, getPublicSubscriberCount, subscribe, unsubscribe } from './modules/subscription.api'
export { abortUpload, completeMultipartUpload, createEntry, finalizeUpload, getUploadConfig, getUploadPartUrl, initUpload, isUploadAborted, R2UploadError, updateEntryStatus, uploadFileToR2, uploadToR2 } from './modules/upload.api'

export { checkUsernameExists, getCurrentUser, getUserByUsername, parseUserFromToken, updateContentLanguagePreferences } from './modules/user.api'

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
  FavoriteItemModel,
  FavoritePageModel,
} from './types/favorite.types'

export type {
  CollectionModel,
  CollectionsRequestParams,
  EntriesRequestParams,
  EntryModel,
  FeedItemModel,
  FeedPageModel,
  FeedRequestParams,
} from './types/feedItem.types'

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
