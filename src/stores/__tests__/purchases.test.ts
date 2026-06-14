import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '../auth'
import { usePurchasesStore } from '../purchases'

// ── Mock the API module ──────────────────────────────────────
const getPurchasesMock = vi.fn()
const getPurchaseCollectionsMock = vi.fn()

vi.mock('@/api/modules/purchase.api', () => ({
  getPurchases: (...args: unknown[]) => getPurchasesMock(...args),
  getPurchaseCollections: (...args: unknown[]) => getPurchaseCollectionsMock(...args),
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
  getPurchasesMock.mockReset()
  getPurchaseCollectionsMock.mockReset()
  // Default: no purchased collections unless a test overrides it.
  getPurchaseCollectionsMock.mockResolvedValue(apiPage([], 0, 1))
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ── Helpers ──────────────────────────────────────────────────
function makePurchasedEntry (id: string, title = `Entry ${id}`) {
  return {
    id,
    type: 'video' as const,
    title,
    purchasedAt: '2026-03-01T00:00:00Z',
    authorName: 'author',
    isPaid: true,
    tags: [],
    publishedAt: '2026-02-28T00:00:00Z',
  }
}

function makePurchasedCollection (id: string, title = `Collection ${id}`) {
  return {
    id,
    title,
    collectionType: 'catalog',
    purchasedAt: '2026-03-01T00:00:00Z',
    authorName: 'author',
    isPaid: true,
    itemCount: 3,
    publishedAt: '2026-02-28T00:00:00Z',
  }
}

function apiPage<T> (
  items: T[],
  page: number,
  totalPages: number,
) {
  return {
    items,
    page,
    size: 100,
    totalElements: items.length,
    totalPages,
  }
}

describe('purchasesStore.loadPurchaseIds', () => {
  it('fetches purchases from server and populates the store', async () => {
    getPurchasesMock.mockResolvedValueOnce(
      apiPage([makePurchasedEntry('e1'), makePurchasedEntry('e2')], 0, 1),
    )

    const store = usePurchasesStore()
    await store.loadPurchaseIds()

    expect(store.isUnlocked('e1')).toBe(true)
    expect(store.isUnlocked('e2')).toBe(true)
    expect(store.totalPurchases).toBe(2)
  })

  it('paginates through multiple pages', async () => {
    getPurchasesMock
      .mockResolvedValueOnce(apiPage([makePurchasedEntry('p1')], 0, 3))
      .mockResolvedValueOnce(apiPage([makePurchasedEntry('p2')], 1, 3))
      .mockResolvedValueOnce(apiPage([makePurchasedEntry('p3')], 2, 3))

    const store = usePurchasesStore()
    await store.loadPurchaseIds()

    expect(store.totalPurchases).toBe(3)
    expect(getPurchasesMock).toHaveBeenCalledTimes(3)
    expect(getPurchasesMock).toHaveBeenCalledWith({ page: 0, size: 100 })
    expect(getPurchasesMock).toHaveBeenCalledWith({ page: 1, size: 100 })
    expect(getPurchasesMock).toHaveBeenCalledWith({ page: 2, size: 100 })
  })

  it('loads purchased collection IDs so collection cards unlock', async () => {
    getPurchasesMock.mockResolvedValueOnce(apiPage([makePurchasedEntry('e1')], 0, 1))
    getPurchaseCollectionsMock.mockReset()
    getPurchaseCollectionsMock.mockResolvedValueOnce(
      apiPage([makePurchasedCollection('c1'), makePurchasedCollection('c2')], 0, 1),
    )

    const store = usePurchasesStore()
    await store.loadPurchaseIds()

    expect(store.isUnlocked('e1')).toBe(true)
    expect(store.isUnlocked('c1')).toBe(true)
    expect(store.isUnlocked('c2')).toBe(true)
    expect(store.getPurchase('c1')?.type).toBe('catalog')
  })

  it('paginates through multiple collection pages', async () => {
    getPurchasesMock.mockResolvedValueOnce(apiPage([], 0, 1))
    getPurchaseCollectionsMock.mockReset()
    getPurchaseCollectionsMock
      .mockResolvedValueOnce(apiPage([makePurchasedCollection('c1')], 0, 2))
      .mockResolvedValueOnce(apiPage([makePurchasedCollection('c2')], 1, 2))

    const store = usePurchasesStore()
    await store.loadPurchaseIds()

    expect(store.totalPurchases).toBe(2)
    expect(getPurchaseCollectionsMock).toHaveBeenCalledTimes(2)
    expect(getPurchaseCollectionsMock).toHaveBeenCalledWith({ page: 0, size: 100 })
    expect(getPurchaseCollectionsMock).toHaveBeenCalledWith({ page: 1, size: 100 })
  })

  it('merges server data with existing localStorage cache', async () => {
    // Pre-populate localStorage
    const cached = [{ id: 'cached-1', purchasedAt: '2026-01-01T00:00:00Z' }]
    storage.set('earnlumens_purchases', JSON.stringify(cached))

    // Server returns a new purchase
    getPurchasesMock.mockResolvedValueOnce(
      apiPage([makePurchasedEntry('server-1')], 0, 1),
    )

    const store = usePurchasesStore()
    await store.loadPurchaseIds()

    // Both cached and server entries should exist
    expect(store.isUnlocked('cached-1')).toBe(true)
    expect(store.isUnlocked('server-1')).toBe(true)
    expect(store.totalPurchases).toBe(2)
  })

  it('does not overwrite existing cached entries with server data', async () => {
    // Cache has a record with extra metadata
    const cached = [{
      id: 'e1',
      purchasedAt: '2026-01-01T00:00:00Z',
      type: 'audio',
      title: 'My Custom Title',
    }]
    storage.set('earnlumens_purchases', JSON.stringify(cached))

    // Server returns the same ID
    getPurchasesMock.mockResolvedValueOnce(
      apiPage([makePurchasedEntry('e1', 'Server Title')], 0, 1),
    )

    const store = usePurchasesStore()
    await store.loadPurchaseIds()

    // Should keep the cached version, not overwrite
    expect(store.getPurchase('e1')?.title).toBe('My Custom Title')
  })

  it('clearAll cancels in-flight loadPurchaseIds', async () => {
    // First call returns page 0 of 2, then clearAll is called before page 1
    let resolveSecondPage: (v: ReturnType<typeof apiPage>) => void
    getPurchasesMock
      .mockResolvedValueOnce(apiPage([makePurchasedEntry('p1')], 0, 2))
      .mockImplementationOnce(() => new Promise(resolve => {
        resolveSecondPage = resolve
      }))

    const store = usePurchasesStore()
    const loadPromise = store.loadPurchaseIds()

    // Wait for the first page to resolve
    await new Promise(r => setTimeout(r, 10))

    // Logout clears while page 2 is still pending
    store.clearAll()
    expect(store.totalPurchases).toBe(0)
    expect(storage.has('earnlumens_purchases')).toBe(false)

    // Resolve the pending page — should NOT write back to store/storage
    resolveSecondPage!(apiPage([makePurchasedEntry('p2')], 1, 2))
    await loadPromise

    expect(store.totalPurchases).toBe(0)
    expect(storage.has('earnlumens_purchases')).toBe(false)
  })

  it('persists to localStorage after server sync', async () => {
    getPurchasesMock.mockResolvedValueOnce(
      apiPage([makePurchasedEntry('persisted-1')], 0, 1),
    )

    const store = usePurchasesStore()
    await store.loadPurchaseIds()

    const raw = storage.get('earnlumens_purchases')
    expect(raw).toBeDefined()
    const parsed = JSON.parse(raw!)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].id).toBe('persisted-1')
  })

  it('handles API error gracefully — keeps existing cache', async () => {
    // Pre-populate cache
    const cached = [{ id: 'safe-1', purchasedAt: '2026-01-01T00:00:00Z' }]
    storage.set('earnlumens_purchases', JSON.stringify(cached))

    getPurchasesMock.mockRejectedValueOnce(new Error('Network error'))

    const store = usePurchasesStore()
    await store.loadPurchaseIds()

    // Cached data should survive the API failure
    expect(store.isUnlocked('safe-1')).toBe(true)
    expect(store.totalPurchases).toBe(1)
  })
})

describe('purchasesStore.isUnlocked auth gating', () => {
  it('ignores cached unlocks once auth resolves as guest', () => {
    const auth = useAuthStore()
    const store = usePurchasesStore()
    store.markUnlocked('stale-1')

    // While auth is still resolving the cache is trusted (optimistic)
    expect(store.isUnlocked('stale-1')).toBe(true)

    // Rehydration finished without a session → guest must see locked cards
    auth.setAuthReady(true)
    expect(store.isUnlocked('stale-1')).toBe(false)
  })

  it('trusts the cache for an authenticated user', () => {
    const auth = useAuthStore()
    auth.setAuthenticated(true)
    auth.setAuthReady(true)

    const store = usePurchasesStore()
    store.markUnlocked('mine-1')

    expect(store.isUnlocked('mine-1')).toBe(true)
    expect(store.isUnlocked('other-1')).toBe(false)
  })

  it('clearAll removes both the tenant-scoped and legacy storage keys', () => {
    storage.set('earnlumens_purchases', JSON.stringify([{ id: 'legacy-1', purchasedAt: '2026-01-01T00:00:00Z' }]))

    const store = usePurchasesStore()
    store.markUnlocked('e1')
    store.clearAll()

    expect(store.totalPurchases).toBe(0)
    for (const key of storage.keys()) {
      expect(key.startsWith('earnlumens_purchases')).toBe(false)
    }
  })
})
