/**
 * Auth API module - handles session creation and refresh
 */

import { apiUrl } from '@/config/env'

export interface CreateSessionResponse {
  accessToken: string
}

export interface RefreshResponse {
  accessToken: string
}

export interface AuthError {
  error: string
}

/**
 * Create a new session by exchanging the temp UUID for tokens
 * Refresh token is set as HttpOnly cookie by backend
 */
export async function createSession(uuid: string): Promise<CreateSessionResponse> {
  const response = await fetch(apiUrl('/api/auth/session'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      UUID: uuid,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || `HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * Refresh the access token using the HttpOnly refresh cookie
 */
export async function refreshAccessToken(): Promise<RefreshResponse> {
  const response = await fetch(apiUrl('/api/auth/refresh'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unauthorized' }))
    throw new Error(errorData.error || `HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * Logout - clears the refresh cookie on the backend
 */
export async function logout(): Promise<void> {
  const response = await fetch(apiUrl('/api/auth/logout'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    console.warn('Logout request failed, but clearing local state anyway')
  }
}
