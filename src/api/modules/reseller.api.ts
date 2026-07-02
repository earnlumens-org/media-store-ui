/**
 * Reseller endpoints served by media-store-api.
 *
 * A reseller link lets a logged-in user earn a commission for distributing
 * another creator's paid content. The public read (`/public/resellers/**`)
 * powers the "EARN LUMENS" modal and needs no auth; the self-service flow
 * (create / list mine / change wallet) lives under `/api/resellers/**` and
 * requires a logged-in caller. The tenant is always derived from the request
 * host, never sent by the client.
 */

import { apiRequest } from '../apiRequest'
import axiosClient from '../axios/axiosClient'

/** Whether/how an entry can be resold, plus its current price. */
export interface ResellerEntryInfoDto {
  entryId: string
  entryTitle: string | null
  entryType: string | null
  /** False when the entry is free or the creator disabled resells. */
  resellerEnabled: boolean
  /** Current commission as a percent of the total price (5–20). */
  commissionPercent: number | null
  priceXlm: number | null
  priceUsd: number | null
  priceCurrency: string | null
  /** True when the caller is the content creator (cannot resell own content). */
  ownContent: boolean
}

/** A reseller link joined with the live state of its entry. */
export interface ResellerLinkDto {
  id: string
  entryId: string
  entryTitle: string | null
  entryType: string | null
  /** Opaque code appended to the product URL as `?r=<code>`. */
  code: string
  resellerWallet: string
  /** False when the creator has disabled resells for this entry. */
  resellerEnabled: boolean
  commissionPercent: number | null
  priceXlm: number | null
  priceUsd: number | null
  priceCurrency: string | null
  createdAt: string | null
}

const PUBLIC_BASE = '/public/resellers'
const MANAGE_BASE = '/api/resellers'

/** Public: whether/how an entry can be resold and its current price. */
export async function getResellerEntryInfo (
  entryId: string,
  signal?: AbortSignal,
): Promise<ResellerEntryInfoDto> {
  const response = await axiosClient.get<ResellerEntryInfoDto>(
    `${PUBLIC_BASE}/entries/${encodeURIComponent(entryId)}`,
    { signal },
  )
  return response.data
}

/** Generate (or fetch the existing) reseller link for an entry. */
export async function createResellerLink (
  entryId: string,
  wallet: string,
): Promise<ResellerLinkDto> {
  return apiRequest<ResellerLinkDto>(`${MANAGE_BASE}/links`, {
    method: 'POST',
    body: JSON.stringify({ entryId, wallet }),
  })
}

/** All reseller links owned by the current user under this storefront. */
export async function listMyResellerLinks (): Promise<ResellerLinkDto[]> {
  return apiRequest<ResellerLinkDto[]>(`${MANAGE_BASE}/links`, { method: 'GET' })
}

/** Change the payout wallet of an owned reseller link. */
export async function updateResellerLinkWallet (
  linkId: string,
  wallet: string,
): Promise<ResellerLinkDto> {
  return apiRequest<ResellerLinkDto>(
    `${MANAGE_BASE}/links/${encodeURIComponent(linkId)}/wallet`,
    {
      method: 'PATCH',
      body: JSON.stringify({ wallet }),
    },
  )
}
