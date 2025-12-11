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
import { useAppStore } from '@/stores/app'
import { storeToRefs } from 'pinia'

// COMPONENTES
import CxLanguageDialog from '@/components/CxLanguageDialog.vue'
import CxDarkLightMode from '@/components/CxDarkLightMode.vue'
import CxXLoginButton from '@/components/login/CxXButton.vue'
import CxSearchDialog from '@/components/CxSearchDialog.vue'
import CxPopoverMenu from '@/components/CxPopoverMenu.vue'
import CxLoginDialog from '@/components/CxLoginDialog.vue'

const appStore = useAppStore()
const { windowWidth } = storeToRefs(appStore)
</script>

<route lang="yaml">
path: /
</route>
