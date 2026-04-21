<template>
  <v-dialog
    v-model="dialog"
    :fullscreen="appStore.mobileView"
    :max-width="appStore.mobileView ? undefined : 480"
    persistent
    scrollable
  >
    <v-card class="verification-card mx-auto" rounded="xl">
      <!-- Glow accent -->
      <div class="card-glow" />

      <v-card-text class="pa-6 pa-sm-8">
        <!-- ─────────── INTRO STATE ─────────── -->
        <template v-if="step === 'intro'">
          <div class="d-flex justify-center mb-5">
            <div class="badge-circle">
              <v-img
                height="48"
                :src="blueBadge"
                width="48"
              />
            </div>
          </div>

          <h2 class="text-h6 text-sm-h5 font-weight-bold text-center mb-6">
            {{ $t('Verification.title') }}
          </h2>

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

          <v-btn
            block
            class="mt-8 text-none font-weight-bold"
            color="primary"
            rounded="lg"
            size="x-large"
            @click="onPrimaryCta"
          >
            {{ authStore.isAuthenticated ? $t('Verification.getAccess') : $t('Verification.getAccess') }}
          </v-btn>
        </template>

        <!-- ─────────── CLAIM (irreversible) STATE ─────────── -->
        <template v-else-if="step === 'claim'">
          <div class="d-flex justify-center mb-5">
            <div class="badge-circle">
              <v-img
                height="48"
                :src="blueBadge"
                width="48"
              />
            </div>
          </div>

          <h2 class="text-h6 text-sm-h5 font-weight-bold text-center mb-2">
            {{ $t('Verification.claimTitle') }}
          </h2>
          <p class="text-body-2 text-medium-emphasis text-center mb-4">
            {{ $t('Verification.claimSubtitle') }}
          </p>

          <v-alert
            class="mb-4"
            color="info"
            density="compact"
            icon="mdi-clock-outline"
            variant="tonal"
          >
            {{ $t('Verification.claimDuration') }}
          </v-alert>

          <v-alert
            class="mb-4"
            color="warning"
            density="compact"
            icon="mdi-alert-circle-outline"
            variant="tonal"
          >
            {{ $t('Verification.claimIrreversible') }}
          </v-alert>

          <v-checkbox
            v-model="confirmed"
            color="primary"
            density="compact"
            hide-details
          >
            <template #label>
              <span class="text-body-2">{{ $t('Verification.claimConfirm') }}</span>
            </template>
          </v-checkbox>

          <v-alert
            v-if="errorMessage"
            class="mt-4"
            color="error"
            density="compact"
            variant="tonal"
          >
            {{ errorMessage }}
          </v-alert>

          <div class="d-flex flex-column flex-sm-row gap-2 mt-6">
            <v-btn
              class="text-none flex-grow-1"
              :disabled="claiming"
              rounded="lg"
              variant="text"
              @click="close"
            >
              {{ $t('Verification.close') }}
            </v-btn>
            <v-btn
              class="text-none font-weight-bold flex-grow-1"
              color="primary"
              :disabled="!confirmed || claiming"
              :loading="claiming"
              rounded="lg"
              size="large"
              @click="onClaim"
            >
              {{ claiming ? $t('Verification.claiming') : $t('Verification.claimButton') }}
            </v-btn>
          </div>
        </template>

        <!-- ─────────── SUCCESS STATE ─────────── -->
        <template v-else-if="step === 'success'">
          <div class="d-flex justify-center mb-5">
            <div class="badge-circle badge-circle--success">
              <v-icon color="success" size="56">mdi-check-circle</v-icon>
            </div>
          </div>

          <h2 class="text-h6 text-sm-h5 font-weight-bold text-center mb-3">
            {{ $t('Verification.claimSuccessTitle') }}
          </h2>
          <p class="text-body-2 text-medium-emphasis text-center mb-2">
            {{ $t('Verification.claimSuccessMessage') }}
          </p>

          <v-btn
            block
            class="mt-6 text-none font-weight-bold"
            color="primary"
            rounded="lg"
            size="x-large"
            @click="close"
          >
            {{ $t('Verification.done') }}
          </v-btn>
        </template>

        <!-- ─────────── ALREADY CLAIMED STATE ─────────── -->
        <template v-else-if="step === 'alreadyClaimed'">
          <div class="d-flex justify-center mb-5">
            <div class="badge-circle">
              <v-img
                height="48"
                :src="blueBadge"
                width="48"
              />
            </div>
          </div>

          <h2 class="text-h6 text-sm-h5 font-weight-bold text-center mb-3">
            {{ $t('Verification.alreadyClaimedTitle') }}
          </h2>
          <p class="text-body-2 text-medium-emphasis text-center mb-2">
            {{ $t('Verification.alreadyClaimedMessage') }}
          </p>

          <v-btn
            block
            class="mt-6 text-none font-weight-bold"
            color="primary"
            rounded="lg"
            size="x-large"
            @click="close"
          >
            {{ $t('Verification.done') }}
          </v-btn>
        </template>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'

  import { api, ApiError } from '@/api/api'
  import blueBadge from '@/assets/profileBadge/u1-blue-verified-badge.svg'
  import { useAppStore } from '@/stores/app'
  import { useAuthStore } from '@/stores/auth'

  type Step = 'intro' | 'claim' | 'success' | 'alreadyClaimed'

  const dialog = defineModel<boolean>({ default: false })
  const emit = defineEmits<{ claimed: [] }>()

  const { t } = useI18n()
  const appStore = useAppStore()
  const authStore = useAuthStore()

  const step = ref<Step>('intro')
  const confirmed = ref(false)
  const claiming = ref(false)
  const errorMessage = ref<string | null>(null)

  const features = computed(() => [
    { icon: 'mdi-store-outline', text: t('Verification.launchStore') },
    { icon: 'mdi-check-decagram', text: t('Verification.verifiedBadge') },
    { icon: 'mdi-forum-outline', text: t('Verification.postCommunity') },
    { icon: 'mdi-star-outline', text: t('Verification.featuredCreator') },
    { icon: 'mdi-chart-line', text: t('Verification.storeAnalytics') },
  ])

  // Reset internal state every time the dialog opens
  watch(dialog, isOpen => {
    if (!isOpen) return
    step.value = 'intro'
    confirmed.value = false
    claiming.value = false
    errorMessage.value = null
  })

  function onPrimaryCta () {
    if (!authStore.isAuthenticated) {
      // Anonymous visitor: close & open login. Account.vue can re-open
      // this dialog after login if needed.
      dialog.value = false
      appStore.openLoginDialog()
      return
    }
    step.value = 'claim'
  }

  async function onClaim () {
    if (!confirmed.value || claiming.value) return
    claiming.value = true
    errorMessage.value = null

    try {
      const assignment = await api.badges.claim()
      // Reflect new badge instantly across the app (author cards, profile…)
      const badgeKey = (assignment.badgeType || '').toLowerCase()
      if (badgeKey === 'u1' || badgeKey === 'u2') {
        authStore.setBadge(badgeKey)
      }
      step.value = 'success'
      emit('claimed')
    } catch (error_) {
      if (error_ instanceof ApiError && error_.status === 409) {
        // Server says badge already claimed — also notify so Account refreshes.
        step.value = 'alreadyClaimed'
        emit('claimed')
        return
      }
      errorMessage.value = t('Verification.claimError')
    } finally {
      claiming.value = false
    }
  }

  function close () {
    dialog.value = false
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

.badge-circle--success {
  background: radial-gradient(
    circle,
    rgba(76, 175, 80, 0.15) 0%,
    rgba(76, 175, 80, 0.04) 100%
  );
  border-color: rgba(76, 175, 80, 0.35);
}

.feature-list :deep(.v-list-item__prepend) {
  align-self: start;
  padding-top: 2px;
}

.feature-icon {
  flex-shrink: 0;
}

.gap-2 {
  gap: 8px;
}
</style>
