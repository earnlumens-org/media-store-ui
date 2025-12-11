<template>
  <v-dialog v-model="dialog" width="640" scrollable @click:outside="closeDialog">
    <template v-slot:activator="{ props }">
      <v-btn
        v-if="mobileView"
        v-bind="props"
        class="ma-2"
        icon="mdi-login"
        variant="outlined"
        color="primary"
        size="small"
      >
      </v-btn>

      <v-btn
        v-else
        v-bind="props"
        class="ma-2"
        prepend-icon="mdi-login"
        variant="outlined"
        color="primary"
      >
        {{ $t("Common.login") }}
      </v-btn>
    </template>

    <div>
      <v-card class="mx-auto pa-8 pb-14" elevation="8" max-width="480" rounded="lg">
        <v-btn
          icon="mdi-close"
          size="small"
          variant="text"
          @click="closeDialog"
          style="position: absolute; right: 8px; top: 8px;"
        ></v-btn>

        <v-card-title class="text-h6 text-md-h5 text-lg-h4">
          {{ $t("Common.login") }}
        </v-card-title>

        <CxXButton />

        <v-card-text class="text-center">
          <p class="text-disabled text-caption">
            This site is under development. To be notified when it's ready, join the
            <span class="text-primary text-decoration-none cursor-pointer" @click="goToWaitlist" style="cursor: pointer;">
              waitlist
            </span>
          </p>
        </v-card-text>
      </v-card>
    </div>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app'
import CxXButton from '@/components/login/CxXButton.vue'

const router = useRouter()
const appStore = useAppStore()
const { mobileView } = storeToRefs(appStore)

const dialog = ref(false)

function closeDialog() {
  dialog.value = false
}

function goToWaitlist() {
  dialog.value = false
  router.push('/waitlist')
}

function showDialog() {
  dialog.value = true
}

defineExpose({
  showDialog
})
</script>
