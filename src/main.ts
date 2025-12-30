// Composables
import { createApp } from 'vue'

// i18n
import { createI18n } from 'vue-i18n'

// Plugins
import { registerPlugins } from '@/plugins'

// Auth
import { initTokenWorker, refreshToken, onSessionExpired } from '@/services/tokenWorkerClient'

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
 */
async function rehydrateSession (): Promise<void> {
  try {
    await initTokenWorker()

    const result = await refreshToken()
    if (result.success) {
      // Session restored - app store will be updated via pinia
      console.log('[Auth] Session rehydrated successfully')
    }
  } catch (error) {
    // No valid session - user will need to login
    console.log('[Auth] No existing session to rehydrate')
  }
}

// Register session expired handler
onSessionExpired(() => {
  console.log('[Auth] Session expired, redirecting to login')
  // Will be handled by auth store in later phase
})

// Initialize app
async function initApp () {
  await initI18n()
  // Rehydrate session after app is mounted (non-blocking)
  void rehydrateSession()
}

initApp()
