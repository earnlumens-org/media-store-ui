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
      <!--
        H1 read-only mode: the tenant is BLOCKED. Buyers keep their library;
        purchases, tips and uploads are refused by the API (423). Persistent,
        not dismissible, on every page of the storefront.
      -->
      <v-alert
        v-if="tenantStore.isSuspended"
        class="rounded-0"
        density="comfortable"
        icon="mdi-store-off-outline"
        type="warning"
        variant="tonal"
      >
        <div class="text-subtitle-2">{{ t('StoreSuspended.title') }}</div>
        <div class="text-body-2">{{ t('StoreSuspended.body') }}</div>

        <template #append>
          <v-btn
            color="warning"
            size="small"
            to="/purchased"
            variant="flat"
          >
            {{ t('StoreSuspended.cta') }}
          </v-btn>
        </template>
      </v-alert>
      <router-view />

      <!--
        Legal footer (L3 / G4): Terms, Purchase terms (#purchases), Privacy
        and Guidelines reachable without a session on apex, subdomains and
        custom domains. Not `app`-positioned on purpose: it must not steal
        viewport from the feed or collide with the mobile bottom navigation.
      -->
      <footer class="legal-footer text-caption text-medium-emphasis text-center py-4 px-4">
        <router-link class="legal-footer__link" to="/terms">{{ t('Common.terms') }}</router-link>
        <span aria-hidden="true" class="mx-2">·</span>
        <router-link class="legal-footer__link" to="/terms#purchases">{{ t('Common.purchaseTerms') }}</router-link>
        <span aria-hidden="true" class="mx-2">·</span>
        <router-link class="legal-footer__link" to="/privacy">{{ t('Common.privacy') }}</router-link>
        <span aria-hidden="true" class="mx-2">·</span>
        <router-link class="legal-footer__link" to="/guidelines">{{ t('Common.guidelines') }}</router-link>
      </footer>
    </v-main>
  </template>
</template>

<script lang="ts" setup>
  import { storeToRefs } from 'pinia'
  import { useI18n } from 'vue-i18n'

  import { useAppStore } from '@/stores/app'
  import { useTenantStore } from '@/stores/tenant'

  import AppBar from './AppBar.vue'

  const { t } = useI18n()
  const appStore = useAppStore()
  const tenantStore = useTenantStore()
  const { isAppLocked } = storeToRefs(appStore)
</script>

<style scoped>
.legal-footer__link {
  color: inherit;
  text-decoration: none;
}

.legal-footer__link:hover {
  text-decoration: underline;
}
</style>
