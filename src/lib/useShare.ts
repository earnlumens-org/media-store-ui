import { useI18n } from 'vue-i18n'

/**
 * Composable that provides share functionality matching the behaviour of
 * major platforms (Instagram, YouTube, etc.):
 *
 * 1. On mobile / supported browsers → native share sheet (navigator.share)
 * 2. Fallback → copy link to clipboard + snackbar confirmation
 *
 * Returns `{ share }` where `share(title, url)` is the handler.
 * The caller must provide its own `snackbar` and `snackbarText` refs
 * so feedback integrates into the existing card snackbar.
 */
export function useShare (snackbar: { value: boolean }, snackbarText: { value: string }) {
  const { t } = useI18n()

  async function share (title: string, url: string) {
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
      } catch {
        // User cancelled the share sheet — ignore
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        snackbarText.value = t('Common.linkCopied')
        snackbar.value = true
      } catch {
        // Clipboard API not available — open a window with the URL
        window.prompt(t('Common.linkCopied'), url)
      }
    }
  }

  return { share }
}
