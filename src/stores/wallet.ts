/**
 * Wallet Store - Estado global de wallets
 *
 * Uso desde cualquier parte de la app:
 *
 * import { useWalletStore } from '@/stores/wallet'
 *
 * const walletStore = useWalletStore()
 *
 * // Conectar wallet
 * await walletStore.connect()
 *
 * // Firmar transacción
 * const result = await walletStore.signTransaction(xdr, { networkPassphrase })
 *
 * // Estado reactivo
 * walletStore.isConnected
 * walletStore.activeWallet
 * walletStore.wallets
 *
 * Garantías de enrutado de firmas:
 * - Cada wallet recuerda su proveedor (`providerId`) y su sub-módulo
 *   (`moduleId`, ej: 'xbull' | 'freighter' dentro de Stellar Wallets Kit).
 * - Antes de CADA firma se re-activa el módulo de la wallet objetivo, de
 *   modo que cambiar de wallet activa (o firmar para una dirección
 *   concreta) nunca deja "operativa" la wallet anterior.
 * - Tras la firma se verifica que el firmante coincida con la dirección
 *   pedida (si la wallet lo reporta), evitando pagos firmados por otra
 *   cuenta cuando el usuario cambió de cuenta dentro de la extensión.
 *
 * Códigos de error que pueden lanzar las firmas (mapear a i18n en la UI):
 * - 'WALLET_RECONNECT_REQUIRED'  → la sesión/módulo ya no está disponible
 * - 'WALLET_ACCOUNT_MISMATCH'    → firmó una cuenta distinta a la pedida
 */

import type {
  ConnectedWallet,
  SignAuthEntryResult,
  SignMessageResult,
  SignTransactionOptions,
  SignTransactionResult,
  WalletProvider,
} from '@/services/wallet/types'

import { defineStore } from 'pinia'

import { getAllProviders, getProvider } from '@/services/wallet/providers'

const STORAGE_KEY = 'earnlumens_wallets'
const ACTIVE_WALLET_KEY = 'earnlumens_active_wallet'

/** Claves de persistencia interna de Stellar Wallets Kit (para migración) */
const SWK_ACTIVE_ADDRESS_KEY = '@StellarWalletsKit/activeAddress'
const SWK_SELECTED_MODULE_KEY = '@StellarWalletsKit/selectedModuleId'

/**
 * Formatea una dirección de forma abreviada
 */
function formatAddress (address: string): string {
  if (!address || address.length <= 14) {
    return address
  }
  return `${address.slice(0, 7)}...${address.slice(-7)}`
}

/**
 * Valida que un valor persistido tenga la forma mínima de ConnectedWallet.
 * Tolera entradas de versiones anteriores (sin moduleId) y descarta basura.
 */
function isValidStoredWallet (value: unknown): value is ConnectedWallet {
  if (!value || typeof value !== 'object') {
    return false
  }
  const w = value as Record<string, unknown>
  return typeof w.address === 'string'
    && w.address.length > 0
    && typeof w.providerId === 'string'
    && w.providerId.length > 0
}

interface WalletState {
  /** Lista de wallets conectadas */
  wallets: ConnectedWallet[]
  /** Dirección de la wallet activa */
  activeAddress: string
  /** Si el sistema está inicializado */
  isInitialized: boolean
  /** Si hay una operación en progreso */
  isLoading: boolean
  /** Último error */
  lastError: string | null
}

