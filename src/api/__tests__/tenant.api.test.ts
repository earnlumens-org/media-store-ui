import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchVisitorContext } from '@/api/modules/tenant.api'

vi.mock('@/config/env', () => ({
  apiUrl: (path: string) => `https://api.test${path}`,
}))

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('tenant.api.fetchVisitorContext — PWA fields', () => {
  it('parses installOffered=false and omits pwaIconR2Key (subdomain shape)', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({
      kind: 'tenant', subdomain: 'alice', brandText: 'Alice', installOffered: false,
    }))
    const ctx = await fetchVisitorContext()
    expect(ctx.kind).toBe('tenant')
    expect(ctx.installOffered).toBe(false)
    expect(ctx.pwaIconR2Key).toBeNull()
  })

  it('parses installOffered=true + pwaIconR2Key (custom-domain shape)', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({
      kind: 'tenant', subdomain: 'alice', installOffered: true,
      pwaIconR2Key: 'public/tenants/alice/appicon/abc.png',
    }))
    const ctx = await fetchVisitorContext()
    expect(ctx.installOffered).toBe(true)
    expect(ctx.pwaIconR2Key).toBe('public/tenants/alice/appicon/abc.png')
  })

  it('defaults installOffered to true when the backend omits it', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ kind: 'platform' }))
    const ctx = await fetchVisitorContext()
    expect(ctx.kind).toBe('platform')
    expect(ctx.installOffered).toBe(true)
  })
})
