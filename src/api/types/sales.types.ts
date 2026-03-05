/**
 * Types for the Creator Sales History.
 */

export interface SellerSaleModel {
  orderId: string
  entryId: string
  entryTitle: string
  entryType: string
  /** Gross amount paid by the buyer */
  amountXlm: number
  /** Stellar transaction hash for on-chain verification */
  stellarTxHash?: string
  completedAt: string
  /** Payment split breakdown */
  splits: SellerSaleSplit[]
}

export interface SellerSaleSplit {
  wallet: string
  role: 'PLATFORM' | 'SELLER' | 'COLLABORATOR'
  percent: number
  /** Computed XLM amount for this recipient */
  amountXlm: number
}
