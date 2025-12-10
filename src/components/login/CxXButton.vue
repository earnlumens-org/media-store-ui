<template>
  <v-btn 
    block
    rel="noopener noreferrer"
    variant="outlined"
    class="mt-3 btn-shadow"
    size="large"
    @click="redirectToXLogin"
  >
    <img
      :src="xIconPath"
      alt="Twitter / X"
      style="height: 24px; width: 24px; margin-right: 8px;"
    />
    {{ $t("Common.login") }}
  </v-btn>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { storeToRefs } from 'pinia'

import xIcon from '@/assets/twitterx.svg'
import xBlackIcon from '@/assets/twitterx-black.svg'

// Pinia store
const appStore = useAppStore()
const { isDarkTheme } = storeToRefs(appStore)

const xIconPath = computed(() => (isDarkTheme.value ? xIcon : xBlackIcon))

const redirectToXLogin = (): void => {
  localStorage.setItem('preLoginUrl', window.location.pathname)
  const hostname = window.location.hostname

  if (hostname === 'www.earnlumens.org' || hostname === 'earnlumens.org') {
    window.location.href = 'https://api.earnlumens.org/oauth2/authorization/x'
  } else {
    window.location.href = 'http://localhost.dv:852/oauth2/authorization/x'
  }
}
</script>

<style scoped>
.btn-shadow {
  box-shadow: 0px 0px 10px 0px #FFFFFF !important;
}
</style>
