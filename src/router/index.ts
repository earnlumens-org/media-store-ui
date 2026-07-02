import { setupLayouts } from 'virtual:generated-layouts'
import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import { maybeApplyUpdateOnNavigation } from '@/services/appUpdate'
import { useAuthStore } from '@/stores/auth'

// ── Scroll restoration: detect browser back/forward (popstate) ──────────────
let _isPopNavigation = false
window.addEventListener('popstate', () => {
  _isPopNavigation = true
})

/** Returns `true` when the current navigation was triggered by browser back/forward */
export function isPopNavigation (): boolean {
  return _isPopNavigation
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: setupLayouts(routes),
  scrollBehavior (to, _from, savedPosition) {
    // Back/forward → components restore scroll after data loads
    if (savedPosition) {
      return false
    }
    // Hash navigation (e.g. /guidelines#tenant-specific-rules) → scroll to
    // the element. We delay 300ms so async page content (i18n, public API
    // fetches, etc.) has a chance to render before we look up the element;
    // pages with longer fetches additionally re-scroll themselves once
    // their data resolves (see Guidelines.vue).
    if (to.hash) {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ el: to.hash, behavior: 'smooth', top: 80 })
        }, 300)
      })
    }
    // New navigation → scroll to top
    return { top: 0 }
  },
})

// Reset flag after components have mounted (setTimeout ensures onMounted ran first)
router.afterEach(() => {
  setTimeout(() => {
    _isPopNavigation = false
  }, 0)

  // A route change is a natural full-content boundary: if a new build is
  // waiting and no critical operation is in flight, silently land the user on
  // it now (a one-time reload to the destination). Deferred / no-op otherwise.
  maybeApplyUpdateOnNavigation()
})

// ── Franchise attribution (?f=<slug>) ───────────────────────────────────────
// Opening an entry or collection FROM a franchise storefront (/f/<slug>) tags
// the destination with ?f=<slug> so checkout and tips attribute the sale to
// the franchise (mirrors the reseller ?r=<code> pattern). Deliberately scoped
// to that direct hop only: further navigation drops the tag — a franchise
// earns on what its page sells, not on everything the user buys afterwards.
// The backend re-validates the slug at prepare time (active franchise or the
// purchase is rejected), so a hand-crafted or shared ?f link is harmless.
const FRANCHISE_PATH_RE = /^\/f\/([^/]+)\/?$/
const CONTENT_PATH_RE = /^\/(?:preview|watch|listen|view|read|collection)\//
router.beforeEach((to, from) => {
  if ('f' in to.query) {
    return
  }
  const match = FRANCHISE_PATH_RE.exec(from.path)
  if (!match || !CONTENT_PATH_RE.test(to.path)) {
    return
  }
  return {
    path: to.path,
    query: { ...to.query, f: match[1] },
    hash: to.hash,
  }
})

// Middleware de autenticación antes de cada ruta
router.beforeEach(async (to, _from) => {
  const authStore = useAuthStore()

  const normalizedPath = to.path.toLowerCase()
  if (to.path !== normalizedPath) {
    return {
      path: normalizedPath,
      query: to.query,
      hash: to.hash,
      replace: true,
    }
  }

  // Wait for auth to be ready before checking protected routes
  const requiresAuth = to.meta?.requiresAuth === true
  if (requiresAuth) {
    // If auth not ready yet, wait for it (with timeout)
    if (!authStore.isAuthReady) {
      const AUTH_TIMEOUT = 10_000 // 10 seconds max wait
      let timeoutId: ReturnType<typeof setTimeout> | null = null

      await Promise.race([
        new Promise<void>(resolve => {
          const unwatch = authStore.$subscribe((_mutation, state) => {
            if (state.isAuthReady) {
              unwatch()
              if (timeoutId) {
                clearTimeout(timeoutId)
              }
              resolve()
            }
          })
          // Safety check in case it became ready between our check and subscribe
          if (authStore.isAuthReady) {
            unwatch()
            if (timeoutId) {
              clearTimeout(timeoutId)
            }
            resolve()
          }
        }),
        new Promise<void>(resolve => {
          timeoutId = setTimeout(() => {
            console.warn('[Router] Auth timeout - forcing isAuthReady')
            authStore.setAuthReady(true)
            resolve()
          }, AUTH_TIMEOUT)
        }),
      ])
    }

    // Now check if logged in
    if (!authStore.isAuthenticated) {
      return '/'
    }
  }
})

// A failed lazy-loaded route chunk is the #1 cause of the "back button does
// nothing / stuck on the current page until I refresh" symptom — vue-router
// aborts the navigation and leaves the user on the previous view. It happens
// most on PWAs and mobile: a new deploy purges the old hashed chunks while a
// standalone PWA is still open, or a spotty mobile connection drops the chunk
// request. The recovery is a full reload to the intended URL.
//
// The error wording differs per engine, so matching only Chromium's phrase
// (as before) left iOS/WebKit PWAs and other browsers stranded:
//   - Chromium: "Failed to fetch dynamically imported module"
//   - Firefox:  "error loading dynamically imported module"
//   - WebKit/iOS: "Importing a module script failed" / "Unable to load …" /
//                 "Load failed"
const CHUNK_LOAD_ERROR_RE = /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|module script failed|dynamically imported module|unable to (?:load|preload)|load failed/i

function isDynamicImportError (err: unknown): boolean {
  if (!err) return false
  const message = err instanceof Error ? err.message : String(err)
  const name = err instanceof Error ? err.name : ''
  return name === 'ChunkLoadError' || CHUNK_LOAD_ERROR_RE.test(message)
}

const RELOAD_GUARD_KEY = 'router:chunk-reload-at'

/**
 * Recover from a stale/failed route chunk with a full reload to `targetUrl`,
 * guarded against reload loops. Returns `true` if a reload was triggered.
 */
function recoverFromChunkError (targetUrl: string, err: unknown): boolean {
  const now = Date.now()
  const last = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) ?? '0')
  if (Number.isFinite(last) && now - last < 10_000) {
    console.error('[Router] Dynamic import error persisted after reload', err)
    return false
  }
  sessionStorage.setItem(RELOAD_GUARD_KEY, String(now))
  console.warn('[Router] Reloading to recover from stale route chunk', err)
  location.assign(targetUrl)
  return true
}

router.onError((err, to) => {
  if (!isDynamicImportError(err)) {
    console.error(err)
    return
  }
  recoverFromChunkError(to.fullPath, err)
})

// Vite also surfaces failed lazy-chunk preloads through this window event,
// which can fire without a corresponding router error (e.g. a hovered
// <link rel=modulepreload> that 404s after a deploy). Recover the same way so
// the next navigation/back-press doesn't silently stall.
window.addEventListener('vite:preloadError', event => {
  event.preventDefault()
  recoverFromChunkError(window.location.href, (event as { payload?: unknown }).payload)
})

router.isReady().then(() => {
  // Successful boot → clear both the time-window guard and any legacy flag.
  sessionStorage.removeItem(RELOAD_GUARD_KEY)
  localStorage.removeItem('vuetify:dynamic-reload')
})

export default router
