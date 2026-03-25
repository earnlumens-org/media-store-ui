import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { usePurchasesStore } from '../purchases'

// ── Mock the API module ──────────────────────────────────────
const getPurchasesMock = vi.fn()

vi.mock('@/api/modules/purchase.api', () => ({
  getPurchases: (...args: unknown[]) => getPurchasesMock(...args),
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

function apiPage (
  items: ReturnType<typeof makePurchasedEntry>[],
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
    await store.loadPurchaseIds('alice')

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
    await store.loadPurchaseIds('bob')

    expect(store.totalPurchases).toBe(3)
    expect(getPurchasesMock).toHaveBeenCalledTimes(3)
    expect(getPurchasesMock).toHaveBeenCalledWith({ page: 0, size: 100 })
    expect(getPurchasesMock).toHaveBeenCalledWith({ page: 1, size: 100 })
    expect(getPurchasesMock).toHaveBeenCalledWith({ page: 2, size: 100 })
  })

  it('merges server data with existing localStorage cache', async () => {
    // Pre-populate localStorage for user "carol"
    const cached = [{ id: 'cached-1', purchasedAt: '2026-01-01T00:00:00Z' }]
    storage.set('earnlumens_purchases_carol', JSON.stringify(cached))

    // Server returns a new purchase
    getPurchasesMock.mockResolvedValueOnce(
      apiPage([makePurchasedEntry('server-1')], 0, 1),
    )

    const store = usePurchasesStore()
    await store.loadPurchaseIds('carol')

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
    storage.set('earnlumens_purchases_dave', JSON.stringify(cached))

    // Server returns the same ID
    getPurchasesMock.mockResolvedValueOnce(
      apiPage([makePurchasedEntry('e1', 'Server Title')], 0, 1),
    )

    const store = usePurchasesStore()
    await store.loadPurchaseIds('dave')

    // Should keep the cached version, not overwrite
    expect(store.getPurchase('e1')?.title).toBe('My Custom Title')
  })

  it('scopes storage per username — different users see different purchases', async () => {
    // Load purchases for user "alice"
    getPurchasesMock.mockResolvedValueOnce(
      apiPage([makePurchasedEntry('alice-entry')], 0, 1),
    )
    const store = usePurchasesStore()
    await store.loadPurchaseIds('alice')
    expect(store.isUnlocked('alice-entry')).toBe(true)

    // Verify alice's data is in her scoped storage
    const aliceData = storage.get('earnlumens_purchases_alice')
    expect(aliceData).toContain('alice-entry')

    // Logout clears in-memory state (and writes empty to current key)
    store.clearAll()
    expect(store.isUnlocked('alice-entry')).toBe(false)

    // Login as bob — different namespace
    getPurchasesMock.mockResolvedValueOnce(
      apiPage([makePurchasedEntry('bob-entry')], 0, 1),
    )
    await store.loadPurchaseIds('bob')

    // Bob should see his entry, not alice's
    expect(store.isUnlocked('bob-entry')).toBe(true)
    expect(store.isUnlocked('alice-entry')).toBe(false)

    // Bob's data is in his own scoped storage
    const bobData = storage.get('earnlumens_purchases_bob')
    expect(bobData).toContain('bob-entry')
  })

  it('persists to localStorage after server sync', async () => {
    getPurchasesMock.mockResolvedValueOnce(
      apiPage([makePurchasedEntry('persisted-1')], 0, 1),
    )

    const store = usePurchasesStore()
    await store.loadPurchaseIds('eve')

    const raw = storage.get('earnlumens_purchases_eve')
    expect(raw).toBeDefined()
    const parsed = JSON.parse(raw!)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].id).toBe('persisted-1')
  })

  it('handles API error gracefully — keeps existing cache', async () => {
    // Pre-populate cache
    const cached = [{ id: 'safe-1', purchasedAt: '2026-01-01T00:00:00Z' }]
    storage.set('earnlumens_purchases_frank', JSON.stringify(cached))

    getPurchasesMock.mockRejectedValueOnce(new Error('Network error'))

    const store = usePurchasesStore()
    await store.loadPurchaseIds('frank')

    // Cached data should survive the API failure
    expect(store.isUnlocked('safe-1')).toBe(true)
    expect(store.totalPurchases).toBe(1)
  })
})
