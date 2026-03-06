/**
 * Sales API module for the Creator Studio.
 *
 * Fetches the seller's completed orders with payment split breakdown
 * via GET /api/entries/mine/sales.
 */

import type { SellerSaleModel } from '../types/sales.types'
import { apiRequest } from '../apiRequest'

/** Raw DTO returned by the backend */
interface SellerOrderDto {
  orderId: string
  entryId: string
  entryTitle: string
  entryType: string
  amountXlm: number
  stellarTxHash: string | null
  completedAt: string
  splits: Array<{
    wallet: string
    role: string
    percent: number
    amountXlm: number
  }>
}

function dtoToModel (dto: SellerOrderDto): SellerSaleModel {
  return {
    orderId: dto.orderId,
    entryId: dto.entryId,
    entryTitle: dto.entryTitle,
    entryType: dto.entryType,
    amountXlm: dto.amountXlm,
    stellarTxHash: dto.stellarTxHash ?? undefined,
    completedAt: dto.completedAt,
    splits: dto.splits.map(s => ({
      wallet: s.wallet,
      role: s.role as SellerSaleModel['splits'][number]['role'],
      percent: s.percent,
      amountXlm: s.amountXlm,
    })),
  }
}

/**
 * Fetch the seller's completed sales.
 */
export async function getSellerSales (): Promise<SellerSaleModel[]> {
  const dtos = await apiRequest<SellerOrderDto[]>('/api/entries/mine/sales')
  return dtos.map(dto => dtoToModel(dto))
}
