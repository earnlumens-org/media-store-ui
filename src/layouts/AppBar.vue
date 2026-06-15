<template>
  <v-app-bar>
    <v-btn class="hidden-sm-and-down" icon="mdi-menu" @click="rail = !rail" />
    <div style="display: flex; flex: 1; align-items: center;">
      <!--
        Tenant custom logos. Both light and dark variants are rendered
        in the DOM and toggled with v-show so the browser fetches and
        caches both on first paint. Switching theme then becomes an
        instant CSS visibility swap with no network round-trip and no
        window where the wrong-theme logo is on screen.
      -->
      <template v-if="hasCustomLogo">
        <img
          v-show="!isDarkTheme"
          :alt="brandLabel"
          class="ml-3 app-logo app-logo--img"
          decoding="async"
          fetchpriority="high"
          :src="lightLogoUrl ?? ''"
        >
        <img
          v-show="isDarkTheme"
          :alt="brandLabel"
          class="ml-3 app-logo app-logo--img"
          decoding="async"
          fetchpriority="high"
          :src="darkLogoUrl ?? ''"
        >
      </template>
      <span
        v-else
        :aria-label="brandLabel"
        class="ml-3 app-logo"
        role="img"
        v-html="logoSvg"
      />
      <v-toolbar-title v-if="showBrandText"><b class="pl-1 font-weight-bold text-button">{{ brandLabel }}</b></v-toolbar-title>
      <v-chip
        v-if="franchiseActive"
        class="ml-2 hidden-sm-and-down"
        color="primary"
        prepend-icon="mdi-check-decagram"
        size="small"
        variant="tonal"
      >
        {{ $t('Franchise.officialOf', { tenant: franchiseTenantName }) }}
      </v-chip>
    </div>

    <div style="display: flex; flex: 1; justify-content: flex-end; align-items: center;">
      <cx-search-dialog v-if="isAuthReady" />
      <cx-language-dialog v-if="isAuthReady" />
      <template v-if="!isAuthReady">
        <v-skeleton-loader type="avatar" />
      </template>
      <template v-else>
        <cx-dark-light-mode v-if="!loggedIn" />
        <cx-login-dialog v-if="!loggedIn" />
        <cx-popover-menu v-else />
      </template>
    </div>
  </v-app-bar>

  <v-navigation-drawer
    v-model="drawer"
    :location="drawerLocation"
    :permanent="permanent"
    :rail="rail"
  >
    <v-list density="compact" nav>
      <v-skeleton-loader v-if="!isAuthReady" class="hidden-sm-and-down" type="list-item" />
      <v-tooltip v-else :disabled="!rail || mobileView" :text="$t('AppBar.home')">
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            class="hidden-sm-and-down"
            exact
            prepend-icon="mdi-home"
            :title="$t('AppBar.home')"
            to="/"
            value="home"
            @click="onNavClick('/')"
          />
        </template>
      </v-tooltip>

      <v-skeleton-loader v-if="!isAuthReady" class="hidden-sm-and-down" type="list-item" />
      <v-tooltip v-else :disabled="!rail || mobileView" :text="$t('AppBar.wallet')">
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            class="hidden-sm-and-down"
            :disabled="!loggedIn"
            exact
            prepend-icon="mdi-wallet-outline"
            :title="$t('AppBar.wallet')"
            to="/wallet"
            value="wallet"
            @click="onNavClick('/wallet')"
          />
        </template>
      </v-tooltip>

      <v-skeleton-loader v-if="!isAuthReady" type="list-item" />
      <v-tooltip v-else :disabled="!rail || mobileView" :text="$t('AppBar.favorites')">
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            :disabled="!loggedIn"
            exact
            prepend-icon="mdi-heart-outline"
            :title="$t('AppBar.favorites')"
            to="/favorites"
            value="favorites"
            @click="onNavClick('/favorites')"
          />
        </template>
      </v-tooltip>

      <v-skeleton-loader v-if="!isAuthReady" type="list-item" />
      <v-tooltip v-else :disabled="!rail || mobileView" :text="$t('AppBar.subscriptions')">
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            :disabled="!loggedIn"
            exact
            prepend-icon="mdi-bell-outline"
            :title="$t('AppBar.subscriptions')"
            to="/subscriptions"
            value="subscriptions"
            @click="onNavClick('/subscriptions')"
          />
        </template>
      </v-tooltip>

      <v-skeleton-loader v-if="!isAuthReady" type="list-item" />
      <v-tooltip v-else :disabled="!rail || mobileView" :text="$t('AppBar.purchased')">
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            :disabled="!loggedIn"
            exact
            prepend-icon="mdi-shopping-outline"
            :title="$t('AppBar.purchased')"
            to="/purchased"
            value="purchased"
            @click="onNavClick('/purchased')"
          />
        </template>
      </v-tooltip>

      <v-divider />

      <!--
        Tenant-managed Spaces. The list is fetched once on mount from
        /public/spaces and is keyed by space id. The system Explore space
        is filtered out of this loop because it has its own static link
        below pointing to /explore (kept for backwards-compatible deep
        links and the homepage CTA).
      -->
      <v-tooltip
        v-for="space in dynamicSpaces"
        :key="space.id"
        :disabled="!rail || mobileView"
        :text="resolveSpaceTitle(space)"
      >
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            exact
            :prepend-icon="space.icon || 'mdi-folder-outline'"
            :title="resolveSpaceTitle(space)"
            :to="`/spaces/${space.id}`"
            :value="`space-${space.id}`"
            @click="onNavClick(`/spaces/${space.id}`)"
          />
        </template>
      </v-tooltip>

      <!-- TODO: temporarily hidden – re-enable when Featured is ready
      <v-skeleton-loader v-if="!isAuthReady" type="list-item" />
      <v-tooltip v-else :disabled="!rail || mobileView" :text="$t('AppBar.featured')">
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            exact
            prepend-icon="mdi-star-outline"
            :title="$t('AppBar.featured')"
            to="/featured"
            value="featured"
          />
        </template>
      </v-tooltip>
      -->

      <v-skeleton-loader v-if="!isAuthReady" type="list-item" />
      <v-tooltip v-else :disabled="!rail || mobileView" :text="$t('AppBar.explore')">
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            exact
            prepend-icon="mdi-compass-outline"
            :title="$t('AppBar.explore')"
            to="/explore"
            value="explore"
            @click="onNavClick('/explore')"
          />
        </template>
      </v-tooltip>

      <v-divider />

      <v-skeleton-loader v-if="!isAuthReady" type="list-item" />
      <v-tooltip v-else :disabled="!rail || mobileView" :text="$t('AppBar.account')">
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            :disabled="!loggedIn"
            exact
            prepend-icon="mdi-account-outline"
            :title="$t('AppBar.account')"
            to="/account"
            value="account"
            @click="onNavClick('/account')"
          />
        </template>
      </v-tooltip>

      <!-- Rail item is positioned at the bottom -->
      <v-list-item style="position: fixed; bottom: 0; width: 100%" @click="rail = !rail">
        <template #prepend>
          <v-icon>{{ chevronIcon }}</v-icon>
        </template>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>

  <v-bottom-navigation class="hidden-md-and-up" :elevation="9" grow>
    <v-btn exact to="/" @click="onNavClick('/')">
      <v-icon>mdi-home</v-icon>
      {{ $t("AppBar.home") }}
    </v-btn>

    <v-btn :disabled="!loggedIn" exact to="/wallet" @click="onNavClick('/wallet')">
      <v-icon>mdi-wallet-outline</v-icon>
      {{ $t("AppBar.wallet") }}
    </v-btn>

    <v-btn :active="false" @click="drawer = !drawer">
      <v-icon>mdi-menu</v-icon>
    </v-btn>
  </v-bottom-navigation>
