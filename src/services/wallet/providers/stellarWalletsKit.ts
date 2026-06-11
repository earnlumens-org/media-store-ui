/**
 * Adaptador de Stellar Wallets Kit como proveedor de wallet
 */

import type {
  ConnectedWallet,
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
  private _isConnecting = false

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

  async connect (): Promise<{ address: string, providerName: string, moduleId?: string } | null> {
    // Evita dos authModal superpuestos (doble click, doble flujo de checkout)
    if (this._isConnecting) {
      return null
    }
    this._isConnecting = true

    // Escuchar wallet seleccionada para capturar el módulo elegido.
    // OJO: el effect del kit dispara inmediatamente con el valor actual
    // (persistido de una sesión anterior), así que esto es solo un
    // fallback — la fuente de verdad tras authModal() es selectedModule.
    let pendingModuleId = ''
    const unsubscribe = StellarWalletsKit.on(KitEventType.WALLET_SELECTED, event => {
      if (event.payload?.id) {
        pendingModuleId = event.payload.id
      }
    })

    try {
      const result = await StellarWalletsKit.authModal()

      // Tras un authModal exitoso el kit deja seleccionado el módulo que
      // el usuario eligió: leerlo directamente evita carreras de eventos.
      const moduleId = this.readSelectedModuleId() || pendingModuleId

      return {
        address: result.address,
        providerName: MODULE_NAMES[moduleId] || moduleId || 'Unknown',
        moduleId: moduleId || undefined,
      }
    } catch (error) {
      console.error('[StellarWalletsKitProvider] Error connecting:', error)
      return null
    } finally {
      unsubscribe()
      this._isConnecting = false
    }
  }

  /**
   * Re-activa el módulo del kit que corresponde a la wallet dada, de modo
   * que las próximas firmas se enruten a ESA wallet y no a la última que
   * pasó por el authModal. Idempotente y sin popups.
   *
   * Lanza 'WALLET_RECONNECT_REQUIRED' cuando no es posible determinar o
   * restaurar el módulo (wallet persistida sin moduleId de versiones
   * anteriores, o módulo ya no registrado en el kit).
   */
  async activateWallet (wallet: ConnectedWallet): Promise<void> {
    const currentModuleId = this.readSelectedModuleId()

    if (!wallet.moduleId) {
      // Wallet persistida por una versión anterior (sin moduleId).
      // Solo es seguro firmar si el kit conserva como activa exactamente
      // esta dirección (entonces su módulo seleccionado es el correcto).
      const kitAddress = await this.getAddress()
      if (currentModuleId && kitAddress === wallet.address) {
        return
      }
      throw new Error('WALLET_RECONNECT_REQUIRED')
    }

    if (currentModuleId === wallet.moduleId) {
      return
    }

    try {
      StellarWalletsKit.setWallet(wallet.moduleId)
    } catch (error) {
      // El módulo ya no existe en el kit (ej: módulo retirado del bundle)
      console.error('[StellarWalletsKitProvider] Cannot activate module:', error)
      throw new Error('WALLET_RECONNECT_REQUIRED')
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

  /**
   * Lee el moduleId actualmente seleccionado en el kit (si hay uno).
   * El getter del kit lanza si no hay módulo activo.
   */
  private readSelectedModuleId (): string {
    try {
      return StellarWalletsKit.selectedModule.productId
    } catch {
      return ''
    }
  }
}

/**
 * Instancia singleton del proveedor
 */
export const stellarWalletsKitProvider = new StellarWalletsKitProvider()
