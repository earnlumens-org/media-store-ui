import type { ConnectedWallet, WalletProvider } from '@/services/wallet/types'

import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useWalletStore } from '../wallet'

// ── Mock the provider registry ───────────────────────────────
// Two fake providers: 'stellar-wallets-kit' (multi-module, with
// activateWallet) and 'x-payments' (single-wallet, no activateWallet) to
// exercise both contract shapes.

interface FakeProvider extends WalletProvider {
  // test hooks
  _connectResult: { address: string, providerName: string, moduleId?: string } | null
  _signerAddress: string | undefined
  _activatedModuleIds: string[]
  _disconnectCalls: number
  _signCalls: Array<{ xdr: string, address?: string }>
}

function makeFakeProvider (id: string, withActivate: boolean): FakeProvider {
  const provider: FakeProvider = {
    id,
    name: id,
    isInitialized: false,
    _connectResult: null,
    _signerAddress: undefined,
    _activatedModuleIds: [],
    _disconnectCalls: 0,
    _signCalls: [],
    async init () {
      ;(provider as { isInitialized: boolean }).isInitialized = true
    },
    async connect () {
      return provider._connectResult
    },
    async disconnect () {
      provider._disconnectCalls++
    },
    async getAddress () {
      return null
    },
    async signTransaction (xdr, options) {
      provider._signCalls.push({ xdr, address: options?.address })
      return { signedTxXdr: `signed:${xdr}`, signerAddress: provider._signerAddress }
    },
    async signAuthEntry (authEntry) {
      return { signedAuthEntry: `signed:${authEntry}`, signerAddress: provider._signerAddress }
    },
    async signMessage (message) {
      return { signedMessage: `signed:${message}`, signerAddress: provider._signerAddress }
    },
    onStateChange () {
      return () => {}
    },
    onDisconnect () {
      return () => {}
    },
  }

  if (withActivate) {
    provider.activateWallet = async (wallet: ConnectedWallet) => {
      if (!wallet.moduleId) {
        throw new Error('WALLET_RECONNECT_REQUIRED')
      }
      provider._activatedModuleIds.push(wallet.moduleId)
    }
  }

  return provider
}

let swkProvider: FakeProvider
let xPaymentsProvider: FakeProvider

vi.mock('@/services/wallet/providers', () => ({
  getProvider: (id: string) =>
    id === 'stellar-wallets-kit' ? swkProvider : (id === 'x-payments' ? xPaymentsProvider : undefined),
  getAllProviders: () => [swkProvider, xPaymentsProvider],
}))

// ── Fake localStorage ────────────────────────────────────────
const storage = new Map<string, string>()

vi.stubGlobal('localStorage', {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, val: string) => storage.set(key, val),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clear(),
})

beforeEach(() => {
  setActivePinia(createPinia())
  storage.clear()
  swkProvider = makeFakeProvider('stellar-wallets-kit', true)
  xPaymentsProvider = makeFakeProvider('x-payments', false)
})

afterEach(() => {
  vi.restoreAllMocks()
})

const ADDR_A = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
const ADDR_B = 'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'

async function connectWallet (address: string, moduleId: string, providerName = moduleId) {
  swkProvider._connectResult = { address, providerName, moduleId }
  const store = useWalletStore()
  return store.connect('stellar-wallets-kit')
}

describe('wallet store — connect', () => {
  it('stores the moduleId so signing can be re-routed later', async () => {
    const store = useWalletStore()
    await connectWallet(ADDR_A, 'xbull', 'xBull')

    expect(store.wallets).toHaveLength(1)
    expect(store.wallets[0]?.moduleId).toBe('xbull')
    expect(store.activeAddress).toBe(ADDR_A)
  })

  it('updates module routing when the same address reconnects via another wallet', async () => {
    const store = useWalletStore()
    await connectWallet(ADDR_A, 'xbull', 'xBull')
    await connectWallet(ADDR_A, 'freighter', 'Freighter')

    expect(store.wallets).toHaveLength(1)
    expect(store.wallets[0]?.moduleId).toBe('freighter')
    expect(store.wallets[0]?.providerName).toBe('Freighter')
  })

  it('returns null and keeps state when the user closes the modal', async () => {
    const store = useWalletStore()
    swkProvider._connectResult = null

    const result = await store.connect('stellar-wallets-kit')
    expect(result).toBeNull()
    expect(store.wallets).toHaveLength(0)
    expect(store.isConnected).toBe(false)
  })
})

