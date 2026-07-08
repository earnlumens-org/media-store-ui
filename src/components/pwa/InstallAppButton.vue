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
      @click="showIosDialog = true"
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
      @click="showAndroidDialog = true"
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

    <!-- Android manual instructions -->
    <v-dialog v-model="showAndroidDialog" max-width="440">
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center text-h6">
          <v-icon class="me-2">mdi-android</v-icon>
          Install on Android
        </v-card-title>
        <v-card-text>
          <p class="mb-3">
            If the app is already installed, open it from your home screen or
            app drawer — there is nothing else to do.
          </p>
          <p class="mb-2">Otherwise, to install it:</p>
          <ol class="ios-steps">
            <li>
              Open the browser menu
              <v-icon class="mx-1" size="small">mdi-dots-vertical</v-icon>
              (in Samsung Internet, the
              <v-icon class="mx-1" size="small">mdi-menu</v-icon> menu).
            </li>
            <li>
              Choose <strong>“Add to Home screen”</strong> or
              <strong>“Install app”</strong>.
            </li>
            <li>Confirm with <strong>“Install”</strong> / <strong>“Add”</strong>.</li>
          </ol>
          <p class="mt-3 mb-0 text-medium-emphasis">
            If you opened this page from inside another app, use its menu to
            open the site in your browser first.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showAndroidDialog = false">Got it</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- iOS Add-to-Home-Screen instructions -->
    <v-dialog v-model="showIosDialog" max-width="440">
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center text-h6">
          <v-icon class="me-2">mdi-apple</v-icon>
          Install on iPhone / iPad
        </v-card-title>
        <v-card-text>
          <v-alert
            v-if="!iosSupported"
            class="mb-4"
            density="comfortable"
            type="warning"
            variant="tonal"
          >
            Your iOS version{{ iosVersion ? ` (${iosVersion})` : '' }} is older
            than 16.4. You can still add the app to your Home Screen, but sign-in
            and some features may not work reliably. Updating iOS is recommended.
          </v-alert>

          <ol class="ios-steps">
            <li>
              Tap the
              <v-icon class="mx-1" size="small">mdi-export-variant</v-icon>
              <strong>Share</strong> button in the browser toolbar.
            </li>
            <li>
              Scroll down and choose
              <strong>“Add to Home Screen”</strong>
              <v-icon class="mx-1" size="small">mdi-plus-box-outline</v-icon>.
            </li>
            <li>
              Tap <strong>“Add”</strong> in the top-right corner.
            </li>
          </ol>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showIosDialog = false">Got it</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" color="success" :timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { usePwaInstall } from '@/lib/pwaInstall'

  const { installState, platform, iosVersion, iosSupported, promptInstall } = usePwaInstall()

  const showIosDialog = ref(false)
  const showAndroidDialog = ref(false)
  const snackbar = ref(false)
  const snackbarText = ref('')

  async function onNativeInstall () {
    const outcome = await promptInstall()
    if (outcome === 'accepted') {
      snackbarText.value = 'App installed'
      snackbar.value = true
    } else if (outcome === 'unavailable') {
      // The captured prompt was consumed or never (re-)fired — don't leave a
      // dead button: fall back to the platform's manual instructions.
      if (platform.value === 'android') {
        showAndroidDialog.value = true
      } else if (platform.value === 'ios') {
        showIosDialog.value = true
      }
    }
  }
</script>

<style scoped>
.ios-steps {
  padding-left: 1.25rem;
  margin: 0;
}

.ios-steps li {
  margin-bottom: 0.75rem;
  line-height: 1.5;
}

.ios-steps li:last-child {
  margin-bottom: 0;
}
</style>
