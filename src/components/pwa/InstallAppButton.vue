<!--
  InstallAppButton — "Install app" entry point for the PWA.

  Hardcoded copy for now (English, matching the app's default locale). Behaviour
  is driven by usePwaInstall():
    - Android / desktop Chromium → native install via the captured prompt.
    - Android without a captured prompt (already installed elsewhere, Samsung
      Internet, in-app webview, Custom Tab…) → manual instructions dialog.
      NEVER a "go install Chrome" hint — the prompt legitimately doesn't fire
      in many Android contexts even with Chrome installed.
    - iOS → manual "Add to Home Screen" instructions (with an extra caveat on
      iOS < 16.4).
    - Other desktop browsers → a custom hint (no install path available).
  Renders nothing when the app is already installed.
-->
<template>
  <div v-if="installState !== 'installed'" class="install-app-block">
    <!-- Android / desktop: native install prompt -->
    <v-btn
      v-if="installState === 'installable'"
      block
      class="text-none font-weight-bold"
      color="primary"
      prepend-icon="mdi-download"
      rounded="lg"
      size="large"
      @click="onNativeInstall"
    >
      Install app
    </v-btn>

    <!-- iOS: open manual instructions -->
    <v-btn
      v-else-if="installState === 'ios'"
      block
      class="text-none font-weight-bold"
      color="primary"
      prepend-icon="mdi-apple"
      rounded="lg"
      size="large"
      @click="openInstructions('ios')"
    >
      Install app
    </v-btn>

    <!-- Android without a native prompt: manual instructions -->
    <v-btn
      v-else-if="installState === 'android'"
      block
      class="text-none font-weight-bold"
      color="primary"
      prepend-icon="mdi-android"
      rounded="lg"
      size="large"
      @click="openInstructions('android')"
    >
      Install app
    </v-btn>

    <!-- Other browsers (desktop Firefox/Safari): no install path → custom hint -->
    <v-alert
      v-else
      density="comfortable"
      icon="mdi-cellphone-arrow-down"
      type="info"
      variant="tonal"
    >
      To install the app, open this site in <strong>Chrome</strong> or
      <strong>Edge</strong> and use “Install app”.
    </v-alert>

    <!-- Manual install instructions (shared with InstallAppBanner) -->
    <InstallInstructionsDialog
      v-model="showInstructions"
      :platform="instructionsPlatform"
    />

    <v-snackbar v-model="snackbar" color="success" :timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import InstallInstructionsDialog from '@/components/pwa/InstallInstructionsDialog.vue'
  import { usePwaInstall } from '@/lib/pwaInstall'

  const { installState, platform, promptInstall } = usePwaInstall()

  const showInstructions = ref(false)
  const instructionsPlatform = ref<'ios' | 'android'>('android')
  const snackbar = ref(false)
  const snackbarText = ref('')

  function openInstructions (p: 'ios' | 'android') {
    instructionsPlatform.value = p
    showInstructions.value = true
  }

  async function onNativeInstall () {
    const outcome = await promptInstall()
    if (outcome === 'accepted') {
      snackbarText.value = 'App installed'
      snackbar.value = true
    } else if (outcome === 'unavailable' && (platform.value === 'android' || platform.value === 'ios')) {
      // The captured prompt was consumed or never (re-)fired — don't leave a
      // dead button: fall back to the platform's manual instructions.
      openInstructions(platform.value)
    }
  }
</script>
