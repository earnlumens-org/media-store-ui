import { createRouter, createWebHistory } from 'vue-router'
import { setupLayouts } from 'virtual:generated-layouts'
import { routes } from 'vue-router/auto-routes'
import { useAppStore } from '@/stores/app'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: setupLayouts(routes),
  scrollBehavior() {
    return { top: 0 };
  },
})

// Middleware de autenticación antes de cada ruta
router.beforeEach((to, from) => {
  const appStore = useAppStore()

  const publicPages = [
    '/',
    '/Fan',
    '/[username]',
    '/WaitList',
    '/WaitListStats',
    '/FirstSteps',
    '/Ecosystem',
    '/Community',
    '/Featured',
    '/Explore',
    '/[...catchAll]',
    '/section/[...path]',
    '/feed/[...path]',
  ];

  const authRequired = !publicPages.includes(to.name as string);

  if (authRequired && !appStore.loggedIn) {
    return '/'
  }
});

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
