<template>
  <v-btn
    v-if="mobileView"
    class="my-2 mr-1"
    icon="mdi-circle-half-full"
    size="small"
    variant="text"
    @click="toggleTheme"
  />

  <v-btn
    v-else
    class="mr-2"
    icon="mdi-circle-half-full"
    variant="text"
    @click="toggleTheme"
  />
</template>

<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { useTheme } from 'vuetify'
  import { useAppStore } from '@/stores/app'

  const app = useAppStore()
  const theme = useTheme()

  const { mobileView } = storeToRefs(app)

  function setTheme (name: string) {
    const maybeTheme = theme as unknown as { change?: (name: string) => void }
    if (typeof maybeTheme.change === 'function') {
      maybeTheme.change(name)
      return
    }

    theme.global.name.value = name
  }

  function toggleTheme () {
    const isCurrentlyDark = theme.global.current.value.dark
    const nextThemeName = isCurrentlyDark ? 'light' : 'dark'
    app.setThemeName(nextThemeName)
    localStorage.setItem('themeName', nextThemeName)
    setTheme(nextThemeName)
  }
</script>
