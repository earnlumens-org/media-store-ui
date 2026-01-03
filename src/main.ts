// Composables
import { createApp } from 'vue'

// i18n
import { createI18n } from 'vue-i18n'

// Plugins
import { registerPlugins } from '@/plugins'

// Auth
import { initTokenWorker, onSessionExpired, refreshToken } from '@/services/tokenWorkerClient'

// Stores
import pinia from '@/stores'
import { useAuthStore } from '@/stores/auth'

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
    if (result.success) {
      console.log('[Auth] Session rehydrated successfully')
      authStore.setAuthenticated(true)
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
onSessionExpired(() => {
  console.log('[Auth] Session expired, redirecting to login')
  const authStore = useAuthStore(pinia)
  authStore.clearAuth()
})

// Initialize app
async function initApp () {
  await initI18n()
  // Rehydrate session BEFORE app is fully ready (blocks router guards)
  await rehydrateSession()
}

initApp()
