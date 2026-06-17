/**
 * App-update orchestrator.
 *
 * Goal: a tenant always ends up on the newest deployed build without ever
 * having to hard-refresh, while NEVER reloading the page out from under a
 * user who is in the middle of something irreversible (paying, connecting a
 * wallet, signing a transaction). See `@/services/criticalSection`.
 *
 * How it works
 * ------------
 * The service worker is registered in `prompt` mode (see vite.config), so a
 * freshly deployed SW installs and then *waits* instead of taking over and
 * reloading on its own (the dangerous default of `autoUpdate`). When the
 * waiting SW appears we surface it as {@link updateReady} and apply it only at
 * a safe moment:
 *
 *   - immediately if the user taps "Update" in the snackbar, or
 *   - on the next route navigation (a natural full-content boundary), or
 *   - as soon as a critical operation finishes, if one was in flight when the
 *     update was detected.
 *
 * We also actively poll for new versions (periodically, on tab focus, and when
 * the tab becomes visible again) so a long-lived/returning session doesn't sit
 * on a stale build. (Recovery from a stale lazy-loaded chunk that 404s after a
 * deploy is owned by the router — see `@/router`.)
 *
 * The actual reload (`applyUpdate(true)`) tells the waiting SW to
 * `skipWaiting()` and then reloads once it takes control, so the document and
 * every hashed asset come from the new build — no manual hard refresh, no
 * stale chunks, consistent on desktop, mobile and installed PWA.
 */

import { registerSW } from 'virtual:pwa-register'
import { readonly, ref, watch } from 'vue'

import { isCriticalOperationActive } from './criticalSection'

/** True once a new build is installed and waiting to be applied. */
const _updateReady = ref(false)
export const updateReady = readonly(_updateReady)

/**
 * True when an update is ready AND it is safe to surface/apply it (i.e. no
 * critical operation is in flight). The snackbar binds to this so the prompt
 * never appears mid-payment; it pops the moment the critical section clears.
 */
const _updatePromptVisible = ref(false)
export const updatePromptVisible = readonly(_updatePromptVisible)

/** How often to proactively check the server for a new SW (30 min). */
const PERIODIC_CHECK_MS = 30 * 60 * 1000

/** The reload trigger handed back by `registerSW`; null until init runs. */
let applyUpdateFn: ((reloadPage?: boolean) => Promise<void>) | null = null
/** Guards against kicking off the reload more than once. */
let applying = false
let initialised = false

/**
 * Applies the waiting update. Tells the waiting SW to take over and reloads so
 * the whole document + assets come from the new build. Idempotent.
 */
export async function applyUpdate (): Promise<void> {
  if (applying || !applyUpdateFn) {
    return
  }
  applying = true
  _updatePromptVisible.value = false
  await applyUpdateFn(true)
}

/** Dismisses the snackbar without applying. The update stays pending. */
export function dismissUpdatePrompt (): void {
  _updatePromptVisible.value = false
}

/**
 * Re-evaluates whether the pending update may be surfaced now. Called when an
 * update is first detected and again whenever the critical-section state
 * changes. While a critical op is in flight we keep the update pending and
 * silent; as soon as it clears the prompt becomes visible.
 */
function refreshPromptVisibility (): void {
  _updatePromptVisible.value = _updateReady.value && !isCriticalOperationActive.value
}

/**
 * Applies the pending update on a route navigation, when safe. Wired into the
 * router's `afterEach` so active browsing silently lands on the new build at a
 * natural boundary. No-op when there's nothing pending or a critical op is in
 * flight (in which case the snackbar / critical-section watcher take over).
 */
export function maybeApplyUpdateOnNavigation (): void {
  if (!_updateReady.value || applying || isCriticalOperationActive.value) {
    return
  }
  void applyUpdate()
}

/**
 * Initialises SW registration and update polling. Safe to call once, after the
 * app has mounted. Subsequent calls are no-ops.
 */
export function initAppUpdate (): void {
  if (initialised || typeof window === 'undefined') {
    return
  }
  initialised = true

  applyUpdateFn = registerSW({
    immediate: true,
    onNeedRefresh () {
      _updateReady.value = true
      refreshPromptVisibility()
    },
    onRegisteredSW (_swUrl, registration) {
      if (!registration) {
        return
      }

      // Proactively poll for a newer SW so long-lived sessions don't go stale.
      const checkForUpdate = () => {
        if (document.visibilityState === 'visible') {
          registration.update().catch(() => {})
        }
      }
      setInterval(checkForUpdate, PERIODIC_CHECK_MS)

      // Returning users / tab regaining focus: check right away.
      window.addEventListener('focus', checkForUpdate)
      document.addEventListener('visibilitychange', checkForUpdate)
    },
  })

  // When a critical operation ends, surface any update that arrived meanwhile.
  watch(isCriticalOperationActive, () => {
    refreshPromptVisibility()
  })
}
