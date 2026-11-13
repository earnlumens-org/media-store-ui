import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useTenantStore } from '@/stores/tenant'

vi.mock('@/config/env', () => ({
  getCdnBaseUrl: () => 'https://shop.example.com/cdn',
  apiUrl: (path: string) => `https://api.example.com${path}`,
}))

describe('tenant store — PWA naming and icons', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('displayName prefers the server appName even in logo-only mode', () => {
    const store = useTenantStore()
    store.$patch({ kind: 'tenant', subdomain: '750', appName: 'udemo', brandText: '', brandTextHidden: true })
    expect(store.displayName).toBe('udemo')
  })

  it('displayName falls back to subdomain for tenants and to the platform brand otherwise', () => {
    const store = useTenantStore()
    store.$patch({ kind: 'tenant', subdomain: '750', appName: null, brandText: '', browserTitle: null })
    expect(store.displayName).toBe('750')
    store.$patch({ kind: 'platform', subdomain: null })
    expect(store.displayName).toBe('EarnLumens')
  })

  it('displayName derives the brand from a custom domain before the slug', () => {
    // Node test environment: provide a minimal window.location stand-in.
    vi.stubGlobal('window', { location: { hostname: 'www.udemo.app' } })
    try {
      const store = useTenantStore()
      store.$patch({ kind: 'tenant', subdomain: '750', appName: null, brandText: '', browserTitle: null })
      expect(store.displayName).toBe('udemo')
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('appleTouchIconUrl mirrors the manifest policy', () => {
    const store = useTenantStore()
    store.$patch({ kind: 'platform' })
    expect(store.appleTouchIconUrl).toBe('/pwa/apple-touch-icon.png')
    store.$patch({ kind: 'tenant', subdomain: 'alice', pwaIconR2Key: null })
    expect(store.appleTouchIconUrl).toBe('/pwa/apple-touch-icon-tenant.png')
    store.$patch({ pwaIconR2Key: 'public/tenants/alice/appicon/x.png' })
    expect(store.appleTouchIconUrl).toBe('https://shop.example.com/cdn/public/tenants/alice/appicon/x.png')
  })
})

describe('tenant store — suspended store (H1 read-only mode)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('isSuspended only for a ready tenant flagged by the server', () => {
    const store = useTenantStore()
    expect(store.isSuspended).toBe(false)
    store.$patch({ status: 'ready', kind: 'tenant', subdomain: '750', suspended: true })
    expect(store.isSuspended).toBe(true)
    store.$patch({ kind: 'platform', suspended: true })
    expect(store.isSuspended).toBe(false)
    store.$patch({ kind: 'tenant', suspended: false })
    expect(store.isSuspended).toBe(false)
  })

  it('load() maps the visitor flag and forces uploads off while suspended', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({
      kind: 'tenant', subdomain: '750', suspended: true, uploadsEnabled: true,
    })))
    try {
      const store = useTenantStore()
      await store.load()
      expect(store.status).toBe('ready')
      expect(store.kind).toBe('tenant')
      expect(store.suspended).toBe(true)
      expect(store.isSuspended).toBe(true)
      expect(store.uploadsEnabled).toBe(false)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('load() leaves an active tenant unsuspended with uploads on', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({
      kind: 'tenant', subdomain: '750',
    })))
    try {
      const store = useTenantStore()
      await store.load()
      expect(store.suspended).toBe(false)
      expect(store.isSuspended).toBe(false)
      expect(store.uploadsEnabled).toBe(true)
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
