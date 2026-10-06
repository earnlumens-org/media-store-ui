import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useTenantStore } from '@/stores/tenant'

vi.mock('@/config/env', () => ({
  getCdnBaseUrl: () => 'https://shop.example.com/cdn',
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
