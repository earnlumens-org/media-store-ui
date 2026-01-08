<template>
  <v-app>
    <router-view />

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
  import { DEFAULT_DARK_THEME, DEFAULT_LIGHT_THEME } from '@/plugins/vuetify'
  import { useAppStore } from '@/stores/app'
  import { useAuthStore } from '@/stores/auth'

  const app = useAppStore()
  const authStore = useAuthStore()
  const theme = useTheme()

  // Login error dialog state
  const loginErrorDialog = ref(false)
  const loginErrorMessage = ref('')

  // Watch for auth errors from callback
  const authError = computed(() => authStore.error)

  watch(authError, (error) => {
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

  onBeforeUnmount(() => {
    window.removeEventListener('resize', updateWindowWidth)
  })
</script>
