/**
 * API module for payment endpoints.
 *
 * Two-phase flow:
 *   1. preparePayment  — backend builds unsigned Stellar tx, returns XDR
 *   2. submitPayment   — send wallet-signed XDR; the backend verifies and
 *      locks the order inline, then confirms on-chain asynchronously
 *      (status PROCESSING) — poll getPaymentOrder until a final state
 *
 * Uses apiRequest (not axiosClient) to auto-inject Bearer token.
 */

import type {
  PreparePaymentModel,
  PreparePaymentRequestDto,
  PreparePaymentResponseDto,
  PrepareTipRequestDto,
  SubmitPaymentModel,
  SubmitPaymentRequestDto,
  SubmitPaymentResponseDto,
} from '../types/payment.types'

import { apiRequest } from '../apiRequest'

const BASE_PATH = '/api/payments'

/**
 * Phase 1 — Prepare an unsigned Stellar payment transaction.
 * The backend reads the content's price and splits from the database
 * and returns the XDR for the wallet to sign.
 * Pass either entryId or collectionId (exactly one).
 */
export async function preparePayment (
  buyerWallet: string,
  options: { entryId?: string, collectionId?: string, franchiseSlug?: string, resellerCode?: string },
): Promise<PreparePaymentModel> {
  const body: PreparePaymentRequestDto = {
    entryId: options.entryId,
    collectionId: options.collectionId,
    buyerWallet,
    ...(options.franchiseSlug ? { franchiseSlug: options.franchiseSlug } : {}),
    ...(options.resellerCode ? { resellerCode: options.resellerCode } : {}),
  }
  const d = await apiRequest<PreparePaymentResponseDto>(
    `${BASE_PATH}/prepare`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  )
  return {
    orderId: d.orderId,
    unsignedXdr: d.unsignedXdr,
    integrityHash: d.integrityHash,
    totalXlm: d.totalXlm,
    originalAmountUsd: d.originalAmountUsd,
    priceCurrency: d.priceCurrency,
    xlmUsdRate: d.xlmUsdRate,
    memo: d.memo,
    expiresAt: d.expiresAt,
    networkPassphrase: d.networkPassphrase,
  }
}

/**
 * Phase 1 (TIP) — Prepare an unsigned Stellar tip transaction.
 * The buyer chooses {@code amountUsd} (the only price input); the backend
 * bounds it, converts USD→XLM at a locked rate, resolves the creator's payout
 * wallet and every split, and returns the XDR for the wallet to sign. A tip
 * grants no entitlement. Pass either entryId or collectionId (exactly one).
 */
export async function prepareTip (
  buyerWallet: string,
  options: { entryId?: string, collectionId?: string, franchiseSlug?: string, amountUsd: number },
): Promise<PreparePaymentModel> {
  const body: PrepareTipRequestDto = {
    entryId: options.entryId,
    collectionId: options.collectionId,
    buyerWallet,
    amountUsd: options.amountUsd,
    ...(options.franchiseSlug ? { franchiseSlug: options.franchiseSlug } : {}),
  }
  const d = await apiRequest<PreparePaymentResponseDto>(
    `${BASE_PATH}/tip/prepare`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  )
  return {
    orderId: d.orderId,
    unsignedXdr: d.unsignedXdr,
    integrityHash: d.integrityHash,
    totalXlm: d.totalXlm,
    originalAmountUsd: d.originalAmountUsd,
    priceCurrency: d.priceCurrency,
    xlmUsdRate: d.xlmUsdRate,
    memo: d.memo,
    expiresAt: d.expiresAt,
    networkPassphrase: d.networkPassphrase,
  }
}

/**
 * Phase 2 — Submit the wallet-signed transaction.
 * The backend verifies integrity, locks the order and submits to the Stellar
 * network. With async confirmation enabled it returns status PROCESSING
 * (HTTP 202) while the on-chain confirmation continues server-side — poll
 * getPaymentOrder until the order reaches a final state.
 */
export async function submitPayment (
  orderId: string,
  signedXdr: string,
): Promise<SubmitPaymentModel> {
  const body: SubmitPaymentRequestDto = { orderId, signedXdr }
  const d = await apiRequest<SubmitPaymentResponseDto>(
    `${BASE_PATH}/submit`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  )
  return {
    orderId: d.orderId,
    stellarTxHash: d.stellarTxHash,
    status: d.status,
    entryId: d.entryId,
    collectionId: d.collectionId,
  }
}

/**
 * Status of the buyer's own order — polled after an async submit (202)
 * until the order reaches COMPLETED / FAILED / EXPIRED.
 */
export async function getPaymentOrder (
  orderId: string,
): Promise<SubmitPaymentModel> {
  const d = await apiRequest<SubmitPaymentResponseDto>(
    `${BASE_PATH}/orders/${encodeURIComponent(orderId)}`,
    { method: 'GET' },
  )
  return {
    orderId: d.orderId,
    stellarTxHash: d.stellarTxHash,
    status: d.status,
    entryId: d.entryId,
    collectionId: d.collectionId,
  }
}
