import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'

export interface ApiHttpError {
  message: string
  status?: number
  code?: string
  url?: string
  method?: string
  data?: unknown
}

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
    (error: unknown) => {
      const normalized = toApiHttpError(error)

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
