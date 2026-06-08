/**
 * Types for the rating / review system.
 *
 * Mirrors the backend DTOs exposed by:
 *   - GET  /public/ratings/{targetType}/{targetId}
 *   - GET  /public/ratings/{targetType}/{targetId}/summary
 *   - POST/DELETE/GET /api/ratings/{targetType}/{targetId}
 *
 * `targetType` is "entry" or "collection" (case-insensitive on the wire).
 */

export type RatingTargetType = 'entry' | 'collection'

export interface RatingAggregate {
  targetType: string
  targetId: string
  /** Total number of ratings. UI must hide everything when this is 0. */
  count: number
  /** Mean of all ratings (0 when count is 0). */
  average: number
  /** Number of verified (purchase-backed) ratings. */
  verifiedCount: number
  /** Mean of verified ratings only (0 when none). */
  verifiedAverage: number
  /** Bayesian-adjusted score used for ranking. */
  bayesianScore: number
  /** Star distribution, index 0 = 1 star … index 4 = 5 stars. */
  distribution: number[]
}

export interface RatingItem {
  id: string
  userId: string
  username?: string
  stars: number
  comment?: string
  /** "PURCHASE" | "FREE_VIEW" */
  proofType: string
  /** True when proofType is PURCHASE. */
  verified: boolean
  createdAt?: string
  updatedAt?: string
}

export interface RatingList {
  aggregate: RatingAggregate
  items: RatingItem[]
  page: number
  size: number
  total: number
  hasMore: boolean
}

export interface SubmitRatingRequest {
  stars: number
  comment?: string
}

export interface SubmitRatingResponse {
  rating: RatingItem
  aggregate: RatingAggregate
}