export const useWalletStore = defineStore('wallet', {
  state: (): WalletState => ({
    wallets: [],
    activeAddress: '',
    isInitialized: false,
    isLoading: false,
    lastError: null,
  }),

  getters: {
    /**
     * Si hay al menos una wallet conectada
     */
    isConnected: (state): boolean => {
      return state.wallets.length > 0 && !!state.activeAddress
    },

    /**
     * Wallet activa actual
     */
    activeWallet: (state): ConnectedWallet | undefined => {
      return state.wallets.find(w => w.address === state.activeAddress)
    },

    /**
     * Dirección activa formateada (abreviada)
     */
    shortActiveAddress: (state): string => {
      return formatAddress(state.activeAddress)
    },

    /**
     * Proveedor de la wallet activa
     */
    activeProvider (): WalletProvider | undefined {
      const wallet = this.activeWallet
      if (!wallet) {
        return undefined
      }
      return getProvider(wallet.providerId)
    },

    /**
     * Lista de proveedores disponibles para conectar
     */
    availableProviders (): WalletProvider[] {
      return getAllProviders()
    },
  },

  actions: {
    /**
     * Inicializa el sistema de wallets
     * Debe llamarse al iniciar la app
     */
    async initialize () {
      if (this.isInitialized) {
        return
      }

      // Cargar wallets del storage
      this.loadFromStorage()

      // Inicializar TODOS los proveedores registrados
      const providers = getAllProviders()
      await Promise.all(providers.map(async provider => {
        try {
          await provider.init()

          // Escuchar cambios de estado de cada proveedor.
          // Solo adoptamos la dirección reportada cuando la app aún no
          // tiene wallet activa: la selección del usuario (persistida por
          // esta store) es la fuente de verdad, no el estado interno del
          // proveedor (que refleja la ÚLTIMA wallet autenticada, no la
          // elegida por el usuario).
          provider.onStateChange(address => {
            if (address && !this.activeAddress) {
              const wallet = this.wallets.find(
                w => w.address === address && w.providerId === provider.id,
              )
              if (wallet) {
                this.activeAddress = address
                this.saveActiveToStorage()
              }
            }
          })

          provider.onDisconnect(() => {
            // El proveedor se desconectó, pero mantenemos las wallets en memoria
            // Solo limpiamos si el usuario lo pide explícitamente
          })
        } catch (error) {
          console.error(`[WalletStore] Error initializing provider ${provider.id}:`, error)
        }
      }))

      // Sincronizar el módulo del proveedor con la wallet activa persistida,
      // para que la primera firma tras recargar vaya a la wallet correcta.
      const active = this.activeWallet
      if (active) {
        this.activateWalletSession(active).catch(() => {
          // Wallet legacy sin moduleId o módulo no disponible: se resolverá
          // (o fallará con error claro) en el momento de firmar.
        })
      }

      // Sincronización multi-pestaña: si otra pestaña conecta/elimina
      // wallets o cambia la activa, reflejarlo aquí.
      if (typeof window !== 'undefined') {
        window.addEventListener('storage', event => {
          if (event.key === STORAGE_KEY || event.key === ACTIVE_WALLET_KEY) {
            this.loadFromStorage()
          }
        })
      }

      this.isInitialized = true
    },

    /**
     * Re-activa la sesión de una wallet en su proveedor (re-enruta firmas
     * hacia su módulo). Idempotente, sin popups.
     */
    async activateWalletSession (wallet: ConnectedWallet): Promise<void> {
      const provider = getProvider(wallet.providerId)
      if (!provider) {
        throw new Error('WALLET_RECONNECT_REQUIRED')
      }
      if (!provider.isInitialized) {
        await provider.init()
      }
      if (provider.activateWallet) {
        await provider.activateWallet(wallet)
      }
    },

    /**
     * Conecta una nueva wallet usando el proveedor especificado
     * @param providerId - ID del proveedor a usar (si no se especifica, usa el primero disponible)
     */
    async connect (providerId?: string): Promise<ConnectedWallet | null> {
      // Evitar dos flujos de conexión superpuestos (doble click)
      if (this.isLoading) {
        return null
      }

      // Si no se especifica, usar el primer proveedor disponible
      const providers = getAllProviders()
      const resolvedProviderId = providerId ?? providers[0]?.id

      if (!resolvedProviderId) {
        this.lastError = 'No hay proveedores de wallet disponibles'
        return null
      }

      const provider = getProvider(resolvedProviderId)
      if (!provider) {
        this.lastError = `Proveedor no encontrado: ${resolvedProviderId}`
        return null
      }

      this.isLoading = true
      this.lastError = null

      try {
        if (!provider.isInitialized) {
          await provider.init()
        }

        const result = await provider.connect()
        if (!result) {
          return null
        }

        const { address, providerName, moduleId } = result

        // Verificar si ya existe (misma dirección)
        const existing = this.wallets.find(w => w.address === address)
        if (existing) {
          // Re-conectada (quizá vía otro módulo/proveedor): actualizar el
          // enrutado para que las firmas vayan a la wallet usada AHORA.
          existing.providerId = resolvedProviderId
          existing.providerName = providerName
          existing.moduleId = moduleId
          this.activeAddress = address
          this.saveToStorage()
          return existing
        }

        // Crear nueva wallet
        const wallet: ConnectedWallet = {
          address,
          providerId: resolvedProviderId,
          providerName,
          moduleId,
          connectedAt: Date.now(),
        }

        this.wallets.push(wallet)
        this.activeAddress = address
        this.saveToStorage()

        return wallet
      } catch (error) {
        this.lastError = error instanceof Error ? error.message : 'Error desconocido'
        console.error('[WalletStore] Error connecting:', error)
        return null
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Selecciona una wallet como activa.
     * Además de cambiar el estado de la app, re-activa el módulo de esa
     * wallet en su proveedor para que la ANTERIOR deje de ser la firmante.
     */
    selectWallet (address: string) {
      const wallet = this.wallets.find(w => w.address === address)
      if (!wallet) {
        return
      }

      this.activeAddress = address
      this.saveActiveToStorage()

      // Sincronizar el proveedor en segundo plano. Si falla (wallet legacy
      // sin moduleId, módulo retirado), la firma re-intentará la activación
      // y lanzará un error claro.
      this.activateWalletSession(wallet).catch(() => {})
    },

    /**
     * Remueve una wallet específica
     */
    removeWallet (address: string) {
      const index = this.wallets.findIndex(w => w.address === address)
      if (index === -1) {
        return
      }

      const [removed] = this.wallets.splice(index, 1)

      // Si era la última wallet de su proveedor, cerrar la sesión del
      // proveedor para que no quede "operativa" una wallet eliminada.
      if (removed && !this.wallets.some(w => w.providerId === removed.providerId)) {
        const provider = getProvider(removed.providerId)
        provider?.disconnect().catch(error => {
          console.error('[WalletStore] Error disconnecting provider:', error)
        })
      }

      // Si era la activa, seleccionar otra o limpiar
      if (this.activeAddress === address) {
        const next = this.wallets[0]
        this.activeAddress = next?.address ?? ''
        if (next) {
          this.activateWalletSession(next).catch(() => {})
        }
      }

      this.saveToStorage()
    },

    /**
     * Desconecta todas las wallets (de TODOS los proveedores con sesión)
     */
    async disconnectAll () {
      this.isLoading = true

      try {
        // Desconectar cada proveedor que tenga al menos una wallet,
        // aislando errores para que un proveedor caído no bloquee al resto.
        const providerIds = [...new Set(this.wallets.map(w => w.providerId))]
        await Promise.all(providerIds.map(async id => {
          try {
            await getProvider(id)?.disconnect()
          } catch (error) {
            console.error(`[WalletStore] Error disconnecting provider ${id}:`, error)
          }
        }))

        // Limpiar estado
        this.wallets = []
        this.activeAddress = ''
        this.clearStorage()
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Resuelve la wallet objetivo de una firma: la que coincide con
     * options.address, o la activa. Lanza si no hay ninguna utilizable.
     */
    resolveSigningWallet (requestedAddress?: string): ConnectedWallet {
      const wallet = requestedAddress
        ? this.wallets.find(w => w.address === requestedAddress)
        : this.activeWallet

      if (!wallet) {
        throw new Error(requestedAddress && this.activeWallet
          ? 'WALLET_ACCOUNT_MISMATCH'
          : 'No hay wallet activa')
      }
      return wallet
    },

    /**
     * Prepara una firma: resuelve wallet + proveedor y re-activa el módulo
     * correcto, garantizando que la wallet anterior no siga operativa.
     */
    async prepareSigning (requestedAddress?: string): Promise<{ wallet: ConnectedWallet, provider: WalletProvider }> {
      const wallet = this.resolveSigningWallet(requestedAddress)

      const provider = getProvider(wallet.providerId)
      if (!provider) {
        throw new Error('WALLET_RECONNECT_REQUIRED')
      }

      await this.activateWalletSession(wallet)
      return { wallet, provider }
    },

    /**
     * Verifica que la cuenta que firmó sea la pedida (cuando la wallet lo
     * reporta). Protege contra cambios de cuenta dentro de la extensión.
     */
    assertSignerMatches (expected: string, signerAddress?: string) {
      if (signerAddress && signerAddress !== expected) {
        throw new Error('WALLET_ACCOUNT_MISMATCH')
      }
    },

    /**
     * Firma una transacción XDR con la wallet activa (o con la wallet de
     * options.address si se especifica)
     */
    async signTransaction (
      xdr: string,
      options?: SignTransactionOptions,
    ): Promise<SignTransactionResult> {
      const { wallet, provider } = await this.prepareSigning(options?.address)

      const result = await provider.signTransaction(xdr, {
        ...options,
        address: wallet.address,
      })

      this.assertSignerMatches(wallet.address, result.signerAddress)
      return result
    },

    /**
     * Firma un auth entry con la wallet activa
     */
    async signAuthEntry (
      authEntry: string,
      options?: SignTransactionOptions,
    ): Promise<SignAuthEntryResult> {
      const { wallet, provider } = await this.prepareSigning(options?.address)

      const result = await provider.signAuthEntry(authEntry, {
        ...options,
        address: wallet.address,
      })

      this.assertSignerMatches(wallet.address, result.signerAddress)
      return result
    },

    /**
     * Firma un mensaje con la wallet activa
     */
    async signMessage (
      message: string,
      options?: SignTransactionOptions,
    ): Promise<SignMessageResult> {
      const { wallet, provider } = await this.prepareSigning(options?.address)

      const result = await provider.signMessage(message, {
        ...options,
        address: wallet.address,
      })

      this.assertSignerMatches(wallet.address, result.signerAddress)
      return result
    },

    /**
     * Formatea una dirección de forma abreviada (wrapper de la función auxiliar)
     */
    formatAddress,

    // === Storage ===

    loadFromStorage () {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed: unknown = JSON.parse(stored)
          this.wallets = Array.isArray(parsed)
            ? parsed.filter(w => isValidStoredWallet(w))
            : []
        } else {
          this.wallets = []
        }

        // Migración: wallets persistidas por versiones anteriores no tienen
        // moduleId. Si el kit aún recuerda qué módulo usó esa dirección,
        // backfillear para que el enrutado de firmas funcione sin reconectar.
        this.migrateModuleIds()

        const activeStored = localStorage.getItem(ACTIVE_WALLET_KEY)
        if (activeStored && this.wallets.some(w => w.address === activeStored)) {
          this.activeAddress = activeStored
        } else if (this.wallets.length > 0 && this.wallets[0]) {
          this.activeAddress = this.wallets[0].address
        } else {
          this.activeAddress = ''
        }
      } catch {
        this.wallets = []
        this.activeAddress = ''
      }
    },

    /**
     * Backfill de moduleId para wallets SWK legacy: si la dirección coincide
     * con la última sesión del kit, su selectedModuleId es el módulo correcto.
     */
    migrateModuleIds () {
      try {
        const kitAddress = localStorage.getItem(SWK_ACTIVE_ADDRESS_KEY)
        const kitModuleId = localStorage.getItem(SWK_SELECTED_MODULE_KEY)
        if (!kitAddress || !kitModuleId) {
          return
        }

        let migrated = false
        for (const wallet of this.wallets) {
          if (
            !wallet.moduleId
            && wallet.providerId === 'stellar-wallets-kit'
            && wallet.address === kitAddress
          ) {
            wallet.moduleId = kitModuleId
            migrated = true
          }
        }
        if (migrated) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.wallets))
        }
      } catch {
        // Ignorar: la migración es best-effort
      }
    },

    saveToStorage () {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.wallets))
      this.saveActiveToStorage()
    },

    saveActiveToStorage () {
      if (this.activeAddress) {
        localStorage.setItem(ACTIVE_WALLET_KEY, this.activeAddress)
      } else {
        localStorage.removeItem(ACTIVE_WALLET_KEY)
      }
    },

    clearStorage () {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(ACTIVE_WALLET_KEY)
    },
  },
})
