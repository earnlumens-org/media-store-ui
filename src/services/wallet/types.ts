/**
 * Tipos e interfaces para el sistema de wallets modular
 * Diseñado para soportar múltiples proveedores (Stellar Wallets Kit,
 * X Payments, etc.)
 */

/**
 * Representa una wallet conectada
 */
export interface ConnectedWallet {
  /** Dirección pública de la wallet (Stellar public key) */
  address: string
  /** ID del proveedor (stellar-wallets-kit, x-payments, etc.) */
  providerId: string
  /** Nombre amigable del proveedor (Lobstr, Freighter, X Payments, etc.) */
  providerName: string
  /**
   * ID de la sub-wallet/módulo dentro del proveedor (ej: 'xbull',
   * 'freighter' en Stellar Wallets Kit). Necesario para re-enrutar la
   * firma a la wallet correcta cuando hay varias conectadas.
   * Opcional: proveedores de wallet única pueden omitirlo.
   */
  moduleId?: string
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
   * @returns La dirección conectada, el nombre del sub-proveedor
   * (ej: Lobstr, Freighter) y el moduleId interno para re-activarla luego
   */
  connect: () => Promise<{ address: string, providerName: string, moduleId?: string } | null>

  /**
   * Activa una wallet previamente conectada como la wallet operativa del
   * proveedor (re-enruta firmas hacia su módulo). Debe ser idempotente y
   * no debe abrir popups. Lanza error si el módulo ya no está disponible.
   * Opcional: proveedores de wallet única pueden omitirlo.
   */
  activateWallet?: (wallet: ConnectedWallet) => Promise<void>

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
