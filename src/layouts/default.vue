<template>
  <v-overlay
    class="d-flex align-center justify-center"
    :model-value="isAppLocked"
    opacity="0.7"
    persistent
    scrim="black"
  >
    <v-progress-circular color="white" indeterminate size="64" />
  </v-overlay>

  <template v-if="!isAppLocked">
    <AppBar />
    <v-main>
      <router-view />
    </v-main>
  </template>
</template>

<script lang="ts" setup>
  import { storeToRefs } from 'pinia'

  import { useAppStore } from '@/stores/app'

  import AppBar from './AppBar.vue'

  const appStore = useAppStore()
  const { isAppLocked } = storeToRefs(appStore)
</script>
