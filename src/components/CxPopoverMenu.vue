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
          class="ma-1"
          icon
          variant="text"
        >
          <v-avatar size="40">
            <v-img :src="profileImageUrl" />
          </v-avatar>
        </v-btn>
      </template>

      <!-- Contenido del Popover -->
      <v-card min-width="300">

        <!-- Perfil -->
        <v-list>
          <v-list-item
            :prepend-avatar="profileImageUrl"
            :subtitle="username"
            :title="displayName"
          />
        </v-list>

        <v-divider />

        <!-- Opciones -->
        <v-list>
          <!-- Switch de tema -->
          <v-list-item>
            <v-switch
              color="amber-lighten-1"
              hide-details
              label="Dark Mode"
              :model-value="isDarkMode"
              @update:model-value="toggleTheme"
            />
          </v-list-item>

          <v-list-item>
            <v-btn
              color="primary"
              variant="text"
              @click="goToThemes"
            >
              + Themes
            </v-btn>
          </v-list-item>

          <!-- Botón subir video (mock) -->
          <v-list-item>
            <v-btn
              color="primary"
              variant="text"
            >
              <v-icon class="me-2">mdi-cloud-upload-outline</v-icon>
              {{ $t("Common.upload") }}
            </v-btn>
          </v-list-item>
        </v-list>

        <v-divider />

        <!-- Logout -->
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            variant="text"
            @click="handleLogout"
          >
            {{ $t("Common.logout") }}
          </v-btn>
        </v-card-actions>

      </v-card>
    </v-menu>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useTheme } from 'vuetify'
  import { logout } from '@/api/modules/auth.api'
  import { DEFAULT_DARK_THEME, DEFAULT_LIGHT_THEME } from '@/plugins/vuetify'
  import { broadcastAuthEvent } from '@/services/authBroadcast'
  import { clearToken } from '@/services/tokenWorkerClient'
  import { useAppStore } from '@/stores/app'
  import { useAuthStore } from '@/stores/auth'

  const menu = ref(false)

  const router = useRouter()
  const appStore = useAppStore()
  const authStore = useAuthStore()
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
    const nextThemeName = isDarkMode.value ? DEFAULT_LIGHT_THEME : DEFAULT_DARK_THEME
    appStore.setThemeName(nextThemeName)
    localStorage.setItem('themeName', nextThemeName)
    setTheme(nextThemeName)
  }

  function goToThemes () {
    menu.value = false
    router.push('/themes')
  }

  async function handleLogout () {
    // Prevent re-entrancy (double-click) and show global loading overlay
    if (appStore.isAppLocked) return

    menu.value = false
    appStore.setIsAppLocked(true)

    const watchdog = window.setTimeout(() => {
      appStore.setIsAppLocked(false)
    }, 20_000)

    try {
      try {
        await logout()
      } catch {
        // Backend call failed, but continue cleaning local state
      }

      await clearToken()
      authStore.clearAuth()

      // Notify other tabs about logout
      broadcastAuthEvent('LOGOUT')

      await router.push('/')
    } finally {
      window.clearTimeout(watchdog)
      appStore.setIsAppLocked(false)
    }
  }

  // User profile from auth store
  const profileImageUrl = computed(() => authStore.user?.profileImageUrl ?? '')
  const username = computed(() => authStore.user?.username ? `@${authStore.user.username}` : '')
  const displayName = computed(() => authStore.user?.displayName ?? '')
</script>
