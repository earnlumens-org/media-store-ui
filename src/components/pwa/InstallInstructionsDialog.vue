<!--
  InstallInstructionsDialog — shared manual install instructions for the PWA.

  Extracted from InstallAppButton so both the /account install button and the
  mobile install banner reuse the exact same iOS / Android flows. Copy is
  hardcoded English for now, matching InstallAppButton.
-->
<template>
  <v-dialog v-model="model" max-width="440">
    <!-- Android manual instructions -->
    <v-card v-if="platform === 'android'" rounded="lg">
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
        <v-btn variant="text" @click="model = false">Got it</v-btn>
      </v-card-actions>
    </v-card>

    <!-- iOS Add-to-Home-Screen instructions -->
    <v-card v-else rounded="lg">
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
        <v-btn variant="text" @click="model = false">Got it</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { usePwaInstall } from '@/lib/pwaInstall'

  defineProps<{
    /** Which platform's manual instructions to show. */
    platform: 'ios' | 'android'
  }>()

  const model = defineModel<boolean>({ default: false })

  const { iosVersion, iosSupported } = usePwaInstall()
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
