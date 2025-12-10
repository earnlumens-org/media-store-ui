// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'

// Styles
import 'unfonts.css'

// i18n
import { createI18n } from 'vue-i18n'

const app = createApp(App)

const i18n = createI18n({
    legacy: false,
    locale: 'en',
    messages: {}
})

export const determineLanguageCode = (language: string): string => {
    const normalized = language.toLowerCase().substring(0, 5)

    if (normalized.startsWith('zh')) {
        return (
            normalized === 'zh-tw' ||
            normalized === 'zh-hk' ||
            normalized === 'zh-ha' ||
            normalized === 'zh-mo'
        )
            ? 'zh-tw'
            : 'zh-cn'
    }

    return normalized.substring(0, 2)
}

export const loadLanguage = async (language: string) => {
    try {
        const messages = await import(`./locales/${language}.json`)
        i18n.global.setLocaleMessage(language, messages.default || messages)
        i18n.global.locale.value = language
    } catch (e) {
        console.error('Error loading language, defaulting to en:', e)
        const messages = await import('./locales/en.json')
        i18n.global.setLocaleMessage('en', messages.default || messages)
        i18n.global.locale.value = 'en'
    }
}

const initI18n = async () => {
    const stored = localStorage.getItem('selectedLanguage')
    const browser = navigator.language || 'en'
    const selected = stored || browser
    const langCode = determineLanguageCode(selected)

    await loadLanguage(langCode)

    app.use(i18n)
    registerPlugins(app)
    app.mount('#app')
}

initI18n()
