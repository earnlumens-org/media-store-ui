<template>
  <v-dialog v-model="dialog" scrollable width="640" @click:outside="closeDialog">
    <template #activator="{ props }">
      <v-btn
        v-if="mobileView"
        v-bind="props"
        class="ma-2"
        color="primary"
        icon="mdi-login"
        size="small"
        variant="outlined"
      />

      <v-btn
        v-else
        v-bind="props"
        class="ma-2"
        color="primary"
        prepend-icon="mdi-login"
        variant="outlined"
      >
        {{ $t("Common.login") }}
      </v-btn>
    </template>

    <div>
      <v-card class="mx-auto pa-8 pb-14" elevation="8" max-width="480" rounded="lg">
        <v-btn
          icon="mdi-close"
          size="small"
          style="position: absolute; right: 8px; top: 8px;"
          variant="text"
          @click="closeDialog"
        />

        <v-card-title class="text-h6 text-md-h5 text-lg-h4">
          {{ $t("Common.login") }}
        </v-card-title>

        <CxXButton />

        <v-card-text class="text-center">
          <p class="text-disabled text-caption">
            <i18n-t keypath="Common.loginAcceptTerms" scope="global" tag="span">
              <template #terms>
                <router-link
                  class="text-primary text-decoration-none"
                  to="/terms"
                  @click="closeDialog"
                >
                  {{ $t('Common.terms') }}
                </router-link>
              </template>
              <template #privacy>
                <router-link
                  class="text-primary text-decoration-none"
                  to="/privacy"
                  @click="closeDialog"
                >
                  {{ $t('Common.privacy') }}
                </router-link>
              </template>
            </i18n-t>
          </p>
        </v-card-text>
      </v-card>
    </div>
  </v-dialog>
</template>

<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { ref, watch } from 'vue'
  import CxXButton from '@/components/login/CxXButton.vue'
  import { useAppStore } from '@/stores/app'

  const appStore = useAppStore()
  const { mobileView } = storeToRefs(appStore)

  const dialog = ref(false)

  // Allow any component to open the login dialog via appStore.openLoginDialog()
  watch(() => appStore.loginDialogOpen, open => {
    if (open) {
      dialog.value = true
      appStore.closeLoginDialog()
    }
  })

  function closeDialog () {
    dialog.value = false
  }

  function showDialog () {
    dialog.value = true
  }

  defineExpose({
    showDialog,
  })
</script>
