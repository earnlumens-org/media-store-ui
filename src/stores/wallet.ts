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

import { defaultProvider, getProvider } from '@/services/wallet/providers'

const STORAGE_KEY = 'earnlumens_wallets'
const ACTIVE_WALLET_KEY = 'earnlumens_active_wallet'

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
      const address = state.activeAddress
      if (!address) {
        return ''
      }
      if (address.length <= 14) {
        return address
      }
      return `${address.slice(0, 7)}...${address.slice(-7)}`
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

      // Inicializar proveedor por defecto
      await defaultProvider.init()

      // Escuchar cambios de estado del proveedor
      defaultProvider.onStateChange(address => {
        if (address && address !== this.activeAddress) {
          this.activeAddress = address
          this.saveActiveToStorage()
        }
      })

      defaultProvider.onDisconnect(() => {
        // El proveedor se desconectó, pero mantenemos las wallets en memoria
        // Solo limpiamos si el usuario lo pide explícitamente
      })

      this.isInitialized = true
    },

    /**
     * Conecta una nueva wallet usando el proveedor especificado
     */
    async connect (providerId = 'stellar-wallets-kit'): Promise<ConnectedWallet | null> {
      const provider = getProvider(providerId)
      if (!provider) {
        this.lastError = `Proveedor no encontrado: ${providerId}`
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

        const { address, providerName } = result

        // Verificar si ya existe
        const existing = this.wallets.find(w => w.address === address)
        if (existing) {
          // Ya existe, solo activarla
          this.activeAddress = address
          this.saveActiveToStorage()
          return existing
        }

        // Crear nueva wallet
        const wallet: ConnectedWallet = {
          address,
          providerId,
          providerName,
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
     * Selecciona una wallet como activa
     */
    selectWallet (address: string) {
      const wallet = this.wallets.find(w => w.address === address)
      if (wallet) {
        this.activeAddress = address
        this.saveActiveToStorage()
      }
    },

    /**
     * Remueve una wallet específica
     */
    removeWallet (address: string) {
      const index = this.wallets.findIndex(w => w.address === address)
      if (index !== -1) {
        this.wallets.splice(index, 1)

        // Si era la activa, seleccionar otra o limpiar
        if (this.activeAddress === address) {
          this.activeAddress = this.wallets[0]?.address ?? ''
        }

        this.saveToStorage()
      }
    },

    /**
     * Desconecta todas las wallets
     */
    async disconnectAll () {
      this.isLoading = true

      try {
        // Desconectar del proveedor activo
        const provider = this.activeProvider
        if (provider) {
          await provider.disconnect()
        }

        // Limpiar estado
        this.wallets = []
        this.activeAddress = ''
        this.clearStorage()
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Firma una transacción XDR con la wallet activa
     */
    async signTransaction (
      xdr: string,
      options?: SignTransactionOptions,
    ): Promise<SignTransactionResult> {
      const provider = this.activeProvider
      if (!provider) {
        throw new Error('No hay wallet activa')
      }

      return provider.signTransaction(xdr, {
        ...options,
        address: options?.address || this.activeAddress,
      })
    },

    /**
     * Firma un auth entry con la wallet activa
     */
    async signAuthEntry (
      authEntry: string,
      options?: SignTransactionOptions,
    ): Promise<SignAuthEntryResult> {
      const provider = this.activeProvider
      if (!provider) {
        throw new Error('No hay wallet activa')
      }

      return provider.signAuthEntry(authEntry, {
        ...options,
        address: options?.address || this.activeAddress,
      })
    },

    /**
     * Firma un mensaje con la wallet activa
     */
    async signMessage (
      message: string,
      options?: SignTransactionOptions,
    ): Promise<SignMessageResult> {
      const provider = this.activeProvider
      if (!provider) {
        throw new Error('No hay wallet activa')
      }

      return provider.signMessage(message, {
        ...options,
        address: options?.address || this.activeAddress,
      })
    },

    /**
     * Formatea una dirección de forma abreviada
     */
    formatAddress (address: string): string {
      if (!address) {
        return ''
      }
      if (address.length <= 14) {
        return address
      }
      return `${address.slice(0, 7)}...${address.slice(-7)}`
    },

    // === Storage ===

    loadFromStorage () {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          this.wallets = JSON.parse(stored)
        }

        const activeStored = localStorage.getItem(ACTIVE_WALLET_KEY)
        if (activeStored && this.wallets.some(w => w.address === activeStored)) {
          this.activeAddress = activeStored
        } else if (this.wallets.length > 0 && this.wallets[0]) {
          this.activeAddress = this.wallets[0].address
        }
      } catch {
        this.wallets = []
        this.activeAddress = ''
      }
    },

    saveToStorage () {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.wallets))
      this.saveActiveToStorage()
    },

    saveActiveToStorage () {
      if (this.activeAddress) {
        localStorage.setItem(ACTIVE_WALLET_KEY, this.activeAddress)
      }
    },

    clearStorage () {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(ACTIVE_WALLET_KEY)
    },
  },
})