</template>

<script setup lang="ts">
  import type { SpaceSummaryDto } from '@/api/modules/spaces.api'
  import { storeToRefs } from 'pinia'
  import { computed, onMounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRoute } from 'vue-router'
  import { useTheme } from 'vuetify'
  import { api } from '@/api/api'
  import logo from '@/assets/logo.svg?raw'
  import CxDarkLightMode from '@/components/CxDarkLightMode.vue'
  import CxLanguageDialog from '@/components/CxLanguageDialog.vue'
  import CxLoginDialog from '@/components/CxLoginDialog.vue'
  import CxPopoverMenu from '@/components/CxPopoverMenu.vue'
  import CxSearchDialog from '@/components/CxSearchDialog.vue'
  import { useAppStore } from '@/stores/app'
  import { useAuthStore } from '@/stores/auth'
  import { useFranchiseStore } from '@/stores/franchise'
  import { useTenantStore } from '@/stores/tenant'

  const logoSvg = logo

  // Router
  const route = useRoute()

  // Store
  const appStore = useAppStore()
  const authStore = useAuthStore()
  const tenantStore = useTenantStore()
  const franchiseStore = useFranchiseStore()
  const theme = useTheme()
  const { mobileView, windowWidth } = storeToRefs(appStore)
  const { isAuthenticated: loggedIn, isAuthReady } = storeToRefs(authStore)
  const { brandText, brandTextHidden } = storeToRefs(tenantStore)
  const { logoUrl: tenantLightLogo, logoUrlDark: tenantDarkLogo } = storeToRefs(tenantStore)
  const {
    isActive: franchiseActive,
    brandText: franchiseBrand,
    logoUrl: franchiseLogo,
  } = storeToRefs(franchiseStore)

  // When a franchise sub-storefront is active its branding overrides the
  // tenant's; otherwise the plain tenant logos are used. The franchise ships
  // a single logo used in both light and dark modes.
  const lightLogoUrl = computed(() =>
    franchiseActive.value && franchiseLogo.value ? franchiseLogo.value : tenantLightLogo.value,
  )
  const darkLogoUrl = computed(() =>
    franchiseActive.value && franchiseLogo.value ? franchiseLogo.value : tenantDarkLogo.value,
  )

  /**
   * Storefront brand label rendered next to the logo. An active franchise
   * title wins, then the tenant override, then the hardcoded EARNLUMENS so
   * the UI never goes blank if the tenant probe has not resolved yet.
   */
  const brandLabel = computed(
    () => (franchiseActive.value && franchiseBrand.value) || brandText.value || 'EARNLUMENS',
  )
  /** Name of the franchisor tenant, shown in the "official franchise of" badge. */
  const franchiseTenantName = computed(() => brandText.value ?? 'EarnLumens')
  /**
   * When the tenant has flipped on logo-only mode the AppBar hides the
   * text entirely. brandTextHidden is read from the visitor probe so the
   * decision is consistent with every other route the SPA serves.
   */
  const showBrandText = computed(() => !brandTextHidden.value)
  /**
   * Whether the active Vuetify theme resolves to a dark surface. Used to
   * pick which of the two pre-rendered <img> tags is visible — both are
   * mounted at all times so swapping themes is an instant CSS toggle.
   */
  const isDarkTheme = computed(() => theme.global.current.value.dark)
  /**
   * True when the tenant has any custom logo configured. logoUrlDark in
   * the store already falls back to the light key when the dark variant
   * is missing, so a single light URL is enough to enter custom-logo
   * rendering mode (the same image will be shown in both themes).
   */
  const hasCustomLogo = computed(() => Boolean(lightLogoUrl.value || darkLogoUrl.value))

  // State
  const drawer = ref(false)
  const rail = ref(true)
  const drawerLocation = ref<'left' | 'right' | 'top' | 'bottom'>('right')
  const permanent = ref(false)

  // Tenant-managed sidebar spaces. Loaded once on mount; refreshing on
  // every route change would thrash the public endpoint without value.
  // The system Explore space is filtered out so the static /explore link
  // below stays the canonical entry point for it.
  const sidebarSpaces = ref<SpaceSummaryDto[]>([])
  const { locale, t } = useI18n()

  const dynamicSpaces = computed(() =>
    sidebarSpaces.value.filter(s => !(s.systemSpace && s.key === 'explore')),
  )

  function resolveSpaceTitle (s: SpaceSummaryDto): string {
    if (s.systemSpace && s.key === 'explore') {
      return t('AppBar.explore')
    }
    const raw = s.translations?.[locale.value] || s.baseName || s.key
    // Sidebar consistency: every entry is rendered Title-Cased on its
    // first character regardless of how the admin entered the baseName
    // or how the AI translated it (e.g. "comunidad" → "Comunidad").
    if (!raw) return raw
    return raw.charAt(0).toLocaleUpperCase(locale.value) + raw.slice(1)
  }

  // Computed
  const chevronIcon = computed(() => {
    if (drawerLocation.value === 'right') {
      return rail.value ? 'mdi-chevron-left' : 'mdi-chevron-right'
    }
    return rail.value ? 'mdi-chevron-right' : 'mdi-chevron-left'
  })

  // Methods
  function onNavClick (path: string) {
    if (route.path === path) {
      appStore.triggerRefresh()
    }
  }

  function handleResize () {
    if (mobileView.value) {
      rail.value = false
      drawer.value = false
      drawerLocation.value = 'right'
      permanent.value = false
    } else {
      // Note: windowWidth is strictly typed as number in the store
      if (windowWidth.value < 1264) {
        rail.value = true
        drawer.value = true
        drawerLocation.value = 'left'
        permanent.value = true
      } else {
        rail.value = false
        drawer.value = true
        drawerLocation.value = 'left'
        permanent.value = true
      }
    }
  }

  // Watchers
  // Watch windowWidth to trigger resize logic, replacing the manual event listener from OLD
  // since App.vue already tracks resize and updates store.
  watch(windowWidth, () => {
    handleResize()
  })

  // Lifecycle
  onMounted(() => {
    handleResize()
    // Best-effort fetch — the sidebar still works (statics only) if the
    // backend is unreachable, so a thrown promise here is intentionally
    // swallowed.
    api.spaces.listSidebar()
      .then(list => {
        sidebarSpaces.value = list
      })
      .catch(() => { /* keep static-only sidebar */ })
  })

</script>

<style scoped>
.app-logo {
  display: inline-flex;
  width: 24px;
  height: 24px;
}

.app-logo :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}

/*
 * Uploaded raster logos (PNG/WebP). Height is fixed to match the SVG so the
 * AppBar layout never shifts; width is auto + capped at 160px so even a
 * ratio-validation bypass cannot stretch the bar. object-fit:contain keeps
 * the logo from being squashed inside that envelope.
 */
.app-logo--img {
  width: auto;
  height: 24px;
  max-width: 160px;
  object-fit: contain;
}
</style>
