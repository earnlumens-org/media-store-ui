<template>
  <v-app>
    <router-view />
  </v-app>
</template>

<script setup lang="ts">
  import { onBeforeUnmount, onMounted } from 'vue'
  import { useTheme } from 'vuetify'
  import { useAppStore } from '@/stores/app'

  const app = useAppStore()
  const theme = useTheme()

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
        const migratedThemeName = isDark ? 'dark' : 'light'
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
