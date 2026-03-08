import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * Composable that lazy-loads legal content (Terms & Conditions, Privacy Policy)
 * from separate locale files so they don't bloat the main UI locale bundles.
 *
 * Legal files live in  src/locales/legal/{lang}.json
 * and are merged into the i18n instance under the "Legal" namespace.
 *
 * Usage:
 *   const { loading, error } = useLegalContent()
 *   // then use $t('Legal.termsTitle'), $t('Legal.terms.intro'), etc.
 */
export function useLegalContent () {
  const { locale, mergeLocaleMessage } = useI18n()
  const loading = ref(true)
  const error = ref<string | null>(null)

  /** Set of locales that have already been loaded */
  const loaded = new Set<string>()

  async function load (lang: string) {
    if (loaded.has(lang)) {
      loading.value = false
      return
    }

    loading.value = true
    error.value = null

    try {
      // Vite dynamic import – each legal JSON becomes its own chunk
      const messages = await import(`@/locales/legal/${lang}.json`)
      mergeLocaleMessage(lang, messages.default || messages)
      loaded.add(lang)
    } catch {
      // Fallback to English if the requested locale has no legal file
      if (lang === 'en') {
        error.value = 'Failed to load legal content'
      } else {
        try {
          const fallback = await import('@/locales/legal/en.json')
          mergeLocaleMessage(lang, fallback.default || fallback)
          loaded.add(lang)
        } catch {
          error.value = 'Failed to load legal content'
        }
      }
    } finally {
      loading.value = false
    }
  }

  // Load on mount and re-load when locale changes
  load(locale.value)
  watch(locale, newLang => load(newLang))

  return { loading, error }
}
