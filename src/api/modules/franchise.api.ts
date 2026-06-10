/**
 * Public franchise endpoints served by media-store-api.
 *
 * A franchise ("beta") is a commercial sub-storefront living under the
 * current tenant at `/f/<slug>`. These endpoints are unauthenticated
 * (`/public/**` is permitAll) and resolve the franchise within the active
 * tenant context (subdomain), so no tenantId needs to be passed — the
 * backend derives it from the request host like every other storefront call.
 *
 * This module also exposes the AUTHENTICATED franchisee self-service flow
 * (create / list mine / edit my branding). Those endpoints live under
 * `/api/franchises/**` and require a logged-in caller; the tenant is again
 * derived from the request host, never sent by the client.
 */

import { apiRequest } from '../apiRequest'
import axiosClient from '../axios/axiosClient'
import { uploadToR2 } from './upload.api'

export interface PublicFranchiseDto {
  slug: string
  /** Franchisor subdomain that owns the franchise. */
  tenantId: string
  title: string | null
  description: string | null
  logoR2Key: string | null
  coverR2Key: string | null
  accentColor: string | null
  ownerDisplayName: string | null
}

const PUBLIC_BASE = '/public/franchises'

/** List every ACTIVE franchise of the current tenant. */
export async function listPublicFranchises (signal?: AbortSignal): Promise<PublicFranchiseDto[]> {
  const response = await axiosClient.get<PublicFranchiseDto[]>(PUBLIC_BASE, { signal })
  return response.data
}

/** Resolve a single ACTIVE franchise by slug. Throws (404) when not found. */
export async function getPublicFranchise (
  slug: string,
  signal?: AbortSignal,
): Promise<PublicFranchiseDto> {
  const response = await axiosClient.get<PublicFranchiseDto>(
    `${PUBLIC_BASE}/${encodeURIComponent(slug)}`,
    { signal },
  )
  return response.data
}

// ──────────────────────── Franchisee self-service ────────────────────────

const MANAGE_BASE = '/api/franchises'

/**
 * Whether the current storefront accepts franchise sign-ups, and on what
 * commission. `available` folds together every gate (enabled, not paused,
 * tenant active, caller not banned); the individual flags explain why not.
 */
export interface FranchiseConfigDto {
  franchisesEnabled: boolean
  franchisesPaused: boolean
  banned: boolean
  /** Commission (% of the franchisor's own profit share) frozen onto new franchises. */
  defaultCommissionPercent: number | null
  available: boolean
}

/** Owner-facing view of a franchise, including the frozen commission deal. */
export interface ManagedFranchiseDto {
  id: string
  tenantId: string
  slug: string
  commissionPercent: number | null
  payoutWallet: string | null
  title: string | null
  description: string | null
  logoR2Key: string | null
  coverR2Key: string | null
  accentColor: string | null
  status: 'ACTIVE' | 'DISABLED'
  disabledReason: string | null
  acceptedTermsAt: string | null
  createdAt: string | null
}

export interface CreateFranchisePayload {
  slug: string
  payoutWallet: string
  title?: string
  description?: string
  accentColor?: string
  acceptTerms: boolean
}

export interface UpdateFranchisePayload {
  title?: string
  description?: string
  logoR2Key?: string
  coverR2Key?: string
  accentColor?: string
}

/** Franchise config for the current storefront (authenticated). */
export async function getFranchiseConfig (): Promise<FranchiseConfigDto> {
  return apiRequest<FranchiseConfigDto>(`${MANAGE_BASE}/config`, { method: 'GET' })
}

/** Franchises owned by the current user under this storefront. */
export async function listMyFranchises (): Promise<ManagedFranchiseDto[]> {
  return apiRequest<ManagedFranchiseDto[]>(`${MANAGE_BASE}/me`, { method: 'GET' })
}

/** Create a franchise under the current storefront for the logged-in user. */
export async function createFranchise (
  payload: CreateFranchisePayload,
): Promise<ManagedFranchiseDto> {
  return apiRequest<ManagedFranchiseDto>(MANAGE_BASE, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/** Edit the caller's own franchise branding. */
export async function updateMyFranchise (
  franchiseId: string,
  payload: UpdateFranchisePayload,
): Promise<ManagedFranchiseDto> {
  return apiRequest<ManagedFranchiseDto>(
    `${MANAGE_BASE}/me/${encodeURIComponent(franchiseId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  )
}

/** Branding image slot a franchise owner may replace. */
export type FranchiseImageSlot = 'logo' | 'cover'

export interface FranchiseImageUploadInit {
  presignedUrl: string
  r2Key: string
}

/**
 * Ask the backend for a presigned PUT URL to upload a branding image (logo
 * or cover) for one of the caller's franchises. The returned `r2Key` must be
 * persisted afterwards via {@link updateMyFranchise}.
 */
export async function presignFranchiseImage (
  franchiseId: string,
  slot: FranchiseImageSlot,
  contentType: string,
  fileSizeBytes: number,
): Promise<FranchiseImageUploadInit> {
  return apiRequest<FranchiseImageUploadInit>(
    `${MANAGE_BASE}/me/${encodeURIComponent(franchiseId)}/branding-image`,
    {
      method: 'POST',
      body: JSON.stringify({ slot, contentType, fileSizeBytes }),
    },
  )
}

/**
 * End-to-end branding image upload: presign → PUT to R2 → return the stored
 * `r2Key`. The caller is responsible for persisting it via
 * {@link updateMyFranchise} (so a single PATCH can set the key and refresh
 * the franchise in one round-trip).
 */
export async function uploadFranchiseImage (
  franchiseId: string,
  slot: FranchiseImageSlot,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const init = await presignFranchiseImage(
    franchiseId,
    slot,
    file.type,
    file.size,
  )
  await uploadToR2(init.presignedUrl, file, onProgress)
  return init.r2Key
}
