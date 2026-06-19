<template>
  <div class="text-center">
    <v-menu
      v-model="menu"
      :close-on-content-click="false"
      location="bottom"
    >
      <!-- Activador: avatar -->
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          class="mr-3"
          icon
          variant="text"
        >
          <!--
            color="surface-variant" keeps the avatar slot a visible, theme-toned
            disc so the menu button never collapses into an empty/invisible
            circle when the X profile image is missing or fails to load.
            referrerpolicy="no-referrer" is the actual fix for the intermittent
            blank avatar: pbs.twimg.com sometimes 403s requests that carry a
            Referer header (varies by device/cache), and @error falls back to
            the account icon when it does.
          -->
          <v-avatar color="surface-variant">
            <v-img
              v-if="avatarUrl"
              :alt="displayName || username || 'avatar'"
              referrerpolicy="no-referrer"
              :src="avatarUrl"
              @error="avatarFailed = true"
            />
            <v-icon v-else color="on-surface-variant" icon="mdi-account-circle" />
          </v-avatar>
        </v-btn>
      </template>

      <!-- Contenido del Popover -->
      <v-card min-width="300">

        <!-- Perfil -->
        <v-list>
          <v-list-item
            :subtitle="username"
            :title="displayName"
            @click="goToProfile"
          >
            <!--
              Same palliative as the activator avatar: a themed disc with an
              account-icon fallback so a missing/failed X profile image never
              leaves an empty hole in the profile row (shares avatarUrl /
              avatarFailed so both recover together on a fresh login).
            -->
            <template #prepend>
              <v-avatar color="surface-variant">
                <v-img
                  v-if="avatarUrl"
                  :alt="displayName || username || 'avatar'"
                  referrerpolicy="no-referrer"
                  :src="avatarUrl"
                  @error="avatarFailed = true"
                />
                <v-icon v-else color="on-surface-variant" icon="mdi-account-circle" />
              </v-avatar>
            </template>
            <template #append>
              <v-icon>mdi-chevron-right</v-icon>
            </template>
          </v-list-item>
        </v-list>

        <v-divider />

        <!-- Opciones -->
        <v-list class="popover-menu-list">
          <!-- Temas + Dark mode toggle como dos botones independientes -->
          <div class="d-flex align-center px-2">
            <v-btn
              class="text-none justify-start"
              prepend-icon="mdi-palette-outline"
              variant="text"
              @click="goToThemes"
            >
              {{ $t('Common.themes') }}
            </v-btn>
            <v-spacer />
            <v-btn
              icon="mdi-circle-half-full"
              size="small"
              variant="text"
              @click="toggleTheme"
            />
          </div>

          <!-- Creator Studio -->
          <div class="d-flex align-center px-2">
            <v-btn
              class="text-none justify-start"
              prepend-icon="mdi-movie-open-edit-outline"
              variant="text"
              @click="goToCreatorStudio"
            >
              {{ $t('Account.creatorStudio') }}
            </v-btn>
          </div>

          <!-- Botón subir (resaltado) -->
          <div class="d-flex align-center px-2">
            <v-btn
              class="text-uppercase font-weight-medium text-none justify-start"
              color="primary"
              prepend-icon="mdi-cloud-upload-outline"
              variant="text"
              @click="openUploadDialog"
            >
              {{ $t('Common.upload') }}
            </v-btn>
          </div>
        </v-list>

        <v-divider />

        <v-list class="popover-menu-list">
          <div class="d-flex align-center px-2">
            <v-btn
              class="text-none justify-start"
              prepend-icon="mdi-cog-outline"
              variant="text"
              @click="goToAccount"
            >
              {{ $t('Account.account') }}
            </v-btn>
          </div>
          <div class="d-flex align-center px-2">
            <v-btn
              class="text-none justify-start"
              prepend-icon="mdi-help-circle-outline"
              variant="text"
            >
              {{ $t('Common.helpCenter') }}
            </v-btn>
          </div>
        </v-list>

        <v-divider />

        <!-- Logout -->
        <v-card-actions>
          <v-spacer />
          <v-btn
            class="text-uppercase"
            color="error"
            variant="text"
            @click="handleLogout"
          >
            <v-icon start>mdi-logout</v-icon>
            {{ $t("Common.logout") }}
          </v-btn>
        </v-card-actions>

      </v-card>
    </v-menu>

    <!-- Upload type selector dialog -->
    <UploadTypeDialog v-model="showUploadDialog" />
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { useTheme } from 'vuetify'
  import { logout } from '@/api/modules/auth.api'
  import UploadTypeDialog from '@/components/upload/UploadTypeDialog.vue'
  import { DEFAULT_DARK_THEME, DEFAULT_LIGHT_THEME } from '@/plugins/vuetify'
  import { broadcastAuthEvent } from '@/services/authBroadcast'
  import { clearToken } from '@/services/tokenWorkerClient'
  import { useAppStore } from '@/stores/app'
  import { useAuthStore } from '@/stores/auth'
  import { usePurchasesStore } from '@/stores/purchases'
  import { useTenantStore } from '@/stores/tenant'

  const menu = ref(false)
  const showUploadDialog = ref(false)

  const router = useRouter()
  const appStore = useAppStore()
  const authStore = useAuthStore()
  const tenantStore = useTenantStore()
  const theme = useTheme()

  // Computed: true if current theme is dark
  const isDarkMode = computed(() => theme.global.current.value.dark)

  function setTheme (name: string) {
    const maybeTheme = theme as unknown as { change?: (name: string) => void }
    if (typeof maybeTheme.change === 'function') {
      maybeTheme.change(name)
      return
    }
    theme.global.name.value = name
  }

  function toggleTheme () {
    // Mirror CxDarkLightMode: prefer the tenant owner's curated default for
    // the target mode so the storefront switches into the configured palette
    // instead of the hardcoded platform fallback. Only fall back to the
    // built-in defaults when the owner has not picked a per-tenant theme.
    const nextThemeName = isDarkMode.value
      ? (tenantStore.defaultLightTheme || DEFAULT_LIGHT_THEME)
      : (tenantStore.defaultDarkTheme || DEFAULT_DARK_THEME)
    appStore.setThemeName(nextThemeName)
    localStorage.setItem('themeName', nextThemeName)
    setTheme(nextThemeName)
  }

  function goToThemes () {
    menu.value = false
    router.push('/themes')
  }

  function goToCreatorStudio () {
    menu.value = false
    router.push('/creator-studio')
  }

  function openUploadDialog () {
    menu.value = false
    showUploadDialog.value = true
  }

  function goToAccount () {
    menu.value = false
    router.push('/account')
  }

  function goToProfile () {
    menu.value = false
    const name = authStore.user?.username
    if (name) {
      router.push(`/${name}`)
    }
  }

  async function handleLogout () {
    if (appStore.isAppLocked) return
    menu.value = false
    appStore.setIsAppLocked(true)

    try {
      await logout()
    } catch {
      // Ignore logout errors
    }

    await clearToken()
    usePurchasesStore().clearAll()
    broadcastAuthEvent('LOGOUT')
    window.location.assign('/')
  }

  // User profile from auth store
  const profileImageUrl = computed(() => authStore.user?.profileImageUrl ?? '')
  const username = computed(() => authStore.user?.username ? `@${authStore.user.username}` : '')
  const displayName = computed(() => authStore.user?.displayName ?? '')

  // Avatar with graceful degradation: when the X profile image is absent or
  // fails to load, avatarUrl becomes '' and the template shows the themed
  // account-icon fallback instead of an empty circle.
  const avatarFailed = ref(false)
  const avatarUrl = computed(() => (avatarFailed.value ? '' : profileImageUrl.value))
  // A fresh login / profile change re-arms the load attempt.
  watch(profileImageUrl, () => { avatarFailed.value = false })
</script>
