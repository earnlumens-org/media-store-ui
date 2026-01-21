// Composables
import { createApp } from 'vue'

// i18n
import { createI18n } from 'vue-i18n'

// API
import { parseUserFromToken } from '@/api/modules/user.api'

// Plugins
import { registerPlugins } from '@/plugins'

// Router
import router from '@/router'

// Auth
import { broadcastAuthEvent, initAuthBroadcast, onAuthBroadcast } from '@/services/authBroadcast'
import { clearToken, initTokenWorker, onSessionExpired, refreshToken } from '@/services/tokenWorkerClient'

// Stores
import pinia from '@/stores'
import { useAuthStore } from '@/stores/auth'
import { useWalletStore } from '@/stores/wallet'

// Components
import App from './App.vue'

// Styles
import 'unfonts.css'

const app = createApp(App)

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {},
})

export function determineLanguageCode (language: string): string {
  const normalized = language.toLowerCase().slice(0, 5)

  if (normalized.startsWith('zh')) {
    return (
      normalized === 'zh-tw'
      || normalized === 'zh-hk'
      || normalized === 'zh-ha'
      || normalized === 'zh-mo'
    )
      ? 'zh-tw'
      : 'zh-cn'
  }

  return normalized.slice(0, 2)
}

export async function loadLanguage (language: string) {
  try {
    const messages = await import(`./locales/${language}.json`)
    i18n.global.setLocaleMessage(language, messages.default || messages)
    i18n.global.locale.value = language
  } catch (error) {
    console.error('Error loading language, defaulting to en:', error)
    const messages = await import('./locales/en.json')
    i18n.global.setLocaleMessage('en', messages.default || messages)
    i18n.global.locale.value = 'en'
  }
}

async function initI18n () {
  const stored = localStorage.getItem('selectedLanguage')
  const browser = navigator.language || 'en'
  const selected = stored || browser
  const langCode = determineLanguageCode(selected)

  await loadLanguage(langCode)

  app.use(i18n)
  registerPlugins(app)
  app.mount('#app')
}

/**
 * Rehydrate session on page load
 * Attempts to refresh access token using HttpOnly cookie
 * MUST complete before router navigation to protected routes
 */
async function rehydrateSession (): Promise<void> {
  const authStore = useAuthStore(pinia)

  try {
    await initTokenWorker()

    const result = await refreshToken()
    if (result.success && result.accessToken) {
      console.log('[Auth] Session rehydrated successfully')

      // Parse user profile from JWT claims
      const userProfile = parseUserFromToken(result.accessToken)
      if (userProfile) {
        authStore.setUser(userProfile)
      } else {
        authStore.setAuthenticated(true)
      }
    } else {
      authStore.setAuthenticated(false)
    }
  } catch {
    // No valid session - user will need to login
    console.log('[Auth] No existing session to rehydrate')
    authStore.setAuthenticated(false)
  } finally {
    // Mark auth as ready so router guards can proceed
    authStore.setAuthReady(true)
  }
}

// Register session expired handler
// Only broadcast if we HAD an active session (not during failed rehydrate)
onSessionExpired(async () => {
  const authStore = useAuthStore(pinia)
  const wasAuthenticated = authStore.isAuthenticated

  console.log('[Auth] Session expired, redirecting to login')
  authStore.clearAuth()

  // Disconnect wallet on session expiration
  const walletStore = useWalletStore(pinia)
  await walletStore.disconnectAll()

  // Only broadcast if we were actually logged in (avoid loop on rehydrate failure)
  if (wasAuthenticated) {
    broadcastAuthEvent('SESSION_EXPIRED')
  }
})

// Handle auth events from other tabs
// Flag to prevent duplicate processing during rapid events
let isProcessingBroadcast = false

onAuthBroadcast(async event => {
  // Prevent duplicate processing
  if (isProcessingBroadcast) {
    console.log(`[Auth] Already processing broadcast, ignoring duplicate ${event}`)
    return
  }

  const authStore = useAuthStore(pinia)

  // Only process if we have an active session (nothing to clear otherwise)
  if (!authStore.isAuthenticated) {
    console.log(`[Auth] 📡 Received ${event} but not authenticated, ignoring`)
    return
  }

  isProcessingBroadcast = true
  console.log(`[Auth] 📡 Received ${event} from another tab, clearing session`)

  try {
    // Clear local state (don't broadcast again to avoid loops)
    await clearToken()
    authStore.clearAuth()
    
    // Disconnect wallet on logout from other tab
    const walletStore = useWalletStore(pinia)
    await walletStore.disconnectAll()
    
    // Navigate without reload to avoid triggering rehydrate again
    router.push('/')
  } finally {
    // Reset flag after short delay
    setTimeout(() => {
      isProcessingBroadcast = false
    }, 100)
  }
})

// Initialize app
async function initApp () {
  // Initialize broadcast channel early
  initAuthBroadcast()

  await initI18n()

  // Rehydrate session BEFORE app is fully ready (blocks router guards)
  await rehydrateSession()

  // Initialize wallet store globally (loads wallets from localStorage)
  const walletStore = useWalletStore(pinia)
  await walletStore.initialize()
}

initApp()
