/**
 * API module for the public Spaces endpoints
 * (mounted under /public/spaces in media-store-api).
 *
 * Spaces are tenant-managed publishing destinations. The sidebar on the
 * storefront is driven by {@link listSidebarSpaces}, and {@link getSpaceFeed}
 * returns the published entries that belong to a given space.
 */

import type { PublicEntryModel, PublicEntryPageDto } from '../types/entry.types'
import type {
  EntryModel,
  FeedItemModel,
  FeedPageModel,
  FeedRequestParams,
} from '../types/feedItem.types'

import axiosClient from '../axios/axiosClient'
import { mapPublicEntryPageDtoToModel } from '../mappers/entry.mapper'

const BASE_PATH = '/public/spaces'

export interface SpaceSummaryDto {
  id: string
  /**
   * Stable slug. Used by the UI to recognise the system Explore space
   * (`key === 'explore'`) and render its title from the global i18n
   * bundle instead of from the {@code baseName}/translations map.
   */
  key: string
  systemSpace: boolean
  sortOrder: number
  icon: string
  /** {@code null} only for the system Explore space. */
  baseName: string | null
  translations: Record<string, string>
}

/**
 * Sidebar listing for the resolved tenant: ACTIVE spaces flagged
 * {@code showInSidebar=true}, ordered by {@code sortOrder} ascending.
 * Includes the system Explore space.
 */
export async function listSidebarSpaces (): Promise<SpaceSummaryDto[]> {
  const response = await axiosClient.get<SpaceSummaryDto[]>(BASE_PATH)
  return response.data
}

/**
 * Per-space feed. Returns entries-only data shaped as {@link FeedPageModel}
 * so the storefront grid can consume it without branching.
 *
 * The space feed only emits entries today; collections are not yet
 * space-aware on the backend. When that lands the adapter below can be
 * replaced by a richer mapper.
 */
export async function getSpaceFeed (
  spaceId: string,
  params: FeedRequestParams = {},
  signal?: AbortSignal,
): Promise<FeedPageModel> {
  const response = await axiosClient.get<PublicEntryPageDto>(
    `${BASE_PATH}/${encodeURIComponent(spaceId)}/feed`,
    { params, signal },
  )
  const page = mapPublicEntryPageDtoToModel(response.data)
  const items: FeedItemModel[] = page.items.map(model => ({
    kind: 'entry',
    entry: toFeedEntry(model),
  }))
  return {
    items,
    page: page.page,
    size: page.size,
    totalElements: page.totalElements,
    totalPages: page.totalPages,
  }
}

function toFeedEntry (m: PublicEntryModel): EntryModel {
  return {
    id: m.id,
    type: m.type,
    title: m.title,
    authorName: m.authorName,
    authorAvatarUrl: m.authorAvatarUrl,
    profileBadge: m.profileBadge,
    publishedAt: m.publishedAt,
    thumbnailUrl: m.thumbnailUrl,
    thumbnailSrcset: m.thumbnailSrcset,
    previewUrl: m.previewUrl,
    previewSrcset: m.previewSrcset,
    durationSec: m.durationSec,
    // Per-entry entitlement is decided by the page (purchases store) — not
    // pre-computed here, matching the explore-feed behaviour.
    locked: m.isPaid,
    resourceContent: m.resourceContent,
  }
}
