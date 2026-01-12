<template>
  <v-app-bar>
    <v-btn class="hidden-sm-and-down" icon="mdi-menu" @click="rail = !rail" />
    <div style="display: flex; flex: 1; align-items: center;">
      <span aria-label="EARNLUMENS" class="ml-3 app-logo" role="img" v-html="logoSvg" />
      <v-toolbar-title><b class="pl-1 font-weight-bold text-button">EARNLUMENS</b></v-toolbar-title>
    </div>

    <div style="display: flex; flex: 1; justify-content: flex-end; align-items: center;">
      <cx-search-dialog v-if="isAuthReady" />
      <cx-language-dialog v-if="isAuthReady" />
      <template v-if="!isAuthReady">
        <v-btn class="ma-1" disabled icon variant="text">
          <v-skeleton-loader boilerplate height="40" type="avatar" width="40" />
        </v-btn>
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
      <v-tooltip :disabled="mobileView" :text="$t('AppBar.home')">
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            class="hidden-sm-and-down"
            exact
            prepend-icon="mdi-home"
            :title="$t('AppBar.home')"
            to="/"
            value="home"
          />
        </template>
      </v-tooltip>

      <v-tooltip :disabled="mobileView" :text="$t('AppBar.firststeps')">
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            exact
            prepend-icon="mdi-sprout-outline"
            :title="$t('AppBar.firststeps')"
            to="/firststeps"
            value="firststeps"
          />
        </template>
      </v-tooltip>

      <v-divider />

      <v-tooltip :disabled="mobileView" :text="$t('AppBar.wallet')">
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
          />
        </template>
      </v-tooltip>

      <v-tooltip :disabled="mobileView" :text="$t('AppBar.favorites')">
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            :disabled="!loggedIn"
            exact
            prepend-icon="mdi-heart-outline"
            :title="$t('AppBar.favorites')"
            to="/favorites"
            value="favorites"
          />
        </template>
      </v-tooltip>

      <v-tooltip :disabled="mobileView" :text="$t('AppBar.purchased')">
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            :disabled="!loggedIn"
            exact
            prepend-icon="mdi-shopping-outline"
            :title="$t('AppBar.purchased')"
            to="/purchased"
            value="purchased"
          />
        </template>
      </v-tooltip>

      <v-divider />

      <v-tooltip :disabled="mobileView" :text="$t('AppBar.ecosystem')">
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            exact
            prepend-icon="mdi-creation"
            :title="$t('AppBar.ecosystem')"
            to="/ecosystem"
            value="ecosystem"
          />
        </template>
      </v-tooltip>

      <v-tooltip :disabled="mobileView" :text="$t('AppBar.community')">
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            exact
            prepend-icon="mdi-handshake-outline"
            :title="$t('AppBar.community')"
            to="/community"
            value="community"
          />
        </template>
      </v-tooltip>

      <v-tooltip :disabled="mobileView" :text="$t('AppBar.featured')">
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

      <v-tooltip :disabled="mobileView" :text="$t('AppBar.explore')">
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            exact
            prepend-icon="mdi-compass-outline"
            :title="$t('AppBar.explore')"
            to="/explore"
            value="explore"
          />
        </template>
      </v-tooltip>

      <v-divider />

      <v-tooltip :disabled="mobileView" :text="$t('AppBar.account')">
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            :disabled="!loggedIn"
            exact
            prepend-icon="mdi-account-outline"
            :title="$t('AppBar.account')"
            to="/account"
            value="account"
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
    <v-btn exact to="/">
      <v-icon>mdi-home</v-icon>
      {{ $t("AppBar.home") }}
    </v-btn>

    <v-btn :disabled="!loggedIn" exact to="/wallet">
      <v-icon>mdi-wallet-outline</v-icon>
      {{ $t("AppBar.wallet") }}
    </v-btn>

    <v-btn :active="false" @click="drawer = !drawer">
      <v-icon>mdi-menu</v-icon>
    </v-btn>
  </v-bottom-navigation>
</template>

<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { computed, onMounted, ref, watch } from 'vue'
  import logo from '@/assets/logo.svg?raw'
  import CxDarkLightMode from '@/components/CxDarkLightMode.vue'
  import CxLanguageDialog from '@/components/CxLanguageDialog.vue'
  import CxLoginDialog from '@/components/CxLoginDialog.vue'
  import CxPopoverMenu from '@/components/CxPopoverMenu.vue'
  import CxSearchDialog from '@/components/CxSearchDialog.vue'
  import { useAppStore } from '@/stores/app'
  import { useAuthStore } from '@/stores/auth'

  const logoSvg = logo

  // Store
  const appStore = useAppStore()
  const authStore = useAuthStore()
  const { mobileView, windowWidth } = storeToRefs(appStore)
  const { isAuthenticated: loggedIn, isAuthReady } = storeToRefs(authStore)

  // State
  const drawer = ref(false)
  const rail = ref(true)
  const drawerLocation = ref<'left' | 'right' | 'top' | 'bottom'>('right')
  const permanent = ref(false)

  // Computed
  const chevronIcon = computed(() => {
    if (drawerLocation.value === 'right') {
      return rail.value ? 'mdi-chevron-left' : 'mdi-chevron-right'
    }
    return rail.value ? 'mdi-chevron-right' : 'mdi-chevron-left'
  })

  // Methods
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
</style>
