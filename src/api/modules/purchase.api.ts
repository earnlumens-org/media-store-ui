/**
 * API module for listing the user's purchased content.
 *
 * Endpoint: GET /api/purchases?page=0&size=24
 * Requires authentication (Bearer token via apiRequest).
 */

import type {
  PurchasedCollectionPageDto,
  PurchasedCollectionPageModel,
  PurchasedEntryPageDto,
  PurchasedEntryPageModel,
} from '../types/purchase.types'

import { apiRequest } from '../apiRequest'
import { mapPurchasedCollectionPageDtoToModel, mapPurchasedEntryPageDtoToModel } from '../mappers/purchase.mapper'

const BASE_PATH = '/api/purchases'

/**
 * Fetch a paginated list of entries the current user has purchased.
 * Sorted by purchase date descending (most recent first).
 */
export async function getPurchases (
  params: { page?: number, size?: number } = {},
): Promise<PurchasedEntryPageModel> {
  const query = new URLSearchParams()
  if (params.page != null) query.set('page', String(params.page))
  if (params.size != null) query.set('size', String(params.size))

  const qs = query.toString()
  const url = qs ? `${BASE_PATH}?${qs}` : BASE_PATH

  const dto = await apiRequest<PurchasedEntryPageDto>(url)
  return mapPurchasedEntryPageDtoToModel(dto)
}

/**
 * Fetch a paginated list of collections the current user has purchased.
 * Uses GET /api/purchases/collections.
 */
export async function getPurchaseCollections (
  params: { page?: number, size?: number } = {},
): Promise<PurchasedCollectionPageModel> {
  const query = new URLSearchParams()
  if (params.page != null) query.set('page', String(params.page))
  if (params.size != null) query.set('size', String(params.size))

  const qs = query.toString()
  const url = qs ? `${BASE_PATH}/collections?${qs}` : `${BASE_PATH}/collections`

  const dto = await apiRequest<PurchasedCollectionPageDto>(url)
  return mapPurchasedCollectionPageDtoToModel(dto)
}
