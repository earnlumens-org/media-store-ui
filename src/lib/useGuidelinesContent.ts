import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * Composable that lazy-loads content guidelines from separate locale files.
 *
 * Guidelines files live in  src/locales/guidelines/{lang}.json
 * and are merged into the i18n instance under the "Guidelines" namespace.
 *
 * Usage:
 *   const { loading, error } = useGuidelinesContent()
 *   // then use $t('Guidelines.title'), etc.
 */
export function useGuidelinesContent () {
  const { locale, mergeLocaleMessage } = useI18n()
  const loading = ref(true)
  const error = ref<string | null>(null)

  const loaded = new Set<string>()

  async function load (lang: string) {
    if (loaded.has(lang)) {
      loading.value = false
      return
    }

    loading.value = true
    error.value = null

    try {
      const messages = await import(`@/locales/guidelines/${lang}.json`)
      mergeLocaleMessage(lang, messages.default || messages)
      loaded.add(lang)
    } catch {
      // Fallback to Spanish (primary language for guidelines)
      if (lang === 'es') {
        error.value = 'Failed to load guidelines content'
      } else {
        try {
          const fallback = await import('@/locales/guidelines/es.json')
          mergeLocaleMessage(lang, fallback.default || fallback)
          loaded.add(lang)
        } catch {
          error.value = 'Failed to load guidelines content'
        }
      }
    } finally {
      loading.value = false
    }
  }

  load(locale.value)
  watch(locale, newLang => load(newLang))

  return { loading, error }
}
