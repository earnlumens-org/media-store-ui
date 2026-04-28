// Composables
import { createApp } from 'vue'

// i18n
import { createI18n } from 'vue-i18n'

// API
import { parseUserFromToken } from '@/api/modules/user.api'

// Plugins
import { registerPlugins } from '@/plugins'

// Auth
import { broadcastAuthEvent, initAuthBroadcast, onAuthBroadcast } from '@/services/authBroadcast'
import { clearToken, initTokenWorker, onSessionExpired, refreshToken } from '@/services/tokenWorkerClient'

// Stores
import pinia from '@/stores'
import { useAuthStore } from '@/stores/auth'
import { useFavoritesStore } from '@/stores/favorites'
import { PURCHASES_STORAGE_KEY, usePurchasesStore } from '@/stores/purchases'
import { useSubscriptionsStore } from '@/stores/subscriptions'
import { useWalletStore } from '@/stores/wallet'

// Components
import App from './App.vue'

// Styles
import '@/styles/global.css'

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

      // Pre-load favorite IDs so isFavorite() is instant across the app
      const favoritesStore = useFavoritesStore(pinia)
      favoritesStore.loadFavoriteIds().catch(() => {})

      // Pre-load subscription IDs so isSubscribed() is instant across the app
      const subscriptionsStore = useSubscriptionsStore(pinia)
      subscriptionsStore.loadSubscriptionIds().catch(() => {})

      // Pre-load purchase IDs so isUnlocked() is instant across the app
      const purchasesStore = usePurchasesStore(pinia)
      purchasesStore.loadPurchaseIds().catch(() => {})
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
  if (!authStore.isAuthenticated) {
    return
  }

  await clearToken()
  localStorage.removeItem(PURCHASES_STORAGE_KEY)
  broadcastAuthEvent('SESSION_EXPIRED')
  window.location.assign('/')
})

// Handle auth events from other tabs
onAuthBroadcast(async () => {
  const authStore = useAuthStore(pinia)

  if (!authStore.isAuthenticated) {
    return
  }

  await clearToken()
  localStorage.removeItem(PURCHASES_STORAGE_KEY)
  window.location.assign('/')
})

// Initialize app
// Prevent browser's native scroll restoration (we handle it manually)
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual'
}

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
