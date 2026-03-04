/**
 * Servicio para consultar transacciones en la red Stellar
 */

import { getStellarHorizonUrl } from '@/config/env'

// Horizon URL resolved from environment (testnet in dev, mainnet in prod)
const HORIZON_URL = getStellarHorizonUrl()

export interface StellarTransaction {
  id: string
  created_at: string
  type: 'sent' | 'received'
  amount: string
  from: string
  to: string
  memo?: string
  transactionHash: string
}

export interface StellarOperation {
  id: string
  created_at: string
  type: string
  transaction_successful: boolean
  transaction_hash: string
  from?: string
  to?: string
  amount?: string
  asset_type?: string
}

export interface GroupedTransaction {
  transactionHash: string
  created_at: string
  type: 'sent' | 'received'
  totalAmount: string
  operations: StellarTransaction[]
}

/**
 * Obtiene las últimas transacciones de pago XLM de una cuenta
 */
export async function getRecentTransactions (
  address: string,
  limit = 10,
): Promise<StellarTransaction[]> {
  try {
    const response = await fetch(
      `${HORIZON_URL}/accounts/${address}/payments?order=desc&limit=${limit}`,
    )

    // Unfunded accounts (not yet on the ledger) return 404 — treat as empty history
    if (response.status === 404) {
      return []
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    const operations: StellarOperation[] = data._embedded?.records || []

    // Filtrar solo pagos XLM y formatear
    return operations
      .filter(op =>
        (op.type === 'payment' || op.type === 'create_account')
        && op.asset_type === 'native'
        && op.transaction_successful !== false,
      )
      .map(op => {
        const isSent = op.from === address
        return {
          id: op.id,
          created_at: op.created_at,
          type: isSent ? 'sent' : 'received',
          amount: op.amount || '0',
          from: op.from || '',
          to: op.to || address,
          transactionHash: op.transaction_hash,
        } as StellarTransaction
      })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    throw error
  }
}

/**
 * Obtiene las transacciones recientes agrupadas por hash de transacción.
 * Las transacciones multi-operación se muestran como una sola entrada con el total.
 */
export async function getRecentGroupedTransactions (
  address: string,
  maxGroups = 10,
): Promise<GroupedTransaction[]> {
  // Fetch more operations to ensure enough groups after merging
  const operations = await getRecentTransactions(address, 50)

  // Group by transaction hash preserving order
  const groupMap = new Map<string, StellarTransaction[]>()
  for (const op of operations) {
    const hash = op.transactionHash
    if (!groupMap.has(hash)) {
      groupMap.set(hash, [])
    }
    groupMap.get(hash)!.push(op)
  }

  // Convert to grouped transactions
  const groups: GroupedTransaction[] = []
  for (const [hash, ops] of groupMap) {
    const sentOps = ops.filter(o => o.type === 'sent')
    const receivedOps = ops.filter(o => o.type === 'received')

    // Determine overall transaction type by majority
    const type: 'sent' | 'received' = sentOps.length >= receivedOps.length ? 'sent' : 'received'

    // Calculate total amount from the relevant direction
    const relevantOps = type === 'sent' ? sentOps : receivedOps
    const total = (relevantOps.length > 0 ? relevantOps : ops)
      .reduce((sum, o) => sum + Number.parseFloat(o.amount), 0)

    groups.push({
      transactionHash: hash,
      created_at: ops[0]!.created_at,
      type,
      totalAmount: total.toFixed(7).replace(/0+$/, '').replace(/\.$/, ''),
      operations: ops,
    })
  }

  return groups.slice(0, maxGroups)
}
