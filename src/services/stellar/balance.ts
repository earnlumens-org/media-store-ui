/**
 * Servicio para consultar saldos en la red Stellar
 */

import { Horizon } from '@stellar/stellar-sdk'

import { getStellarHorizonUrl } from '@/config/env'

// Horizon URL resolved from environment (testnet in dev, mainnet in prod)
const HORIZON_URL = getStellarHorizonUrl()
const server = new Horizon.Server(HORIZON_URL)

export interface StellarBalance {
  asset_type: string
  asset_code?: string
  asset_issuer?: string
  balance: string
}

export interface AccountBalances {
  xlm: number
  assets: StellarBalance[]
}

// AbortController para cancelar requests pendientes
let currentAbortController: AbortController | null = null

/**
 * Obtiene el saldo XLM nativo de una cuenta usando fetch directo (cancelable)
 */
export async function getXLMBalance (address: string): Promise<number> {
  // Cancelar request anterior si existe
  if (currentAbortController) {
    currentAbortController.abort()
  }
  currentAbortController = new AbortController()

  try {
    const response = await fetch(
      `${HORIZON_URL}/accounts/${address}`,
      { signal: currentAbortController.signal },
    )

    // Unfunded accounts (not yet on the ledger) return 404
    if (response.status === 404) {
      return 0
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const account = await response.json()
    const nativeBalance = account.balances?.find(
      (b: StellarBalance) => b.asset_type === 'native',
    )
    return nativeBalance ? Number.parseFloat(nativeBalance.balance) : 0
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      // Request fue cancelada, no loguear
      throw error
    }
    console.error('[StellarBalance] Error fetching balance:', error)
    throw error
  }
}

/**
 * Obtiene todos los saldos de una cuenta
 */
export async function getAllBalances (address: string): Promise<AccountBalances> {
  try {
    const account = await server.loadAccount(address)
    const nativeBalance = account.balances.find(
      (b: StellarBalance) => b.asset_type === 'native',
    )

    return {
      xlm: nativeBalance ? Number.parseFloat(nativeBalance.balance) : 0,
      assets: account.balances as StellarBalance[],
    }
  } catch (error) {
    console.error('[StellarBalance] Error fetching balances:', error)
    return { xlm: 0, assets: [] }
  }
}

/**
 * Verifica si una cuenta existe en la red
 */
export async function accountExists (address: string): Promise<boolean> {
  try {
    await server.loadAccount(address)
    return true
  } catch {
    return false
  }
}
