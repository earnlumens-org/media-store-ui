/**
 * Types for the payment API endpoints.
 * Maps 1:1 with backend DTOs:
 *   - PreparePaymentRequest / PreparePaymentResponse
 *   - SubmitPaymentRequest  / SubmitPaymentResponse
 */

// ── Request DTOs ──────────────────────────────────────────

export interface PreparePaymentRequestDto {
  entryId?: string
  collectionId?: string
  /** Slug of the franchise storefront the sale happened on, when on /f/:slug. */
  franchiseSlug?: string
  /** Opaque reseller link code the buyer arrived with (?r=<code>), when present. */
  resellerCode?: string
  buyerWallet: string
}

export interface PrepareTipRequestDto {
  entryId?: string
  collectionId?: string
  /** Slug of the franchise storefront the tip happened on, when on /f/:slug. */
  franchiseSlug?: string
  buyerWallet: string
  /** Tip amount in USD — the only price input; bounded server-side to [0.25, 100]. */
  amountUsd: number
}

export interface SubmitPaymentRequestDto {
  orderId: string
  signedXdr: string
}

// ── Response DTOs (JSON from backend) ─────────────────────

export interface PreparePaymentResponseDto {
  orderId: string
  unsignedXdr: string
  integrityHash: string
  totalXlm: number
  originalAmountUsd?: number | null
  priceCurrency?: string | null
  xlmUsdRate?: number | null
  memo: string
  expiresAt: string
  networkPassphrase: string
}

export interface SubmitPaymentResponseDto {
  orderId: string
  stellarTxHash: string
  status: string
  entryId?: string
  collectionId?: string
}

// ── Frontend Models ───────────────────────────────────────

export interface PreparePaymentModel {
  orderId: string
  unsignedXdr: string
  integrityHash: string
  totalXlm: number
  originalAmountUsd?: number | null
  priceCurrency?: string | null
  xlmUsdRate?: number | null
  memo: string
  expiresAt: string
  networkPassphrase: string
}

export interface SubmitPaymentModel {
  orderId: string
  stellarTxHash: string
  status: string
  entryId?: string
  collectionId?: string
}
