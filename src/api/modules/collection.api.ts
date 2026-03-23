/**
 * API module for collection endpoints.
 *
 * Public endpoints use /public/collections (no auth).
 * Authenticated endpoints use /api/collections (Bearer token via apiRequest).
 */

import type {
  CollectionDetailDto,
  CollectionDetailModel,
  CollectionItemModel,
  CollectionPageDto,
  CollectionPageModel,
  CreateCollectionRequest,
  InitCoverUploadResponse,
  UpdateCollectionRequest,
} from '../types/collection.types'

import { apiRequest } from '../apiRequest'
import {
  mapCollectionDetailDtoToModel,
  mapCollectionDtoToModel,
  mapCollectionPageDtoToModel,
} from '../mappers/collection.mapper'

const PUBLIC_PATH = '/public/collections'
const API_PATH = '/api/collections'

// ── Public Endpoints ──────────────────────────────────────

export async function getPublishedCollections (
  params: { page?: number, size?: number, username?: string } = {},
): Promise<CollectionPageModel> {
  const query = new URLSearchParams()
  if (params.page != null) {
    query.set('page', String(params.page))
  }
  if (params.size != null) {
    query.set('size', String(params.size))
  }
  if (params.username) {
    query.set('username', params.username)
  }
  const qs = query.toString()
  const url = qs ? `${PUBLIC_PATH}?${qs}` : PUBLIC_PATH

  const dto = await apiRequest<CollectionPageDto>(url)
  return mapCollectionPageDtoToModel(dto)
}

export async function getCollectionDetail (id: string): Promise<CollectionDetailModel> {
  const dto = await apiRequest<CollectionDetailDto>(`${PUBLIC_PATH}/${id}`)
  return mapCollectionDetailDtoToModel(dto)
}

// ── Authenticated Endpoints ───────────────────────────────

export async function createCollection (data: CreateCollectionRequest): Promise<CollectionItemModel> {
  const dto = await apiRequest<any>(`${API_PATH}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return mapCollectionDtoToModel(dto)
}

export async function updateCollection (id: string, data: UpdateCollectionRequest): Promise<void> {
  await apiRequest(`${API_PATH}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function publishCollection (id: string): Promise<void> {
  await apiRequest(`${API_PATH}/${id}/publish`, { method: 'PATCH' })
}

export async function archiveCollection (id: string): Promise<void> {
  await apiRequest(`${API_PATH}/${id}/archive`, { method: 'PATCH' })
}

export async function unarchiveCollection (id: string): Promise<void> {
  await apiRequest(`${API_PATH}/${id}/unarchive`, { method: 'PATCH' })
}

export async function deleteCollection (id: string): Promise<void> {
  await apiRequest(`${API_PATH}/${id}`, { method: 'DELETE' })
}

export async function getMyCollections (
  params: { page?: number, size?: number } = {},
): Promise<CollectionPageModel> {
  const query = new URLSearchParams()
  if (params.page != null) {
    query.set('page', String(params.page))
  }
  if (params.size != null) {
    query.set('size', String(params.size))
  }
  const qs = query.toString()
  const url = qs ? `${API_PATH}/mine?${qs}` : `${API_PATH}/mine`

  const dto = await apiRequest<CollectionPageDto>(url)
  return mapCollectionPageDtoToModel(dto)
}

// ── Item Management ───────────────────────────────────────

export async function addItem (collectionId: string, entryId: string): Promise<void> {
  await apiRequest(`${API_PATH}/${collectionId}/items`, {
    method: 'POST',
    body: JSON.stringify({ entryId }),
  })
}

export async function removeItem (collectionId: string, entryId: string): Promise<void> {
  await apiRequest(`${API_PATH}/${collectionId}/items/${entryId}`, {
    method: 'DELETE',
  })
}

export async function reorderItems (collectionId: string, entryIds: string[]): Promise<void> {
  await apiRequest(`${API_PATH}/${collectionId}/items/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ entryIds }),
  })
}

// ── Cover Upload ──────────────────────────────────────────

export async function initCoverUpload (
  collectionId: string,
  fileName: string,
  contentType: string,
): Promise<InitCoverUploadResponse> {
  return apiRequest<InitCoverUploadResponse>(`${API_PATH}/${collectionId}/cover/init`, {
    method: 'POST',
    body: JSON.stringify({ fileName, contentType }),
  })
}

export async function finalizeCoverUpload (
  collectionId: string,
  r2Key: string,
): Promise<void> {
  await apiRequest(`${API_PATH}/${collectionId}/cover/finalize`, {
    method: 'POST',
    body: JSON.stringify({ r2Key }),
  })
}
