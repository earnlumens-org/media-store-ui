<!--
  InstallAppBanner — mobile-only floating "install the app" card (VidrieraTDF
  style): icon tile + title/subtitle + Install CTA + close.

  Visibility rules:
    - Mobile platforms only (android / ios) — never desktop.
    - Hidden when running as an installed PWA (standalone display-mode) or
      when the installed app was detected (installState === 'installed').
    - Dismissed (in-memory only) when the user closes it or on the first
      route path change, so it only ever reappears after a full page reload.

  Install flow mirrors InstallAppButton (/account): native prompt when one
  was captured; otherwise the platform's manual-instructions dialog.
-->
<template>
  <v-slide-y-reverse-transition>
    <v-card
      v-if="visible"
      class="install-app-banner"
      elevation="8"
      rounded="xl"
    >
      <div class="d-flex align-center pa-3 ga-3">
        <v-avatar color="primary" rounded="lg" size="48">
          <v-icon icon="mdi-cellphone-arrow-down" size="26" />
        </v-avatar>

        <div class="flex-grow-1 overflow-hidden">
          <div class="text-subtitle-2 font-weight-bold text-truncate">
            {{ $t('Common.installBannerTitle', { name: brandName }) }}
          </div>
          <div class="text-caption text-medium-emphasis text-truncate">
            {{ $t('Common.installBannerSubtitle') }}
          </div>
        </div>

        <v-btn
          class="text-none font-weight-bold flex-shrink-0"
          color="primary"
          prepend-icon="mdi-download"
          rounded="pill"
          size="small"
          @click="onInstall"
        >
          {{ $t('Common.installBannerCta') }}
        </v-btn>

        <v-btn
          :aria-label="$t('Common.close')"
          density="comfortable"
          icon="mdi-close"
          size="small"
          variant="text"
          @click="dismissed = true"
        />
      </div>
    </v-card>
  </v-slide-y-reverse-transition>

  <InstallInstructionsDialog
    v-model="showInstructions"
    :platform="instructionsPlatform"
  />
</template>

<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import InstallInstructionsDialog from '@/components/pwa/InstallInstructionsDialog.vue'
  import { usePwaInstall } from '@/lib/pwaInstall'
  import { useTenantStore } from '@/stores/tenant'

  const { installState, platform, isStandalone, promptInstall } = usePwaInstall()
  const tenantStore = useTenantStore()
  const route = useRoute()
  const router = useRouter()

  /**
   * In-memory only, on purpose: closing the banner or navigating hides it for
   * the rest of the session, and only a full reload brings it back.
   */
  const dismissed = ref(false)

  const showInstructions = ref(false)
  const instructionsPlatform = ref<'ios' | 'android'>('android')

  const brandName = computed(() => tenantStore.brandText || 'EarnLumens')

  const visible = computed(() =>
    !dismissed.value
    && !isStandalone.value
    && installState.value !== 'installed'
    && (platform.value === 'android' || platform.value === 'ios'),
  )

  // Dismiss on the first route *path* change after the initial navigation
  // settles (query/hash tweaks on the same page don't count as leaving it).
  onMounted(async () => {
    await router.isReady()
    const initialPath = route.path
    const stop = watch(() => route.path, path => {
      if (path !== initialPath) {
        dismissed.value = true
        stop()
      }
    })
  })

  function openInstructions (p: 'ios' | 'android') {
    instructionsPlatform.value = p
    showInstructions.value = true
  }

  async function onInstall () {
    if (installState.value === 'installable') {
      const outcome = await promptInstall()
      if (outcome === 'accepted') {
        dismissed.value = true
      } else if (outcome === 'unavailable') {
        // Captured prompt consumed / never re-fired — never a dead button.
        openInstructions(platform.value === 'ios' ? 'ios' : 'android')
      }
      return
    }
    if (installState.value === 'ios' || installState.value === 'android') {
      openInstructions(installState.value)
    }
  }
</script>

<style scoped>
.install-app-banner {
  position: fixed;
  inset-inline: 12px;
  bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  z-index: 2000;
  margin-inline: auto;
  max-width: 480px;
}
</style>
