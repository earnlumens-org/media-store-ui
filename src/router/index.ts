import { setupLayouts } from 'virtual:generated-layouts'
import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: setupLayouts(routes),
  scrollBehavior () {
    return { top: 0 }
  },
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

router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (localStorage.getItem('vuetify:dynamic-reload')) {
      console.error('Dynamic import error, reloading page did not fix it', err)
    } else {
      console.log('Reloading page to fix dynamic import error')
      localStorage.setItem('vuetify:dynamic-reload', 'true')
      location.assign(to.fullPath)
    }
  } else {
    console.error(err)
  }
})

router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload')
})

export default router
