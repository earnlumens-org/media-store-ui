/**
 * API module for the rating / review system.
 *
 * Public (no auth):
 *   GET /public/ratings/{targetType}/{targetId}          — aggregate + paginated reviews
 *   GET /public/ratings/{targetType}/{targetId}/summary  — aggregate only
 *
 * Authenticated:
 *   POST   /api/ratings/{targetType}/{targetId}  — create/update my rating
 *   DELETE /api/ratings/{targetType}/{targetId}  — remove my rating
 *   GET    /api/ratings/{targetType}/{targetId}/me — fetch my rating
 */

import type {
  RatingAggregate,
  RatingItem,
  RatingList,
  RatingTargetType,
  SubmitRatingRequest,
  SubmitRatingResponse,
} from '../types/rating.types'

import { api } from '../apiRequest'

const PUBLIC_BASE = '/public/ratings'
const AUTH_BASE = '/api/ratings'

/** Public: aggregate + paginated reviews for a target. */
export function getRatings (
  targetType: RatingTargetType,
  targetId: string,
  page = 0,
  size = 20,
): Promise<RatingList> {
  const qs = `?page=${page}&size=${size}`
  return api.get<RatingList>(
    `${PUBLIC_BASE}/${targetType}/${encodeURIComponent(targetId)}${qs}`,
    { skipAuth: true },
  )
}

/** Public: aggregate only (no reviews). */
export function getRatingSummary (
  targetType: RatingTargetType,
  targetId: string,
): Promise<RatingAggregate> {
  return api.get<RatingAggregate>(
    `${PUBLIC_BASE}/${targetType}/${encodeURIComponent(targetId)}/summary`,
    { skipAuth: true },
  )
}

/** Authenticated: create or update my rating. */
export function submitRating (
  targetType: RatingTargetType,
  targetId: string,
  request: SubmitRatingRequest,
): Promise<SubmitRatingResponse> {
  return api.post<SubmitRatingResponse>(
    `${AUTH_BASE}/${targetType}/${encodeURIComponent(targetId)}`,
    request,
  )
}

/** Authenticated: remove my rating. */
export function deleteRating (
  targetType: RatingTargetType,
  targetId: string,
): Promise<void> {
  return api.delete<void>(
    `${AUTH_BASE}/${targetType}/${encodeURIComponent(targetId)}`,
  )
}

/**
 * Authenticated: fetch my rating for a target.
 * Returns `null` when I have not rated it yet (204 No Content).
 */
export async function getMyRating (
  targetType: RatingTargetType,
  targetId: string,
): Promise<RatingItem | null> {
  const result = await api.get<RatingItem | Record<string, never>>(
    `${AUTH_BASE}/${targetType}/${encodeURIComponent(targetId)}/me`,
  )
  // 204 No Content is normalized to {} by apiRequest.
  if (!result || !(result as RatingItem).id) {
    return null
  }
  return result as RatingItem
}
