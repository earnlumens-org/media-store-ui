/**
 * Auth Broadcast Channel - Multi-tab synchronization
 * Syncs logout and session expiration events across browser tabs
 */

type AuthEvent = 'LOGOUT' | 'SESSION_EXPIRED'
type AuthEventCallback = (event: AuthEvent) => void

interface AuthBroadcastMessage {
  type: AuthEvent
  tabId: string
  timestamp: number
}

const CHANNEL_NAME = 'auth_events'

// Unique ID for this tab to avoid processing own messages (extra safety)
const TAB_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

let channel: BroadcastChannel | null = null
let listeners: AuthEventCallback[] = []

// Flag to prevent duplicate broadcasts during logout
let isBroadcasting = false

/**
 * Initialize the broadcast channel
 * Should be called once on app startup
 */
export function initAuthBroadcast (): void {
  if (channel) {
    return // Already initialized
  }

  // Check browser support
  if (typeof BroadcastChannel === 'undefined') {
    console.warn('[AuthBroadcast] BroadcastChannel not supported in this browser')
    return
  }

  channel = new BroadcastChannel(CHANNEL_NAME)

  channel.addEventListener('message', (event: MessageEvent<AuthBroadcastMessage>) => {
    // Validate message structure
    if (!event.data || typeof event.data.type !== 'string') {
      console.warn('[AuthBroadcast] Received malformed message, ignoring')
      return
    }

    const { type, tabId } = event.data

    // Extra safety: ignore messages from self (should not happen with BroadcastChannel)
    if (tabId === TAB_ID) {
      return
    }

    // Validate event type
    if (type !== 'LOGOUT' && type !== 'SESSION_EXPIRED') {
      console.warn(`[AuthBroadcast] Unknown event type: ${type}`)
      return
    }

    console.log(`[AuthBroadcast] 📡 Received event from another tab: ${type}`)

    // Notify all registered listeners
    for (const listener of listeners) {
      try {
        listener(type)
      } catch (error) {
        console.error('[AuthBroadcast] Listener error:', error)
      }
    }
  })

  console.log('[AuthBroadcast] ✅ Channel initialized')
}

/**
 * Broadcast an auth event to all other tabs
 * Returns false if broadcast was skipped (already broadcasting or channel not ready)
 */
export function broadcastAuthEvent (event: AuthEvent): boolean {
  if (!channel) {
    console.warn('[AuthBroadcast] Channel not initialized')
    return false
  }

  // Prevent duplicate broadcasts during rapid logout attempts
  if (isBroadcasting) {
    console.log('[AuthBroadcast] Already broadcasting, skipping duplicate')
    return false
  }

  isBroadcasting = true

  const message: AuthBroadcastMessage = {
    type: event,
    tabId: TAB_ID,
    timestamp: Date.now(),
  }

  try {
    channel.postMessage(message)
    console.log(`[AuthBroadcast] 📤 Broadcasted: ${event}`)
    return true
  } catch (error) {
    console.error('[AuthBroadcast] Failed to broadcast:', error)
    return false
  } finally {
    // Reset flag after a short delay to prevent rapid re-broadcasts
    setTimeout(() => {
      isBroadcasting = false
    }, 100)
  }
}

/**
 * Register a callback to handle auth events from other tabs
 */
export function onAuthBroadcast (callback: AuthEventCallback): void {
  listeners.push(callback)
}

/**
 * Remove a previously registered callback
 */
export function offAuthBroadcast (callback: AuthEventCallback): void {
  listeners = listeners.filter(cb => cb !== callback)
}

/**
 * Cleanup - close the channel
 */
export function closeAuthBroadcast (): void {
  if (channel) {
    channel.close()
    channel = null
    listeners = []
    console.log('[AuthBroadcast] Channel closed')
  }
}
