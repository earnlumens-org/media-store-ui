import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * These tests pin down the foundation of tenant session isolation:
 *
 *   - Every *.earnlumens.org tenant (and the apex) must resolve the API base
 *     URL to its OWN origin, never to a sibling tenant or to a hard-coded
 *     api.earnlumens.org. That keeps the refresh cookie host-only and means
 *     a leak in one tenant cannot reach another.
 *   - localhost and app-dev.earnlumens.org keep their explicit cross-origin
 *     URLs so local dev and the dev tunnel do not regress.
 *
 * If anyone ever changes env.ts to fall back to a global API host for prod
 * tenants, this suite must fail loudly — the security model relies on it.
 */

interface MutableLocation {
  hostname: string
  origin: string
  protocol?: string
  host?: string
}

function stubLocation (hostname: string, origin: string): void {
  const loc: MutableLocation = {
    hostname,
    origin,
    protocol: origin.startsWith('https:') ? 'https:' : 'http:',
    host: origin.replace(/^https?:\/\//, ''),
  }
  // env.ts reads from globalThis.location AND falls back to self.location for
  // Web Workers — stub both so we cover both code paths.
  vi.stubGlobal('location', loc)
  vi.stubGlobal('self', { location: loc })
}

async function loadEnv () {
  // env.ts memoises the resolved URL the first time getApiBaseUrl() is
  // called. resetModules() forces a fresh evaluation against the current
  // stubbed location.
  vi.resetModules()
  return await import('@/config/env')
}

beforeEach(() => {
  // Make sure no leftover VITE_API_BASE_URL override from another test or the
  // shell environment can mask runtime detection.
  vi.stubEnv('VITE_API_BASE_URL', '')
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('getApiBaseUrl — tenant session isolation', () => {
  it('apex earnlumens.org resolves to its own origin (same-origin)', async () => {
    stubLocation('earnlumens.org', 'https://earnlumens.org')
    const { getApiBaseUrl } = await loadEnv()
    expect(getApiBaseUrl()).toBe('https://earnlumens.org')
  })

  it('tenant subdomain acme.earnlumens.org resolves to its own origin', async () => {
    stubLocation('acme.earnlumens.org', 'https://acme.earnlumens.org')
    const { getApiBaseUrl } = await loadEnv()
    expect(getApiBaseUrl()).toBe('https://acme.earnlumens.org')
  })

  it('numeric tenant subdomain 750.earnlumens.org resolves to its own origin', async () => {
    stubLocation('750.earnlumens.org', 'https://750.earnlumens.org')
    const { getApiBaseUrl } = await loadEnv()
    expect(getApiBaseUrl()).toBe('https://750.earnlumens.org')
  })

  it('one tenant never resolves to a sibling tenant or to api.earnlumens.org', async () => {
    stubLocation('acme.earnlumens.org', 'https://acme.earnlumens.org')
    const { getApiBaseUrl } = await loadEnv()
    const url = getApiBaseUrl()
    expect(url).not.toContain('750.earnlumens.org')
    expect(url).not.toContain('api.earnlumens.org')
    expect(url).not.toContain('widget.earnlumens.org')
  })

  it('localhost keeps the explicit Spring backend URL (cross-origin dev)', async () => {
    stubLocation('localhost', 'http://localhost:3000')
    const { getApiBaseUrl } = await loadEnv()
    expect(getApiBaseUrl()).toBe('http://localhost:8080')
  })

  it('127.0.0.1 keeps the explicit Spring backend URL', async () => {
    stubLocation('127.0.0.1', 'http://127.0.0.1:3000')
    const { getApiBaseUrl } = await loadEnv()
    expect(getApiBaseUrl()).toBe('http://localhost:8080')
  })

  it('app-dev.earnlumens.org tunnel keeps its explicit cross-origin API host', async () => {
    stubLocation('app-dev.earnlumens.org', 'https://app-dev.earnlumens.org')
    const { getApiBaseUrl } = await loadEnv()
    expect(getApiBaseUrl()).toBe('https://api-dev.earnlumens.org')
  })

  it('VITE_API_BASE_URL override wins over runtime detection (rollback escape hatch)', async () => {
    stubLocation('acme.earnlumens.org', 'https://acme.earnlumens.org')
    vi.stubEnv('VITE_API_BASE_URL', 'https://emergency-api.example.com')
    const { getApiBaseUrl } = await loadEnv()
    expect(getApiBaseUrl()).toBe('https://emergency-api.example.com')
  })

  it('VITE_API_BASE_URL override strips a trailing slash', async () => {
    stubLocation('acme.earnlumens.org', 'https://acme.earnlumens.org')
    vi.stubEnv('VITE_API_BASE_URL', 'https://emergency-api.example.com/')
    const { getApiBaseUrl } = await loadEnv()
    expect(getApiBaseUrl()).toBe('https://emergency-api.example.com')
  })
})

describe('apiUrl — same-origin path composition for tenants', () => {
  it('builds a same-origin URL for a tenant subdomain', async () => {
    stubLocation('acme.earnlumens.org', 'https://acme.earnlumens.org')
    const { apiUrl } = await loadEnv()
    expect(apiUrl('/api/whoami')).toBe('https://acme.earnlumens.org/api/whoami')
  })

  it('prefixes a missing leading slash', async () => {
    stubLocation('acme.earnlumens.org', 'https://acme.earnlumens.org')
    const { apiUrl } = await loadEnv()
    expect(apiUrl('api/whoami')).toBe('https://acme.earnlumens.org/api/whoami')
  })
})
