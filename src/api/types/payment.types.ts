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
  buyerWallet: string
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
