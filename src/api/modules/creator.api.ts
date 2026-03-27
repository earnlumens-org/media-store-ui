/**
 * Creator Studio API module.
 *
 * Provides entry management for the authenticated creator:
 * - List own entries (all statuses) via GET /api/entries/mine
 * - Get dashboard stats (computed from entries list)
 * - Update entry metadata
 * - Delete entries via DELETE /api/entries/:id
 */

import type {
  CreatorDashboardStats,
  CreatorEntryFilters,
  CreatorEntryModel,
  CreatorEntryPageModel,
  StudioItemModel,
  StudioPageModel,
  UpdateEntryMetadataRequest,
} from '../types/creator.types'
import { getCdnBaseUrl } from '@/config/env'
import { apiRequest } from '../apiRequest'

/** Raw DTO from GET /api/entries/mine */
interface OwnerEntryDto {
  id: string
  type: string
  title: string
  description?: string
  status: string
  thumbnailR2Key?: string
  previewR2Key?: string
  isPaid: boolean
  priceXlm?: number
  priceUsd?: number
  priceCurrency?: string
  contentLanguage?: string
  durationSec?: number
  viewCount?: number
  createdAt?: string
  updatedAt?: string
  publishedAt?: string
  transcodingStatus?: string
  sellerWallet?: string
}

interface OwnerEntryPageDto {
  content: OwnerEntryDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

function r2KeyToCdnUrl (r2Key?: string): string | undefined {
  if (!r2Key) {
    return undefined
  }
  return `${getCdnBaseUrl()}/${r2Key}`
}

function dtoToCreatorEntry (dto: OwnerEntryDto): CreatorEntryModel {
  return {
    id: dto.id,
    type: (dto.type?.toUpperCase() ?? 'RESOURCE') as CreatorEntryModel['type'],
    title: dto.title,
    description: dto.description,
    status: dto.status as CreatorEntryModel['status'],
    thumbnailUrl: r2KeyToCdnUrl(dto.thumbnailR2Key),
    isPaid: dto.isPaid,
    priceXlm: dto.priceXlm,
    priceUsd: dto.priceUsd,
    priceCurrency: (dto.priceCurrency as 'XLM' | 'USD') ?? undefined,
    contentLanguage: dto.contentLanguage,
    createdAt: dto.createdAt ?? '',
    updatedAt: dto.updatedAt ?? '',
    publishedAt: dto.publishedAt ?? '',
    views: dto.viewCount ?? 0,
    purchases: 0,
    revenue: 0,
    transcodingStatus: dto.transcodingStatus,
    sellerWallet: dto.sellerWallet,
  }
}

/**
 * Fetch the creator's own entries via GET /api/entries/mine.
 * Returns entries across all statuses (DRAFT, IN_REVIEW, PUBLISHED, etc.).
 */
export async function getCreatorEntries (
  filters: CreatorEntryFilters = {},
): Promise<CreatorEntryPageModel> {
  const params = new URLSearchParams()

  if (filters.status && filters.status !== 'ALL') {
    params.set('status', filters.status)
  }
  if (filters.type && filters.type !== 'ALL') {
    params.set('type', filters.type.toLowerCase())
  }
  params.set('page', String(filters.page ?? 0))
  params.set('size', String(filters.size ?? 50))

  const qs = params.toString()
  const dto = await apiRequest<OwnerEntryPageDto>(`/api/entries/mine?${qs}`)

  let items = dto.content.map(entry => dtoToCreatorEntry(entry))

  // Client-side search filter (backend doesn't support text search yet)
  if (filters.search) {
    const q = filters.search.toLowerCase()
    items = items.filter(e =>
      e.title.toLowerCase().includes(q)
      || (e.description ?? '').toLowerCase().includes(q),
    )
  }

  // Client-side sort
  switch (filters.sort) {
    case 'oldest': {
      items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      break
    }
    case 'title_asc': {
      items.sort((a, b) => a.title.localeCompare(b.title))
      break
    }
    case 'title_desc': {
      items.sort((a, b) => b.title.localeCompare(a.title))
      break
    }
    default: {
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      break
    }
  }

  return {
    items,
    page: dto.page,
    size: dto.size,
    totalElements: dto.totalElements,
    totalPages: dto.totalPages,
  }
}

/** DTO returned by GET /api/entries/mine/stats */
interface OwnerStatsDto {
  totalEntries: number
  published: number
  drafts: number
  inReview: number
  rejected: number
  archived: number
  totalViews: number
  totalSales: number
}

/**
 * Get dashboard statistics for the creator.
 * Calls the dedicated server-side aggregation endpoint.
 */
export async function getCreatorDashboardStats (): Promise<CreatorDashboardStats> {
  const stats = await apiRequest<OwnerStatsDto>('/api/entries/mine/stats')

  return {
    totalEntries: stats.totalEntries ?? 0,
    published: stats.published ?? 0,
    drafts: stats.drafts ?? 0,
    inReview: stats.inReview ?? 0,
    rejected: stats.rejected ?? 0,
    archived: stats.archived ?? 0,
    totalViews: stats.totalViews ?? 0,
    totalSales: stats.totalSales ?? 0,
  }
}

/**
 * Update entry metadata (title, description, price).
 */
export async function updateEntryMetadata (
  entryId: string,
  data: UpdateEntryMetadataRequest,
): Promise<void> {
  return apiRequest<void>(`/api/entries/${entryId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/**
 * Archive an entry via PATCH /api/entries/:id/status.
 */
export async function archiveEntry (entryId: string): Promise<void> {
  return apiRequest<void>(`/api/entries/${entryId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'ARCHIVED' }),
  })
}

