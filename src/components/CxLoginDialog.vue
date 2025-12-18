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
            This site is under development. To be notified when it's ready, join the
            <span class="text-primary text-decoration-none cursor-pointer" style="cursor: pointer;" @click="goToWaitlist">
              waitlist
            </span>
          </p>
        </v-card-text>
      </v-card>
    </div>
  </v-dialog>
</template>

<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import CxXButton from '@/components/login/CxXButton.vue'
  import { useAppStore } from '@/stores/app'

  const router = useRouter()
  const appStore = useAppStore()
  const { mobileView } = storeToRefs(appStore)

  const dialog = ref(false)

  function closeDialog () {
    dialog.value = false
  }

  function goToWaitlist () {
    dialog.value = false
    router.push('/waitlist')
  }

  function showDialog () {
    dialog.value = true
  }

  defineExpose({
    showDialog,
  })
</script>
