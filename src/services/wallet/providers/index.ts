/**
 * Registro de proveedores de wallet
 *
 * Para agregar un nuevo proveedor (ej: X Payments sobre Stellar):
 * 1. Crear archivo xPayments.ts implementando WalletProvider
 *    (id 'x-payments'; si es de wallet única puede omitir activateWallet)
 * 2. Exportar la instancia aquí
 * 3. Registrarlo en walletProviders
 *
 * El resto del sistema (store, firmas, persistencia, multi-wallet,
 * desconexión) enruta por providerId automáticamente: no hace falta
 * tocar nada más. Las wallets persistidas con un providerId no
 * registrado se conservan pero fallan al firmar con
 * 'WALLET_RECONNECT_REQUIRED'.
 */

import type { WalletProvider } from '../types'
import { stellarWalletsKitProvider } from './stellarWalletsKit'

// Re-exportar proveedores individuales
export { stellarWalletsKitProvider } from './stellarWalletsKit'
// export { xPaymentsProvider } from './xPayments' // Futuro

/**
 * Registro de todos los proveedores disponibles
 * La clave es el ID del proveedor
 */
export const walletProviders: Record<string, WalletProvider> = {
  'stellar-wallets-kit': stellarWalletsKitProvider,
  // 'x-payments': xPaymentsProvider, // Futuro
}

/**
 * Obtiene un proveedor por su ID
 */
export function getProvider (providerId: string): WalletProvider | undefined {
  return walletProviders[providerId]
}

/**
 * Lista todos los proveedores disponibles
 */
export function getAllProviders (): WalletProvider[] {
  return Object.values(walletProviders)
}
