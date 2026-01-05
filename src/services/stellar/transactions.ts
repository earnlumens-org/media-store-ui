/**
 * Servicio para consultar transacciones en la red Stellar
 */

const HORIZON_URL = 'https://horizon.stellar.org'

export interface StellarTransaction {
  id: string
  created_at: string
  type: 'sent' | 'received'
  amount: string
  from: string
  to: string
  memo?: string
}

export interface StellarOperation {
  id: string
  created_at: string
  type: string
  transaction_successful: boolean
  from?: string
  to?: string
  amount?: string
  asset_type?: string
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
        } as StellarTransaction
      })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    throw error
  }
}
