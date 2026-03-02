/**
 * API module for user favorites.
 *
 * Endpoints:
 *   GET    /api/favorites              — paginated list
 *   POST   /api/favorites/{itemId}     — toggle (add/remove)
 *   GET    /api/favorites/check/{itemId} — check if favorited
 *   DELETE /api/favorites/{itemId}     — explicit remove
 *
 * All endpoints require authentication (Bearer token via apiRequest).
 */

import type {
  CheckFavoriteResponse,
  FavoritePageDto,
  FavoritePageModel,
  ToggleFavoriteResponse,
} from '../types/favorite.types'

import { apiRequest } from '../apiRequest'
import { mapFavoritePageDtoToModel } from '../mappers/favorite.mapper'

const BASE_PATH = '/api/favorites'

/**
 * Fetch a paginated list of the current user's favorites.
 * Sorted by addedAt descending (most recently saved first).
 */
export async function getFavorites (
  params: { page?: number, size?: number } = {},
): Promise<FavoritePageModel> {
  const query = new URLSearchParams()
  if (params.page != null) {
    query.set('page', String(params.page))
  }
  if (params.size != null) {
    query.set('size', String(params.size))
  }

  const qs = query.toString()
  const url = qs ? `${BASE_PATH}?${qs}` : BASE_PATH

  const dto = await apiRequest<FavoritePageDto>(url)
  return mapFavoritePageDtoToModel(dto)
}

/**
 * Toggle a favorite (add if not present, remove if already favorited).
 * Returns { favorited: true } if added, { favorited: false } if removed.
 */
export async function toggleFavorite (
  itemId: string,
  itemType: 'ENTRY' | 'COLLECTION',
): Promise<ToggleFavoriteResponse> {
  return apiRequest<ToggleFavoriteResponse>(`${BASE_PATH}/${itemId}`, {
    method: 'POST',
    body: JSON.stringify({ itemType }),
  })
}

/**
 * Check if a specific item is favorited by the current user.
 */
export async function checkFavorite (itemId: string): Promise<boolean> {
  const response = await apiRequest<CheckFavoriteResponse>(`${BASE_PATH}/check/${itemId}`)
  return response.favorited
}

/**
 * Explicitly remove an item from favorites (idempotent).
 */
export async function removeFavorite (itemId: string): Promise<void> {
  await apiRequest(`${BASE_PATH}/${itemId}`, { method: 'DELETE' })
}