describe('wallet store — switching wallets', () => {
  it('re-activates the selected wallet module so the previous wallet stops signing', async () => {
    const store = useWalletStore()
    await connectWallet(ADDR_A, 'xbull')
    await connectWallet(ADDR_B, 'freighter')

    store.selectWallet(ADDR_A)
    await vi.waitFor(() => {
      expect(swkProvider._activatedModuleIds.at(-1)).toBe('xbull')
    })
    expect(store.activeAddress).toBe(ADDR_A)
  })

  it('routes signing through the ACTIVE wallet module after a switch', async () => {
    const store = useWalletStore()
    await connectWallet(ADDR_A, 'xbull')
    await connectWallet(ADDR_B, 'freighter')
    store.selectWallet(ADDR_A)

    swkProvider._signerAddress = ADDR_A
    const result = await store.signTransaction('XDR', { networkPassphrase: 'test' })

    expect(result.signedTxXdr).toBe('signed:XDR')
    // The LAST activation before signing must be the active wallet's module
    expect(swkProvider._activatedModuleIds.at(-1)).toBe('xbull')
    expect(swkProvider._signCalls.at(-1)?.address).toBe(ADDR_A)
  })

  it('pins signing to options.address even if the active wallet changed mid-flow', async () => {
    const store = useWalletStore()
    await connectWallet(ADDR_A, 'xbull')
    await connectWallet(ADDR_B, 'freighter')
    // active is B; checkout was prepared for A
    swkProvider._signerAddress = ADDR_A

    await store.signTransaction('XDR', { address: ADDR_A })

    expect(swkProvider._activatedModuleIds.at(-1)).toBe('xbull')
    expect(swkProvider._signCalls.at(-1)?.address).toBe(ADDR_A)
  })

  it('rejects signing for an address that is no longer connected', async () => {
    const store = useWalletStore()
    await connectWallet(ADDR_A, 'xbull')

    await expect(store.signTransaction('XDR', { address: ADDR_B }))
      .rejects
      .toThrow('WALLET_ACCOUNT_MISMATCH')
  })

  it('rejects when the wallet signs with a different account than requested', async () => {
    const store = useWalletStore()
    await connectWallet(ADDR_A, 'xbull')
    swkProvider._signerAddress = ADDR_B

    await expect(store.signTransaction('XDR')).rejects.toThrow('WALLET_ACCOUNT_MISMATCH')
  })

  it('fails with a clear reconnect error for legacy wallets without moduleId', async () => {
    const store = useWalletStore()
    await connectWallet(ADDR_A, 'xbull')
    const wallet = store.wallets[0]
    if (wallet) {
      delete wallet.moduleId
    }

    await expect(store.signTransaction('XDR')).rejects.toThrow('WALLET_RECONNECT_REQUIRED')
  })
})

describe('wallet store — remove & disconnect', () => {
  it('disconnects the provider when its last wallet is removed', async () => {
    const store = useWalletStore()
    await connectWallet(ADDR_A, 'xbull')

    store.removeWallet(ADDR_A)
    await vi.waitFor(() => {
      expect(swkProvider._disconnectCalls).toBe(1)
    })
    expect(store.wallets).toHaveLength(0)
    expect(store.activeAddress).toBe('')
    expect(store.isConnected).toBe(false)
  })

  it('keeps the provider session and activates the next wallet when one of several is removed', async () => {
    const store = useWalletStore()
    await connectWallet(ADDR_A, 'xbull')
    await connectWallet(ADDR_B, 'freighter')

    store.removeWallet(ADDR_B)
    expect(swkProvider._disconnectCalls).toBe(0)
    expect(store.activeAddress).toBe(ADDR_A)
    await vi.waitFor(() => {
      expect(swkProvider._activatedModuleIds.at(-1)).toBe('xbull')
    })
  })

  it('disconnectAll disconnects EVERY provider with a session, isolating failures', async () => {
    const store = useWalletStore()
    await connectWallet(ADDR_A, 'xbull')
    xPaymentsProvider._connectResult = { address: ADDR_B, providerName: 'X Payments' }
    await store.connect('x-payments')

    swkProvider.disconnect = async () => {
      throw new Error('boom')
    }

    await store.disconnectAll()
    expect(xPaymentsProvider._disconnectCalls).toBe(1)
    expect(store.wallets).toHaveLength(0)
    expect(storage.get('earnlumens_wallets')).toBeUndefined()
    expect(storage.get('earnlumens_active_wallet')).toBeUndefined()
  })
})

