<template>
  <div>welcome to earnlumens</div>

  <div>Window width: {{ windowWidth }}</div>

  <div>{{ $t("Common.shortAbout") }}</div>

  <!-- Selector de idioma -->
  <CxLanguageDialog />

  <!-- Buscador -->
  <CxSearchDialog />

  <!-- Botón claro/oscuro -->
  <CxDarkLightMode class="mt-2" />

  <!-- Botón de login con X -->
  <CxXLoginButton class="mt-4" />

  <!-- Diálogo de login -->
  <CxLoginDialog />

  <!-- Menu de perfil -->
  <CxPopoverMenu />
</template>

<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import CxDarkLightMode from '@/components/CxDarkLightMode.vue'

  // COMPONENTES
  import CxLanguageDialog from '@/components/CxLanguageDialog.vue'
  import CxLoginDialog from '@/components/CxLoginDialog.vue'
  import CxPopoverMenu from '@/components/CxPopoverMenu.vue'
  import CxSearchDialog from '@/components/CxSearchDialog.vue'
  import CxXLoginButton from '@/components/login/CxXButton.vue'
  import { useAppStore } from '@/stores/app'

  const appStore = useAppStore()
  const { windowWidth } = storeToRefs(appStore)
</script>

<route lang="yaml">
path: /
</route>
