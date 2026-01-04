/**
 * Tipos e interfaces para el sistema de wallets modular
 * Diseñado para soportar múltiples proveedores (Stellar Wallets Kit, XMoney, etc.)
 */

/**
 * Representa una wallet conectada
 */
export interface ConnectedWallet {
  /** Dirección pública de la wallet (Stellar public key) */
  address: string
  /** ID del proveedor (stellar-wallets-kit, xmoney, etc.) */
  providerId: string
  /** Nombre amigable del proveedor (Lobstr, Freighter, XMoney, etc.) */
  providerName: string
  /** Timestamp de cuando se conectó */
  connectedAt: number
}

/**
 * Resultado de firma de transacción
 */
export interface SignTransactionResult {
  signedTxXdr: string
  signerAddress?: string
}

/**
 * Resultado de firma de auth entry (SEP-0010, etc.)
 */
export interface SignAuthEntryResult {
  signedAuthEntry: string
  signerAddress?: string
}

/**
 * Resultado de firma de mensaje
 */
export interface SignMessageResult {
  signedMessage: string
  signerAddress?: string
}

/**
 * Opciones para firmar transacciones
 */
export interface SignTransactionOptions {
  networkPassphrase?: string
  address?: string
  path?: string
}

/**
 * Interfaz que debe implementar cada proveedor de wallet
 */
export interface WalletProvider {
  /** ID único del proveedor */
  readonly id: string

  /** Nombre amigable del proveedor */
  readonly name: string

  /** Si el proveedor está inicializado */
  readonly isInitialized: boolean

  /**
   * Inicializa el proveedor
   */
  init: () => Promise<void>

  /**
   * Abre el modal de autenticación/conexión
   * @returns La dirección conectada y el nombre del sub-proveedor (ej: Lobstr, Freighter)
   */
  connect: () => Promise<{ address: string, providerName: string } | null>

  /**
   * Desconecta la wallet del proveedor
   */
  disconnect: () => Promise<void>

  /**
   * Obtiene la dirección activa del proveedor
   */
  getAddress: () => Promise<string | null>

  /**
   * Firma una transacción XDR
   */
  signTransaction: (xdr: string, options?: SignTransactionOptions) => Promise<SignTransactionResult>

  /**
   * Firma un auth entry (para SEP-0010, Soroban auth, etc.)
   */
  signAuthEntry: (authEntry: string, options?: SignTransactionOptions) => Promise<SignAuthEntryResult>

  /**
   * Firma un mensaje arbitrario
   */
  signMessage: (message: string, options?: SignTransactionOptions) => Promise<SignMessageResult>

  /**
   * Registra un callback para cuando cambia el estado
   */
  onStateChange: (callback: (address: string | undefined) => void) => () => void

  /**
   * Registra un callback para cuando se desconecta
   */
  onDisconnect: (callback: () => void) => () => void
}

/**
 * Tipo de eventos del sistema de wallets
 */
export type WalletEventType = 'connected' | 'disconnected' | 'changed' | 'error'

/**
 * Evento del sistema de wallets
 */
export interface WalletEvent {
  type: WalletEventType
  wallet?: ConnectedWallet
  error?: Error
}
