/**
 * Registro de proveedores de wallet
 *
 * Para agregar un nuevo proveedor (ej: XMoney):
 * 1. Crear archivo xmoney.ts implementando WalletProvider
 * 2. Exportar la instancia aquí
 * 3. Registrarlo en walletProviders
 */

import type { WalletProvider } from '../types'
import { stellarWalletsKitProvider } from './stellarWalletsKit'

// Re-exportar proveedores individuales
export { stellarWalletsKitProvider } from './stellarWalletsKit'
// export { xMoneyProvider } from './xmoney' // Futuro

/**
 * Registro de todos los proveedores disponibles
 * La clave es el ID del proveedor
 */
export const walletProviders: Record<string, WalletProvider> = {
  'stellar-wallets-kit': stellarWalletsKitProvider,
  // 'xmoney': xMoneyProvider, // Futuro
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
