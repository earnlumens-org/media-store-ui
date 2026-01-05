/**
 * Módulo de wallet - punto de entrada principal
 *
 * Uso:
 * - Para UI/componentes: usar el store `useWalletStore()`
 * - Para servicios: importar tipos y proveedores desde aquí
 */

// Proveedores
export {
  getAllProviders,
  getProvider,
  stellarWalletsKitProvider,
  walletProviders,
} from './providers'

// Tipos
export type {
  ConnectedWallet,
  SignAuthEntryResult,
  SignMessageResult,
  SignTransactionOptions,
  SignTransactionResult,
  WalletProvider,
} from './types'