describe('wallet store — persistence & migration', () => {
  it('restores wallets and the active selection from storage', async () => {
    storage.set('earnlumens_wallets', JSON.stringify([
      { address: ADDR_A, providerId: 'stellar-wallets-kit', providerName: 'xBull', moduleId: 'xbull', connectedAt: 1 },
      { address: ADDR_B, providerId: 'stellar-wallets-kit', providerName: 'Freighter', moduleId: 'freighter', connectedAt: 2 },
    ]))
    storage.set('earnlumens_active_wallet', ADDR_B)

    const store = useWalletStore()
    await store.initialize()

    expect(store.wallets).toHaveLength(2)
    expect(store.activeAddress).toBe(ADDR_B)
    // boot must sync the provider module to the persisted ACTIVE wallet
    await vi.waitFor(() => {
      expect(swkProvider._activatedModuleIds.at(-1)).toBe('freighter')
    })
  })

  it('drops corrupted storage entries instead of crashing', async () => {
    storage.set('earnlumens_wallets', JSON.stringify([
      { address: ADDR_A, providerId: 'stellar-wallets-kit', providerName: 'xBull', moduleId: 'xbull', connectedAt: 1 },
      null,
      42,
      { providerName: 'no-address' },
    ]))

    const store = useWalletStore()
    await store.initialize()

    expect(store.wallets).toHaveLength(1)
    expect(store.activeAddress).toBe(ADDR_A)
  })

  it('backfills moduleId for legacy wallets from the kit persisted session', async () => {
    storage.set('earnlumens_wallets', JSON.stringify([
      { address: ADDR_A, providerId: 'stellar-wallets-kit', providerName: 'xBull', connectedAt: 1 },
    ]))
    storage.set('@StellarWalletsKit/activeAddress', ADDR_A)
    storage.set('@StellarWalletsKit/selectedModuleId', 'xbull')

    const store = useWalletStore()
    await store.initialize()

    expect(store.wallets[0]?.moduleId).toBe('xbull')
  })

  it('does NOT backfill moduleId when the kit session belongs to another address', async () => {
    storage.set('earnlumens_wallets', JSON.stringify([
      { address: ADDR_A, providerId: 'stellar-wallets-kit', providerName: 'xBull', connectedAt: 1 },
    ]))
    storage.set('@StellarWalletsKit/activeAddress', ADDR_B)
    storage.set('@StellarWalletsKit/selectedModuleId', 'freighter')

    const store = useWalletStore()
    await store.initialize()

    expect(store.wallets[0]?.moduleId).toBeUndefined()
  })

  it('keeps wallets of unregistered providers but fails signing with a clear error', async () => {
    storage.set('earnlumens_wallets', JSON.stringify([
      { address: ADDR_A, providerId: 'gone-provider', providerName: 'Gone', connectedAt: 1 },
    ]))

    const store = useWalletStore()
    await store.initialize()

    expect(store.wallets).toHaveLength(1)
    await expect(store.signTransaction('XDR')).rejects.toThrow('WALLET_RECONNECT_REQUIRED')
  })

  it('single-wallet providers without activateWallet sign without activation', async () => {
    const store = useWalletStore()
    xPaymentsProvider._connectResult = { address: ADDR_B, providerName: 'X Payments' }
    xPaymentsProvider._signerAddress = ADDR_B
    await store.connect('x-payments')

    const result = await store.signTransaction('XDR')
    expect(result.signedTxXdr).toBe('signed:XDR')
  })
})