/**
 * Unarchive an entry — restores it to its previous status.
 */
export async function unarchiveEntry (entryId: string): Promise<void> {
  return apiRequest<void>(`/api/entries/${entryId}/unarchive`, {
    method: 'PATCH',
  })
}

// ==================== Unified Studio Feed ====================

/** Raw DTO from GET /api/entries/mine/studio */
interface StudioItemDto {
  id: string
  kind: 'entry' | 'collection'
  type?: string
  title: string
  description?: string
  status: string
  thumbnailR2Key?: string
  coverR2Key?: string
  isPaid: boolean
  priceXlm?: number
  priceUsd?: number
  priceCurrency?: string
  contentLanguage?: string
  durationSec?: number
  viewCount: number
  itemCount: number
  createdAt?: string
  updatedAt?: string
  publishedAt?: string
  transcodingStatus?: string
  sellerWallet?: string
}

interface StudioPageDto {
  content: StudioItemDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

function studioDtoToModel (dto: StudioItemDto): StudioItemModel {
  return {
    id: dto.id,
    kind: dto.kind,
    type: dto.type ?? 'resource',
    title: dto.title,
    description: dto.description,
    status: dto.status,
    thumbnailUrl: r2KeyToCdnUrl(dto.thumbnailR2Key),
    coverUrl: r2KeyToCdnUrl(dto.coverR2Key),
    isPaid: dto.isPaid,
    priceXlm: dto.priceXlm,
    priceUsd: dto.priceUsd,
    priceCurrency: dto.priceCurrency,
    contentLanguage: dto.contentLanguage,
    durationSec: dto.durationSec,
    viewCount: dto.viewCount ?? 0,
    itemCount: dto.itemCount ?? 0,
    createdAt: dto.createdAt ?? '',
    updatedAt: dto.updatedAt ?? '',
    publishedAt: dto.publishedAt,
    transcodingStatus: dto.transcodingStatus,
    sellerWallet: dto.sellerWallet,
  }
}

export interface StudioFeedFilters {
  status?: string
  type?: string
  search?: string
  sort?: string
  page?: number
  size?: number
}

/**
 * Unified Creator Studio feed — entries + collections merged server-side.
 * GET /api/entries/mine/studio
 */
export async function getStudioItems (
  filters: StudioFeedFilters = {},
): Promise<StudioPageModel> {
  const params = new URLSearchParams()

  if (filters.status && filters.status !== 'ALL') {
    params.set('status', filters.status)
  }
  if (filters.type && filters.type !== 'ALL') {
    params.set('type', filters.type)
  }
  if (filters.search) {
    params.set('search', filters.search)
  }
  params.set('sort', filters.sort ?? 'newest')
  params.set('page', String(filters.page ?? 0))
  params.set('size', String(filters.size ?? 20))

  const qs = params.toString()
  const dto = await apiRequest<StudioPageDto>(`/api/entries/mine/studio?${qs}`)

  return {
    items: dto.content.map(studioDtoToModel),
    page: dto.page,
    size: dto.size,
    totalElements: dto.totalElements,
    totalPages: dto.totalPages,
  }
}
