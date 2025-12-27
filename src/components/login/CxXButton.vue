<template>
  <v-btn
    block
    class="mt-3 btn-shadow"
    rel="noopener noreferrer"
    size="large"
    variant="outlined"
    @click="redirectToXLogin"
  >
    <span class="x-icon" aria-label="Twitter / X" role="img" v-html="xIconSvg" />
    {{ $t("Common.login") }}
  </v-btn>
</template>

<script setup lang="ts">
  import xIcon from '@/assets/twitterx.svg?raw'
  import { apiUrl } from '@/config/env'

  const xIconSvg = xIcon

  function redirectToXLogin (): void {
    localStorage.setItem('preLoginUrl', window.location.pathname)
    window.location.href = apiUrl('/oauth2/authorization/x')
  }
</script>

<style scoped>
.btn-shadow {
  box-shadow: 0px 0px 10px 0px #FFFFFF !important;
}

.x-icon {
  display: inline-flex;
  width: 24px;
  height: 24px;
  margin-right: 8px;
  color: rgb(var(--v-theme-on-surface));
}

.x-icon :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
