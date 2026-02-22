/**
 * API module for payment endpoints.
 *
 * Two-phase flow:
 *   1. preparePayment  — backend builds unsigned Stellar tx, returns XDR
 *   2. submitPayment   — send wallet-signed XDR, backend submits to network
 *
 * Uses apiRequest (not axiosClient) to auto-inject Bearer token.
 */

import type {
  PreparePaymentModel,
  PreparePaymentRequestDto,
  PreparePaymentResponseDto,
  SubmitPaymentModel,
  SubmitPaymentRequestDto,
  SubmitPaymentResponseDto,
} from '../types/payment.types'

import { apiRequest } from '../apiRequest'

const BASE_PATH = '/api/payments'

/**
 * Phase 1 — Prepare an unsigned Stellar payment transaction.
 * The backend reads the entry's price and splits from the database
 * and returns the XDR for the wallet to sign.
 */
export async function preparePayment (
  entryId: string,
  buyerWallet: string,
): Promise<PreparePaymentModel> {
  const body: PreparePaymentRequestDto = { entryId, buyerWallet }
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
    memo: d.memo,
    expiresAt: d.expiresAt,
    networkPassphrase: d.networkPassphrase,
  }
}

/**
 * Phase 2 — Submit the wallet-signed transaction.
 * The backend verifies integrity and submits to the Stellar network,
 * then creates the entitlement on success.
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
  }
}
