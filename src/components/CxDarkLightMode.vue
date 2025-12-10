<template>
  <v-btn
    v-if="mobileView"
    @click="toggleTheme"
    class="my-2 mr-1"
    variant="text"
    icon="mdi-circle-half-full"
    size="small"
  />

  <v-btn
    v-else
    @click="toggleTheme"
    class="mr-2"
    variant="text"
    icon="mdi-circle-half-full"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from 'vuetify'
import { useAppStore } from '@/stores/app'
import { storeToRefs } from 'pinia'

const app = useAppStore()
const theme = useTheme()

const { mobileView, isDarkTheme } = storeToRefs(app)

const toggleTheme = () => {
  const newDarkMode = !isDarkTheme.value
  app.setDarkTheme(newDarkMode)
  localStorage.setItem('isDarkTheme', String(newDarkMode))
  theme.global.name.value = newDarkMode ? 'dark' : 'light'
}
</script>
