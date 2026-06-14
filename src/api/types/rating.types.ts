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
  /** Total number of votes (likes + dislikes). UI hides everything when this is 0. */
  count: number
  /** Number of likes (thumbs up). */
  likes: number
  /** Number of dislikes (thumbs down). */
  dislikes: number
  /** Percentage of likes, 0–100 (0 when count is 0). The Roblox-style headline score. */
  likePercent: number
  /** Number of verified (purchase-backed) votes. */
  verifiedCount: number
  /** Number of verified likes. */
  verifiedLikes: number
  /** Number of verified dislikes. */
  verifiedDislikes: number
  /** Percentage of likes among verified votes only (0 when none). */
  verifiedLikePercent: number
}

export interface RatingItem {
  id: string
  userId: string
  username?: string
  /** true = like (thumbs up), false = dislike (thumbs down). */
  liked: boolean
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
  /** true = like, false = dislike. */
  liked: boolean
  comment?: string
}

export interface SubmitRatingResponse {
  rating: RatingItem
  aggregate: RatingAggregate
}
