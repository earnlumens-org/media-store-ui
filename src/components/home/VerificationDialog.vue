<template>
  <v-dialog
    v-model="dialog"
    :max-width="480"
    scrollable
  >
    <v-card class="verification-card mx-auto" rounded="xl">
      <!-- Glow accent -->
      <div class="card-glow" />

      <v-card-text class="pa-6 pa-sm-8">
        <!-- Badge icon -->
        <div class="d-flex justify-center mb-5">
          <div class="badge-circle">
            <v-img
              height="48"
              :src="blueBadge"
              width="48"
            />
          </div>
        </div>

        <!-- Title -->
        <h2 class="text-h6 text-sm-h5 font-weight-bold text-center mb-6">
          {{ $t('Verification.title') }}
        </h2>

        <!-- Feature list -->
        <v-list bg-color="transparent" class="feature-list pa-0" density="compact">
          <v-list-item
            v-for="(feature, i) in features"
            :key="i"
            class="px-0 mb-1"
          >
            <template #prepend>
              <v-icon
                class="me-3 feature-icon"
                color="primary"
                :icon="feature.icon"
                size="22"
              />
            </template>
            <v-list-item-title class="text-body-1 text-wrap">
              {{ feature.text }}
            </v-list-item-title>
          </v-list-item>
        </v-list>

        <!-- CTA button -->
        <v-btn
          block
          class="mt-8 text-none font-weight-bold"
          color="primary"
          :loading="navigating"
          rounded="lg"
          size="x-large"
          @click="onGetAccess"
        >
          {{ $t('Verification.getAccess') }}
        </v-btn>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'

  import blueBadge from '@/assets/profileBadge/u1-blue-verified-badge.svg'
  import { useAppStore } from '@/stores/app'
  import { useAuthStore } from '@/stores/auth'

  const dialog = defineModel<boolean>({ default: false })

  const { t } = useI18n()
  const router = useRouter()
  const appStore = useAppStore()
  const authStore = useAuthStore()

  const navigating = ref(false)

  const features = computed(() => [
    { icon: 'mdi-store-outline', text: t('Verification.launchStore') },
    { icon: 'mdi-check-decagram', text: t('Verification.verifiedBadge') },
    { icon: 'mdi-forum-outline', text: t('Verification.postCommunity') },
    { icon: 'mdi-star-outline', text: t('Verification.featuredCreator') },
    { icon: 'mdi-chart-line', text: t('Verification.storeAnalytics') },
  ])

  async function onGetAccess () {
    if (!authStore.isAuthenticated) {
      dialog.value = false
      appStore.openLoginDialog()
      return
    }

    navigating.value = true
    try {
      await router.push('/waitlist')
      dialog.value = false
    } finally {
      navigating.value = false
    }
  }
</script>

<style scoped>
.verification-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-primary), 0.25);
}

.card-glow {
  position: absolute;
  top: -60%;
  left: 50%;
  transform: translateX(-50%);
  width: 120%;
  height: 80%;
  background: radial-gradient(
    ellipse at center,
    rgba(var(--v-theme-primary), 0.12) 0%,
    transparent 70%
  );
  pointer-events: none;
}

.badge-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(
    circle,
    rgba(29, 155, 240, 0.15) 0%,
    rgba(29, 155, 240, 0.04) 100%
  );
  border: 2px solid rgba(29, 155, 240, 0.3);
}

.feature-list :deep(.v-list-item__prepend) {
  align-self: start;
  padding-top: 2px;
}

.feature-icon {
  flex-shrink: 0;
}
</style>
