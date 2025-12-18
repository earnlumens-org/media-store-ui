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

  function updateWindowWidth () {
    app.updateWindowWidth(window.innerWidth)
  }

  function applyTheme () {
    const isDark = app.isDarkTheme
    theme.global.name.value = isDark ? 'dark' : 'light'
  }

  onMounted(() => {
    // Window width
    updateWindowWidth()
    window.addEventListener('resize', updateWindowWidth)

    // Theme from localStorage
    const storedTheme = localStorage.getItem('isDarkTheme')
    if (storedTheme !== null) {
      const isDark = storedTheme === 'true'
      app.setDarkTheme(isDark)
    }

    // Apply theme
    applyTheme()
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', updateWindowWidth)
  })
</script>
