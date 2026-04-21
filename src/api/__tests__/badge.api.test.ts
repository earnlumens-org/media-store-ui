import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/api/apiRequest'
import { claimBadge, getMyBadges } from '@/api/modules/badge.api'

// Stub token worker so apiRequest doesn't try to talk to IndexedDB
vi.mock('@/services/tokenWorkerClient', () => ({
  getToken: vi.fn().mockResolvedValue({ accessToken: 'test-token', valid: true }),
}))

vi.mock('@/services/globalNotification', () => ({
  showGlobalNotification: vi.fn(),
}))

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

function jsonResponse (status: number, body: unknown): Response {
  return Response.json(body, { status })
}

describe('badge.api.claimBadge', () => {
  it('POSTs to /api/user/badges/claim with bearer token and returns assignment', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(201, {
      id: 'b-1',
      badgeType: 'u1',
      status: 'active',
      assignedBy: 'promotion',
      startedAt: '2026-04-21T10:00:00',
      expiresAt: '2027-04-21T10:00:00',
    }))

    const result = await claimBadge()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.test/api/user/badges/claim')
    expect(init.method).toBe('POST')
    expect(init.credentials).toBe('include')
    expect(init.headers.Authorization).toBe('Bearer test-token')
    expect(result.badgeType).toBe('u1')
    expect(result.id).toBe('b-1')
  })

  it('throws ApiError with status 409 when the user has already claimed', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(409, { error: 'Badge already claimed' }))

    await expect(claimBadge()).rejects.toMatchObject({
      name: 'ApiError',
      status: 409,
    })
  })

  it('throws ApiError with status 401 when the session is missing', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(401, { error: 'Unauthorized' }))

    await expect(claimBadge()).rejects.toBeInstanceOf(ApiError)
  })
})

describe('badge.api.getMyBadges', () => {
  it('GETs /api/user/badges/me and returns the parsed body', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, {
      activeBadge: 'u1',
      assignments: [
        {
          id: 'b-1',
          badgeType: 'u1',
          status: 'active',
          assignedBy: 'promotion',
          startedAt: '2026-04-21T10:00:00',
          expiresAt: '2027-04-21T10:00:00',
        },
      ],
    }))

    const result = await getMyBadges()

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.test/api/user/badges/me')
    expect(result.activeBadge).toBe('u1')
    expect(result.assignments).toHaveLength(1)
  })

  it('returns activeBadge=null for users without any badge', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, {
      activeBadge: null,
      assignments: [],
    }))

    const result = await getMyBadges()
    expect(result.activeBadge).toBeNull()
    expect(result.assignments).toEqual([])
  })
})
