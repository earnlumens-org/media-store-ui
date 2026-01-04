/**
 * Adaptador de Stellar Wallets Kit como proveedor de wallet
 */

import type {
  SignAuthEntryResult,
  SignMessageResult,
  SignTransactionOptions,
  SignTransactionResult,
  WalletProvider,
} from '../types'

import { defaultModules } from '@creit-tech/stellar-wallets-kit/modules/utils'
import { StellarWalletsKit } from '@creit-tech/stellar-wallets-kit/sdk'
import { KitEventType, SwkAppDarkTheme } from '@creit-tech/stellar-wallets-kit/types'

/**
 * Mapa de IDs de módulos de Stellar Wallets Kit a nombres amigables
 */
const MODULE_NAMES: Record<string, string> = {
  'albedo': 'Albedo',
  'freighter': 'Freighter',
  'hana': 'Hana',
  'ledger': 'Ledger',
  'trezor': 'Trezor',
  'lobstr': 'Lobstr',
  'rabet': 'Rabet',
  'wallet-connect': 'Wallet Connect',
  'xbull': 'xBull',
  'hotwallet': 'HOT',
  'klever': 'Klever',
}

/**
 * Proveedor para Stellar Wallets Kit (Freighter, Lobstr, xBull, etc.)
 */
export class StellarWalletsKitProvider implements WalletProvider {
  readonly id = 'stellar-wallets-kit'
  readonly name = 'Stellar Wallets Kit'

  private _isInitialized = false
  private _pendingModuleId = ''

  get isInitialized (): boolean {
    return this._isInitialized
  }

  async init (): Promise<void> {
    if (this._isInitialized) {
      return
    }

    StellarWalletsKit.init({
      theme: SwkAppDarkTheme,
      modules: defaultModules(),
    })

    this._isInitialized = true
  }

  async connect (): Promise<{ address: string, providerName: string } | null> {
    try {
      // Escuchar wallet seleccionada para capturar el módulo
      const unsubscribe = StellarWalletsKit.on(KitEventType.WALLET_SELECTED, event => {
        if (event.payload?.id) {
          this._pendingModuleId = event.payload.id
        }
      })

      const result = await StellarWalletsKit.authModal()
      unsubscribe()

      const moduleId = this._pendingModuleId
      this._pendingModuleId = ''

      return {
        address: result.address,
        providerName: MODULE_NAMES[moduleId] || moduleId || 'Unknown',
      }
    } catch (error) {
      console.error('[StellarWalletsKitProvider] Error connecting:', error)
      return null
    }
  }

  async disconnect (): Promise<void> {
    try {
      await StellarWalletsKit.disconnect()
    } catch (error) {
      console.error('[StellarWalletsKitProvider] Error disconnecting:', error)
    }
  }

  async getAddress (): Promise<string | null> {
    try {
      const result = await StellarWalletsKit.getAddress()
      return result.address || null
    } catch {
      return null
    }
  }

  async signTransaction (xdr: string, options?: SignTransactionOptions): Promise<SignTransactionResult> {
    const result = await StellarWalletsKit.signTransaction(xdr, {
      networkPassphrase: options?.networkPassphrase,
      address: options?.address,
      path: options?.path,
    })
    return {
      signedTxXdr: result.signedTxXdr,
      signerAddress: result.signerAddress,
    }
  }

  async signAuthEntry (authEntry: string, options?: SignTransactionOptions): Promise<SignAuthEntryResult> {
    const result = await StellarWalletsKit.signAuthEntry(authEntry, {
      networkPassphrase: options?.networkPassphrase,
      address: options?.address,
      path: options?.path,
    })
    return {
      signedAuthEntry: result.signedAuthEntry,
      signerAddress: result.signerAddress,
    }
  }

  async signMessage (message: string, options?: SignTransactionOptions): Promise<SignMessageResult> {
    const result = await StellarWalletsKit.signMessage(message, {
      networkPassphrase: options?.networkPassphrase,
      address: options?.address,
      path: options?.path,
    })
    return {
      signedMessage: result.signedMessage,
      signerAddress: result.signerAddress,
    }
  }

  onStateChange (callback: (address: string | undefined) => void): () => void {
    return StellarWalletsKit.on(KitEventType.STATE_UPDATED, event => {
      callback(event.payload?.address)
    })
  }

  onDisconnect (callback: () => void): () => void {
    return StellarWalletsKit.on(KitEventType.DISCONNECT, () => {
      callback()
    })
  }
}

/**
 * Instancia singleton del proveedor
 */
export const stellarWalletsKitProvider = new StellarWalletsKitProvider()
