/**
 * Token Worker - Manages access token lifecycle in isolated memory
 * Never exposes token to main thread except via controlled messages
 */

import { apiUrl } from '../config/env'

interface WorkerState {
  accessToken: string | null
  expiresAt: number | null
  isRefreshing: boolean
}

const state: WorkerState = {
  accessToken: null,
  expiresAt: null,
  isRefreshing: false,
}

// Message types
interface SetTokenMessage { type: 'SET_TOKEN', payload: { accessToken: string } }
interface GetTokenMessage { type: 'GET_TOKEN' }
interface ClearTokenMessage { type: 'CLEAR_TOKEN' }
interface RefreshTokenMessage { type: 'REFRESH_TOKEN' }

type IncomingMessage = SetTokenMessage | GetTokenMessage | ClearTokenMessage | RefreshTokenMessage

interface TokenResultPayload { accessToken: string | null, valid: boolean }
interface RefreshResultPayload { success: boolean, accessToken?: string }

type OutgoingMessage = { type: 'TOKEN_RESULT', payload: TokenResultPayload }
  | { type: 'TOKEN_SET', payload: { success: boolean } }
  | { type: 'TOKEN_CLEARED' }
  | { type: 'REFRESH_RESULT', payload: RefreshResultPayload }
  | { type: 'SESSION_EXPIRED' }
  | { type: 'ERROR', payload: { message: string } }

function parseJwtExp (token: string): number | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2 || !parts[1]) {
      return null
    }
    const decoded = JSON.parse(atob(parts[1]))
    return decoded.exp ? decoded.exp * 1000 : null
  } catch {
    return null
  }
}

function isTokenExpired (): boolean {
  if (!state.expiresAt) {
    return true
  }
  // Consider expired if less than 30 seconds remaining
  return Date.now() >= state.expiresAt - 30_000
}

function sendMessage (msg: OutgoingMessage) {
  self.postMessage(msg)
}

async function handleRefresh (): Promise<void> {
  if (state.isRefreshing) {
    // Already refreshing, wait and return current state
    return
  }

  state.isRefreshing = true

  try {
    const response = await fetch(apiUrl('/api/auth/refresh'), {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      state.accessToken = null
      state.expiresAt = null
      sendMessage({ type: 'SESSION_EXPIRED' })
      sendMessage({ type: 'REFRESH_RESULT', payload: { success: false } })
      return
    }

    const data = await response.json()
    const newToken = data.accessToken

    if (newToken) {
      state.accessToken = newToken
      state.expiresAt = parseJwtExp(newToken)
      sendMessage({ type: 'REFRESH_RESULT', payload: { success: true, accessToken: newToken } })
    } else {
      sendMessage({ type: 'REFRESH_RESULT', payload: { success: false } })
    }
  } catch {
    sendMessage({ type: 'ERROR', payload: { message: 'Refresh failed' } })
    sendMessage({ type: 'REFRESH_RESULT', payload: { success: false } })
  } finally {
    state.isRefreshing = false
  }
}

self.addEventListener('message', (event: MessageEvent<IncomingMessage>) => {
  const { type } = event.data

  void (async () => {
    switch (type) {
      case 'SET_TOKEN': {
        const { accessToken } = (event.data as SetTokenMessage).payload
        state.accessToken = accessToken
        state.expiresAt = parseJwtExp(accessToken)
        sendMessage({ type: 'TOKEN_SET', payload: { success: true } })
        break
      }

      case 'GET_TOKEN': {
        if (!state.accessToken || isTokenExpired()) {
          // Need to refresh
          await handleRefresh()
          sendMessage({
            type: 'TOKEN_RESULT',
            payload: {
              accessToken: state.accessToken,
              valid: !!state.accessToken && !isTokenExpired(),
            },
          })
        } else {
          sendMessage({
            type: 'TOKEN_RESULT',
            payload: { accessToken: state.accessToken, valid: true },
          })
        }
        break
      }

      case 'CLEAR_TOKEN': {
        state.accessToken = null
        state.expiresAt = null
        sendMessage({ type: 'TOKEN_CLEARED' })
        break
      }

      case 'REFRESH_TOKEN': {
        await handleRefresh()
        break
      }

      default: {
        sendMessage({ type: 'ERROR', payload: { message: 'Unknown message type' } })
      }
    }
  })()
})

// Signal worker is ready
self.postMessage({ type: 'WORKER_READY' })
