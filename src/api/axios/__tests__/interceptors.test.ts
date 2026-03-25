import axios, { type AxiosAdapter, type AxiosResponse } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { type ApiHttpError, installAxiosInterceptors } from '../interceptors'

// Stub the globalNotification import used by the interceptor
vi.mock('@/services/globalNotification', () => ({
  showGlobalNotification: vi.fn(),
}))

// Use fake timers so we don't actually wait 1s/2s/4s during tests
beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

// ─── Helper: build a fake AxiosError thrown by axios adapters ─────
function makeAxiosError (
  config: Record<string, any>,
  opts: { status?: number, code?: string, data?: unknown },
) {
  const err: any = new Error('Request failed')
  err.isAxiosError = true
  err.config = config
  err.code = opts.code
  err.response = opts.status
    ? { status: opts.status, data: opts.data ?? {}, headers: {}, config }
    : undefined
  return err
}

/**
 * Creates an axios instance with interceptors and a programmable mock adapter.
 * `adapterFn` receives each request config and must return a response or throw.
 */
function createTestClient (adapterFn: AxiosAdapter) {
  const client = axios.create({
    timeout: 500,
    adapter: adapterFn,
  })
  installAxiosInterceptors(client)
  return client
}

describe('Axios retry interceptor', () => {
  it('retries a GET request on 503 and succeeds on second attempt', async () => {
    let callCount = 0
    const adapter: AxiosAdapter = config => {
      callCount++
      if (callCount === 1) {
        return Promise.reject(makeAxiosError(config, { status: 503 }))
      }
      return Promise.resolve({ data: { items: [] }, status: 200, statusText: 'OK', headers: {}, config } as AxiosResponse)
    }

    const client = createTestClient(adapter)
    const promise = client.get('/public/entries')

    // Flush the 1s retry delay
    await vi.advanceTimersByTimeAsync(1000)

    const result = await promise
    expect(result.data).toEqual({ items: [] })
    expect(callCount).toBe(2)
  })

  it('retries up to 3 times then rejects with ApiHttpError', async () => {
    let callCount = 0
    const adapter: AxiosAdapter = config => {
      callCount++
      return Promise.reject(makeAxiosError(config, { status: 503 }))
    }

    const client = createTestClient(adapter)

    // Catch the rejection immediately to avoid unhandled rejection warnings
    let caughtError: ApiHttpError | undefined
    const promise = client.get('/public/entries').catch((error: ApiHttpError) => {
      caughtError = error
    })

    // Flush through all retry delays: 1s + 2s + 4s
    await vi.advanceTimersByTimeAsync(1000)
    await vi.advanceTimersByTimeAsync(2000)
    await vi.advanceTimersByTimeAsync(4000)

    await promise

    expect(caughtError).toMatchObject({
      message: 'Request failed',
      status: 503,
    } satisfies Partial<ApiHttpError>)

    // Original call + 3 retries = 4 total
    expect(callCount).toBe(4)
  })

  it('does NOT retry POST requests', async () => {
    let callCount = 0
    const adapter: AxiosAdapter = config => {
      callCount++
      return Promise.reject(makeAxiosError(config, { status: 503 }))
    }

    const client = createTestClient(adapter)
    const promise = client.post('/entries', {})

    await expect(promise).rejects.toMatchObject({
      status: 503,
    } satisfies Partial<ApiHttpError>)

    // Only the original call, no retries
    expect(callCount).toBe(1)
  })

  it('retries on network errors (ERR_NETWORK)', async () => {
    let callCount = 0
    const adapter: AxiosAdapter = config => {
      callCount++
      if (callCount === 1) {
        return Promise.reject(makeAxiosError(config, { code: 'ERR_NETWORK' }))
      }
      return Promise.resolve({ data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config } as AxiosResponse)
    }

    const client = createTestClient(adapter)
    const promise = client.get('/public/entries')

    await vi.advanceTimersByTimeAsync(1000)

    const result = await promise
    expect(result.data).toEqual({ ok: true })
    expect(callCount).toBe(2)
  })

  it('does NOT retry on 404 (not a recoverable error)', async () => {
    let callCount = 0
    const adapter: AxiosAdapter = config => {
      callCount++
      return Promise.reject(makeAxiosError(config, { status: 404 }))
    }

    const client = createTestClient(adapter)
    const promise = client.get('/not-found')

    await expect(promise).rejects.toMatchObject({
      status: 404,
    } satisfies Partial<ApiHttpError>)

    expect(callCount).toBe(1)
  })

  it('uses exponential backoff delays (1s, 2s, 4s)', async () => {
    let callCount = 0
    const adapter: AxiosAdapter = config => {
      callCount++
      if (callCount <= 3) {
        return Promise.reject(makeAxiosError(config, { status: 503 }))
      }
      return Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config } as AxiosResponse)
    }

    const client = createTestClient(adapter)
    const promise = client.get('/public/entries')

    // After 999ms — still waiting for first retry
    await vi.advanceTimersByTimeAsync(999)
    expect(callCount).toBe(1)

    // At 1000ms — first retry fires
    await vi.advanceTimersByTimeAsync(1)
    expect(callCount).toBe(2)

    // After 1999ms more — still waiting for second retry
    await vi.advanceTimersByTimeAsync(1999)
    expect(callCount).toBe(2)

    // At 2000ms — second retry fires
    await vi.advanceTimersByTimeAsync(1)
    expect(callCount).toBe(3)

    // After 3999ms more — still waiting for third retry
    await vi.advanceTimersByTimeAsync(3999)
    expect(callCount).toBe(3)

    // At 4000ms — third retry fires and succeeds
    await vi.advanceTimersByTimeAsync(1)
    expect(callCount).toBe(4)

    const result = await promise
    expect(result.status).toBe(200)
  })
})
