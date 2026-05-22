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
  import { DEFAULT_DARK_THEME, DEFAULT_LIGHT_THEME } from '@/plugins/vuetify'
  import { useAppStore } from '@/stores/app'
  import { useTenantStore } from '@/stores/tenant'

  const app = useAppStore()
  const tenantStore = useTenantStore()
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
    // Prefer the tenant owner's curated default for the target mode; fall
    // back to the platform-wide default when no override is configured.
    const nextThemeName = isCurrentlyDark
      ? (tenantStore.defaultLightTheme || DEFAULT_LIGHT_THEME)
      : (tenantStore.defaultDarkTheme || DEFAULT_DARK_THEME)
    app.setThemeName(nextThemeName)
    localStorage.setItem('themeName', nextThemeName)
    setTheme(nextThemeName)
  }
</script>
