<template>
  <v-app>
    <!--
      Tenant gate: nothing storefront-related renders until we know whether
      this hostname maps to a real, active tenant. Otherwise an unknown
      subdomain (e.g. typo.earnlumens.org) would silently flash the default
      tenant's content before any 404 could take over.
    -->
    <TenantNotFoundPage
      v-if="tenantStore.isNotFound"
      :subdomain="tenantStore.subdomain ?? ''"
    />
    <router-view v-else-if="tenantStore.isReady" />

    <!--
      Bootstrap loader: shown after Vue mounts but while the tenant probe is
      still resolving (isReady === false, isNotFound === false). Without it the
      v-app would render empty and the screen would go black on cold starts /
      PWA resume. Centred both axes over the themed background.
    -->
    <div
      v-else
      class="d-flex align-center justify-center"
      style="position: fixed; inset: 0;"
    >
      <v-progress-circular color="primary" indeterminate size="64" />
    </div>

    <!-- Global rate-limit / notification snackbar -->
    <v-snackbar
      v-model="globalSnack"
      :color="globalSnackColor"
      location="top"
      timeout="5000"
    >
      {{ $t(globalSnackMsg) }}
    </v-snackbar>

    <!-- Login error dialog -->
    <v-dialog
      v-model="loginErrorDialog"
      max-width="400"
      persistent
    >
      <v-card prepend-icon="mdi-alert-circle">
        <template #title>
          {{ $t('Common.loginErrorTitle') }}
        </template>

        <v-card-text>
          {{ $t('Common.loginErrorDescription') }}
          <div v-if="loginErrorMessage" class="text-caption font-weight-thin mt-2">
            {{ loginErrorMessage }}
          </div>
        </v-card-text>

        <template #actions>
          <v-spacer />
          <v-btn color="primary" @click="closeLoginErrorDialog">
            {{ $t('Common.accept') }}
          </v-btn>
        </template>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import { useTheme } from 'vuetify'
  import TenantNotFoundPage from '@/components/TenantNotFoundPage.vue'
  import { getPlatformName } from '@/config/env'
  import { DEFAULT_DARK_THEME, DEFAULT_LIGHT_THEME } from '@/plugins/vuetify'
  import { globalSnackbar, globalSnackbarColor, globalSnackbarMessage } from '@/services/globalNotification'
  import { useAppStore } from '@/stores/app'
  import { useAuthStore } from '@/stores/auth'
  import { useFranchiseStore } from '@/stores/franchise'
  import { useTenantStore } from '@/stores/tenant'

  const globalSnack = globalSnackbar
  const globalSnackMsg = globalSnackbarMessage
  const globalSnackColor = globalSnackbarColor

  const app = useAppStore()
  const authStore = useAuthStore()
  const tenantStore = useTenantStore()
  const franchiseStore = useFranchiseStore()
  const theme = useTheme()

  // Resolve the visitor's tenant context as early as possible. Any
  // template that depends on storefront data is gated on `tenantStore.isReady`.
  tenantStore.load()

  // Login error dialog state
  const loginErrorDialog = ref(false)
  const loginErrorMessage = ref('')

  // Watch for auth errors from callback
  const authError = computed(() => authStore.error)

  watch(authError, error => {
    if (error) {
      loginErrorMessage.value = decodeURIComponent(error)
      loginErrorDialog.value = true
    }
  })

  function closeLoginErrorDialog () {
    loginErrorDialog.value = false
    authStore.clearError()
  }

  function setTheme (name: string) {
    const maybeTheme = theme as unknown as { change?: (name: string) => void }
    if (typeof maybeTheme.change === 'function') {
      maybeTheme.change(name)
      return
    }

    theme.global.name.value = name
  }

  function updateWindowWidth () {
    app.updateWindowWidth(window.innerWidth)
  }

  function applyTheme () {
    setTheme(app.themeName)
  }

  onMounted(() => {
    // Window width
    updateWindowWidth()
    window.addEventListener('resize', updateWindowWidth)

    // Theme from localStorage
    const storedThemeName = localStorage.getItem('themeName')
    if (storedThemeName) {
      app.setThemeName(storedThemeName)
    } else {
      // Migration: legacy boolean key
      const legacyIsDark = localStorage.getItem('isDarkTheme')
      if (legacyIsDark !== null) {
        const isDark = legacyIsDark === 'true'
        const migratedThemeName = isDark ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME
        app.setThemeName(migratedThemeName)
        localStorage.setItem('themeName', migratedThemeName)
        localStorage.removeItem('isDarkTheme')
      }
    }

    // Apply theme
    applyTheme()
  })

  // Once the visitor probe completes, honour the tenant's default theme for
  // the current mode (light/dark) — but only when the visitor has no saved
  // preference yet. A returning visitor who explicitly picked a theme keeps
  // it; a new visitor sees the storefront in the colors the owner curated.
  watch(() => tenantStore.isReady, ready => {
    if (!ready) return
    if (localStorage.getItem('themeName')) return
    const isDarkMode = theme.global.current.value.dark
    const tenantPick = isDarkMode ? tenantStore.defaultDarkTheme : tenantStore.defaultLightTheme
    if (tenantPick) {
      app.setThemeName(tenantPick)
      applyTheme()
    }
  }, { immediate: true })

  // Per-tenant browser favicon: swap the in-document <link rel="icon"> href
  // at runtime so each tenant can ship its own tab icon. Gated on
  // tenantStore.isReady so we don't briefly flash the platform default
  // /favicon.ico on every refresh before the visitor probe resolves
  // (index.html ships with a blank data: icon for the same reason).
  const DEFAULT_FAVICON_HREF = '/favicon.ico'
  watch(
    () => [tenantStore.isReady, tenantStore.faviconUrl] as const,
    ([ready, url]) => {
      if (typeof document === 'undefined') return
      if (!ready) return
      const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
      if (!link) return
      link.setAttribute('href', url ?? DEFAULT_FAVICON_HREF)
    },
    { immediate: true },
  )

  // Per-tenant browser-tab title. Mirrors the AppBar's fallback chain so
  // the tab text and the AppBar label stay in sync: explicit override →
  // tenant title → platform name derived from the deployment domain.
  // Skipped while the visitor probe is in flight so we don't flash an
  // empty title on slow networks.
  const DEFAULT_BROWSER_TITLE = getPlatformName()
  watch(
    () => [tenantStore.isReady, tenantStore.browserTitle, tenantStore.brandText, tenantStore.subdomain] as const,
    ([ready, browserTitle]) => {
      if (typeof document === 'undefined') return
      if (!ready) return
      const next = (browserTitle && browserTitle.trim())
        || (tenantStore.brandText && tenantStore.brandText.trim())
        || DEFAULT_BROWSER_TITLE
      if (document.title !== next) {
        document.title = next
      }
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    window.removeEventListener('resize', updateWindowWidth)
  })

  // Franchise accent-colour override. While a franchise sub-storefront is the
  // active context (route /f/:slug) the franchise's accent colour replaces the
  // active Vuetify theme's `primary` so buttons, links and the brand badge
  // match the franchise. The original colour is captured per theme and
  // restored the moment the franchise context is cleared.
  const originalPrimary = new Map<string, string>()
  watch(
    () => [franchiseStore.isActive, franchiseStore.accentColor, theme.global.name.value] as const,
    ([active, accent, themeName]) => {
      const themeDef = theme.themes.value[themeName]
      if (!themeDef) return
      if (active && accent) {
        if (!originalPrimary.has(themeName)) {
          originalPrimary.set(themeName, themeDef.colors.primary)
        }
        themeDef.colors.primary = accent
      } else if (originalPrimary.has(themeName)) {
        themeDef.colors.primary = originalPrimary.get(themeName)!
        originalPrimary.delete(themeName)
      }
    },
    { immediate: true },
  )
</script>
