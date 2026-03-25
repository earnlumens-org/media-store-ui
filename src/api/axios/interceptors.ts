import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'

import { showGlobalNotification } from '@/services/globalNotification'

export interface ApiHttpError {
  message: string
  status?: number
  code?: string
  url?: string
  method?: string
  data?: unknown
}

/* ── Retry configuration ─────────────────────────────────── */

const MAX_RETRIES = 3
const BASE_DELAY_MS = 1_000 // 1 s → 2 s → 4 s
const RETRYABLE_STATUS_CODES = new Set([408, 502, 503, 504])
const RETRYABLE_ERROR_CODES = new Set(['ECONNABORTED', 'ERR_NETWORK', 'ETIMEDOUT'])

const RETRY_COUNT_HEADER = 'x-retry-count'

function isRetryable (error: AxiosError): boolean {
  // Only retry safe (idempotent) methods
  const method = error.config?.method?.toUpperCase()
  if (method && method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    return false
  }

  // Network / timeout errors (no response from server)
  if (!error.response && error.code && RETRYABLE_ERROR_CODES.has(error.code)) {
    return true
  }

  // Specific server-side status codes typical of cold starts
  if (error.response && RETRYABLE_STATUS_CODES.has(error.response.status)) {
    return true
  }

  return false
}

function delay (ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/* ── Helpers ──────────────────────────────────────────────── */

function isAxiosError (error: unknown): error is AxiosError {
  return typeof error === 'object' && error !== null && 'isAxiosError' in error
}

function toApiHttpError (error: unknown): ApiHttpError {
  if (!isAxiosError(error)) {
    return { message: 'Unknown error' }
  }

  const config = error.config
  const method = typeof config?.method === 'string' ? config.method.toUpperCase() : undefined

  return {
    message: error.message || 'Request failed',
    status: error.response?.status,
    code: error.code,
    url: config?.url,
    method,
    data: error.response?.data,
  }
}

export function installAxiosInterceptors (client: AxiosInstance): void {
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      return config
    },
    (error: AxiosError) => {
      return Promise.reject(toApiHttpError(error))
    },
  )

  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: unknown) => {
      // ── Retry logic for GET requests on recoverable errors ──
      if (isAxiosError(error) && error.config && isRetryable(error)) {
        const config = error.config as InternalAxiosRequestConfig & { headers: Record<string, string> }
        const retryCount = Number(config.headers[RETRY_COUNT_HEADER] || '0')

        if (retryCount < MAX_RETRIES) {
          const nextRetry = retryCount + 1
          const waitMs = BASE_DELAY_MS * 2 ** retryCount // 1s, 2s, 4s

          if (import.meta.env.DEV) {
            console.info(`[api] Retry ${nextRetry}/${MAX_RETRIES} in ${waitMs}ms — ${config.method?.toUpperCase()} ${config.url}`)
          }

          config.headers[RETRY_COUNT_HEADER] = String(nextRetry)
          await delay(waitMs)
          return client.request(config)
        }
      }

      // ── Normal error handling (after retries exhausted or non-retryable) ──
      const normalized = toApiHttpError(error)

      if (normalized.status === 429) {
        showGlobalNotification('Common.tooManyRequests')
      }

      // Cross-cutting concern only: keep business logic out.
      if (import.meta.env.DEV) {
        console.warn('[api] HTTP error', normalized)
      }

      return Promise.reject(normalized)
    },
  )
}

export function withAbortSignal (config: AxiosRequestConfig, signal?: AbortSignal): AxiosRequestConfig {
  if (!signal) {
    return config
  }
  return { ...config, signal }
}
