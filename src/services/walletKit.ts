import { defaultModules } from '@creit-tech/stellar-wallets-kit/modules/utils'
import { StellarWalletsKit } from '@creit-tech/stellar-wallets-kit/sdk'
import { KitEventType, SwkAppDarkTheme } from '@creit-tech/stellar-wallets-kit/types'

let isInitialized = false

/**
 * Inicializa el Stellar Wallets Kit
 * Se debe llamar una sola vez durante la carga de la aplicación
 */
export function initWalletKit (): void {
  if (isInitialized) {
    return
  }

  StellarWalletsKit.init({
    theme: SwkAppDarkTheme,
    modules: defaultModules(),
  })

  isInitialized = true
}

/**
 * Obtiene la dirección de la wallet conectada
 */
export async function getWalletAddress (): Promise<string | null> {
  try {
    const result = await StellarWalletsKit.getAddress()
    return result.address || null
  } catch (error) {
    console.error('Error al obtener la dirección de la wallet:', error)
    return null
  }
}

/**
 * Abre el modal de autenticación de wallets
 */
export async function openWalletModal (): Promise<string | null> {
  try {
    const result = await StellarWalletsKit.authModal()
    return result.address || null
  } catch (error) {
    console.error('Error al abrir el modal de wallet:', error)
    return null
  }
}

/**
 * Desconecta la wallet del kit (limpia la sesión persistida del kit)
 */
export async function disconnectWallet (): Promise<void> {
  try {
    await StellarWalletsKit.disconnect()
  } catch (error) {
    console.error('Error al desconectar la wallet:', error)
  }
}

/**
 * Suscribirse a cambios de estado del kit
 */
export function onStateUpdated (callback: (event: any) => void): () => void {
  return StellarWalletsKit.on(KitEventType.STATE_UPDATED, callback)
}

/**
 * Suscribirse a evento de desconexión
 */
export function onDisconnect (callback: (event: any) => void): () => void {
  return StellarWalletsKit.on(KitEventType.DISCONNECT, callback)
}

/**
 * Suscribirse a evento de wallet seleccionada
 */
export function onWalletSelected (callback: (event: any) => void): () => void {
  return StellarWalletsKit.on(KitEventType.WALLET_SELECTED, callback)
}

/**
 * Mapa de IDs de módulos a nombres amigables de proveedores
 */
export const walletProviderNames: Record<string, string> = {
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
 * Crea el botón de conexión en el elemento especificado
 */
export function createWalletButton (container: HTMLElement | null): void {
  if (!container) {
    return
  }
  StellarWalletsKit.createButton(container)
}

/**
 * Obtiene la instancia del kit
 */
export function getKit () {
  return StellarWalletsKit
}

export { KitEventType } from '@creit-tech/stellar-wallets-kit/types'
