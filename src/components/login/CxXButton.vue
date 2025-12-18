<template>
  <v-btn
    block
    class="mt-3 btn-shadow"
    rel="noopener noreferrer"
    size="large"
    variant="outlined"
    @click="redirectToXLogin"
  >
    <img
      alt="Twitter / X"
      :src="xIconPath"
      style="height: 24px; width: 24px; margin-right: 8px;"
    >
    {{ $t("Common.login") }}
  </v-btn>
</template>

<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { computed } from 'vue'
  import xBlackIcon from '@/assets/twitterx-black.svg'

  import xIcon from '@/assets/twitterx.svg'
  import { apiUrl } from '@/config/env'
  import { useAppStore } from '@/stores/app'

  // Pinia store
  const appStore = useAppStore()
  const { isDarkTheme } = storeToRefs(appStore)

  const xIconPath = computed(() => (isDarkTheme.value ? xIcon : xBlackIcon))

  function redirectToXLogin (): void {
    localStorage.setItem('preLoginUrl', window.location.pathname)
    window.location.href = apiUrl('/oauth2/authorization/x')
  }
</script>

<style scoped>
.btn-shadow {
  box-shadow: 0px 0px 10px 0px #FFFFFF !important;
}
</style>
