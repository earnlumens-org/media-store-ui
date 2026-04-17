/**
 * API module for user content reports.
 *
 * Endpoints:
 *   POST /api/reports/{entryId} — submit a report
 *
 * All endpoints require authentication (Bearer token via apiRequest).
 */

import type { SubmitReportRequest, SubmitReportResponse } from '../types/report.types'

import { api } from '../apiRequest'

const BASE_PATH = '/api/reports'

/**
 * Submit a report against a published entry.
 */
export function submitReport (
  entryId: string,
  request: SubmitReportRequest,
): Promise<SubmitReportResponse> {
  return api.post<SubmitReportResponse>(`${BASE_PATH}/${entryId}`, request)
}
