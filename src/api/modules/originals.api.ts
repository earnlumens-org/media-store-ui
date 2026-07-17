/**
 * API module for Original First — content attribution claims.
 *
 * Endpoints:
 *   POST /api/originals/claim/{entryId} — claim an entry group as the original creator
 *
 * All endpoints require authentication (Bearer token via apiRequest).
 */

import { api } from '../apiRequest'

const BASE_PATH = '/api/originals'

export interface ClaimOriginalResponse {
  /** True when the claim was granted and attribution was reassigned. */
  granted: boolean
  claimantScore: number
  holderScore: number
  /** Human-readable breakdown of how both scores were computed. */
  scoreBreakdown: string
  /** Entry id now considered the original for the group. */
  originalEntryId?: string
}

/**
 * Claim ownership of the content group that {@code entryId} belongs to.
 * The backend compares evidence scores (upload priority, creator trust,
 * account seniority) and reassigns attribution automatically when the
 * claimant wins by a clear margin.
 *
 * Error codes (thrown as ApiError message):
 *  - ENTRY_NOT_FOUND / NO_FINGERPRINT / NO_MATCHING_ENTRY / ALREADY_ORIGINAL (400)
 *  - ALREADY_CLAIMED (409)
 *  - DAILY_CLAIM_LIMIT_REACHED (429)
 */
export function claimAsOriginal (entryId: string): Promise<ClaimOriginalResponse> {
  return api.post<ClaimOriginalResponse>(`${BASE_PATH}/claim/${entryId}`, {})
}
