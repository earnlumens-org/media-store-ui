import { setupLayouts } from 'virtual:generated-layouts'
import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import { useAppStore } from '@/stores/app'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: setupLayouts(routes),
  scrollBehavior () {
    return { top: 0 }
  },
})

// Middleware de autenticación antes de cada ruta
router.beforeEach((to, _from) => {
  const appStore = useAppStore()

  const normalizedPath = to.path.toLowerCase()
  if (to.path !== normalizedPath) {
    return {
      path: normalizedPath,
      query: to.query,
      hash: to.hash,
      replace: true,
    }
  }

  const requiresAuth = to.meta?.requiresAuth === true
  if (requiresAuth && !appStore.loggedIn) {
    return '/'
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
