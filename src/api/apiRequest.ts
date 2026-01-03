/**
 * API Request wrapper - automatically injects Bearer token from worker
 * Use this for all protected API calls
 */

import { apiUrl } from '@/config/env'
import { getToken } from '@/services/tokenWorkerClient'

export interface ApiRequestOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>
  /** Skip authentication - useful for public endpoints */
  skipAuth?: boolean
}

export class ApiError extends Error {
  constructor (
    message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Make an authenticated API request
 * Automatically fetches and injects the Bearer token from the worker
 */
export async function apiRequest<T> (
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { skipAuth = false, headers: customHeaders, ...fetchOptions } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...customHeaders,
  }

  // Get token from worker unless explicitly skipped
  if (!skipAuth) {
    try {
      const result = await getToken()
      if (result?.accessToken) {
        headers['Authorization'] = `Bearer ${result.accessToken}`
      }
    } catch (error) {
      console.warn('[apiRequest] Failed to get token:', error)
      // Continue without token - server will return 401 if needed
    }
  }

  const response = await fetch(apiUrl(endpoint), {
    ...fetchOptions,
    headers,
    credentials: 'include',
  })

  // Handle non-JSON responses
  const contentType = response.headers.get('content-type')
  const isJson = contentType?.includes('application/json')

  if (!response.ok) {
    let errorData: unknown
    if (isJson) {
      errorData = await response.json().catch(() => ({}))
    }

    throw new ApiError(
      (errorData as { error?: string })?.error || `HTTP ${response.status}`,
      response.status,
      errorData,
    )
  }

  // Return empty object for 204 No Content
  if (response.status === 204) {
    return {} as T
  }

  if (isJson) {
    return response.json()
  }

  return {} as T
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: <T>(endpoint: string, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
}
