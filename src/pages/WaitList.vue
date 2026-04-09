<template>
  <v-container class="waitlist-page" fluid>
    <v-row class="justify-center">
      <v-col cols="12" md="8" lg="6" xl="5">

        <!-- Loading state while checking badge -->
        <div v-if="checking" class="text-center mt-16">
          <v-progress-circular color="primary" indeterminate size="48" />
        </div>

        <!-- Already-joined state -->
        <template v-else-if="alreadyJoined">
          <div class="text-center mt-6 mt-md-12 mb-8">
            <div class="badge-circle mx-auto mb-6">
              <v-img
                height="48"
                :src="blueBadgeSvg"
                width="48"
              />
            </div>

            <h1 class="text-h4 text-md-h3 font-weight-bold mb-4">
              {{ $t('WaitList.alreadyJoinedTitle') }}
            </h1>

            <p class="text-body-1 text-medium-emphasis mx-auto mb-8" style="max-width: 480px">
              {{ $t('WaitList.alreadyJoinedMessage') }}
            </p>

            <v-btn
              class="text-none font-weight-bold px-8"
              color="primary"
              rounded="lg"
              size="x-large"
              to="/"
            >
              <v-icon class="me-2">mdi-home</v-icon>
              {{ $t('WaitList.goHome') }}
            </v-btn>
          </div>

          <!-- Chart still visible -->
          <div v-if="showChart && labels.length" class="mt-10 mt-md-14 mb-6">
            <CxLineChartCard
              dataset-label="users"
              :height="300"
              :labels="labels"
              :title="$t('WaitList.waitlistGrowth')"
              :total="total"
              :total-label="$t('WaitList.totalUsersOnWaitlist')"
              :values="values"
            />
          </div>
        </template>

        <!-- Normal sign-up form -->
        <template v-else>
        <!-- Hero: badge icon + clear title -->
        <div class="text-center mt-6 mt-md-12 mb-6">
          <div class="badge-circle mx-auto mb-6">
            <v-img
              height="48"
              :src="blueBadgeSvg"
              width="48"
            />
          </div>

          <h1 class="text-h4 text-md-h3 font-weight-bold mb-4">
            {{ $t('WaitList.title') }}
          </h1>

          <p class="text-body-1 text-medium-emphasis mx-auto" style="max-width: 500px">
            {{ $t('WaitList.enterEmailMessage') }}
          </p>
        </div>

        <!-- What you get — 2 clear steps -->
        <div class="mx-auto mb-6" style="max-width: 520px">
          <div class="d-flex align-start mb-3">
            <v-icon class="me-3 mt-1 flex-shrink-0" color="success" size="22">mdi-check-circle</v-icon>
            <span class="text-body-1">{{ $t('WaitList.stepBadge') }}</span>
          </div>
          <div class="d-flex align-start">
            <v-icon class="me-3 mt-1 flex-shrink-0" color="success" size="22">mdi-check-circle</v-icon>
            <span class="text-body-1">{{ $t('WaitList.stepNotify') }}</span>
          </div>
        </div>

        <!-- Form Card -->
        <v-card class="mx-auto pa-6 pa-md-8" max-width="520" rounded="xl" variant="outlined">
          <v-text-field
            v-model="email"
            class="mb-2"
            :disabled="isLoading"
            hide-details="auto"
            :label="$t('Common.email')"
            prepend-inner-icon="mdi-email-outline"
            :rules="emailRules"
            type="email"
            variant="outlined"
          />

          <v-btn
            v-if="!responseOk"
            block
            class="mt-4 text-none font-weight-bold"
            color="primary"
            :disabled="!formIsValid || isLoading"
            :loading="isLoading"
            rounded="lg"
            size="x-large"
            @click="joinClicked"
          >
            {{ $t('WaitList.getAccess') }}
            <v-icon class="ms-2">mdi-check-decagram</v-icon>
          </v-btn>

          <v-btn
            v-else
            block
            class="mt-4 text-none font-weight-bold"
            color="success"
            rounded="lg"
            size="x-large"
            @click="closeDialog"
          >
            <v-icon class="me-2">mdi-check-circle</v-icon>
            {{ $t('Common.close') }}
          </v-btn>

          <!-- Status Messages -->
          <v-fade-transition>
            <v-alert
              v-if="sendingRequest"
              class="mt-4"
              color="warning"
              density="compact"
              icon="mdi-timer-sand"
              rounded="lg"
              variant="tonal"
            >
              {{ $t('Common.pleaseWait') }}
            </v-alert>
          </v-fade-transition>

          <v-fade-transition>
            <v-alert
              v-if="responseOk"
              class="mt-4"
              color="success"
              density="compact"
              icon="mdi-check-circle"
              rounded="lg"
              variant="tonal"
            >
              {{ $t('WaitList.registeredEmailWeWillKeepYouInformed') }}
            </v-alert>
          </v-fade-transition>

          <v-fade-transition>
            <v-alert
              v-if="responseError"
              class="mt-4"
              color="error"
              density="compact"
              icon="mdi-alert-circle"
              rounded="lg"
              variant="tonal"
            >
              {{ $t('Common.operationFailedPleaseTryAgain') }}
            </v-alert>
          </v-fade-transition>

          <VueHcaptcha
            ref="captcha69"
            :sitekey="sitekey"
            size="invisible"
            theme="dark"
            @challenge-expired="onChallengeExpire"
            @closed="onClosed"
            @error="onError"
            @verify="onVerify"
          />
        </v-card>

        <!-- Chart Section -->
        <div v-if="showChart && labels.length" class="mt-10 mt-md-14 mb-6">
          <CxLineChartCard
            dataset-label="users"
            :height="300"
            :labels="labels"
            :title="$t('WaitList.waitlistGrowth')"
            :total="total"
            :total-label="$t('WaitList.totalUsersOnWaitlist')"
            :values="values"
          />
        </div>

        </template>

      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import VueHcaptcha from '@hcaptcha/vue3-hcaptcha'
  import { computed, onMounted, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'

  import { api } from '@/api/api'
  import blueBadgeSvg from '@/assets/profileBadge/u1-blue-verified-badge.svg'

  function validateEmail (value: string): boolean {
    return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(value)
  }

  const router = useRouter()
  const { t } = useI18n()

  const checking = ref(true)
  const alreadyJoined = ref(false)
  const showChart = ref(true)

  // hCaptcha (hardcoded for now)
  const sitekey = ref('faf7b138-4fe8-4613-bd64-861007d6800c')
  const captcha69 = ref<any>(null)

  const email = ref('')

  const isLoading = ref(false)
  const sendingRequest = ref(false)
  const responseOk = ref(false)
  const responseError = ref(false)

  const emailRules = computed<Array<(v: string) => true | string>>(() => [
    (v: string) => (v ? true : t('CxLoginDialog.emailRequired')),
    (v: string) => (validateEmail(v) ? true : t('CxLoginDialog.emailMostBeValid')),
  ])

  function isFieldValid (value: string, rules: Array<(v: string) => true | string>): boolean {
    return rules.every(rule => rule(value) === true)
  }

  const formIsValid = computed(() => {
    return isFieldValid(email.value, emailRules.value)
  })

  function resetForm () {
    email.value = ''
    isLoading.value = false
    sendingRequest.value = false
    responseOk.value = false
    responseError.value = false
  }

  function closeDialog () {
    resetForm()
    router.push('/')
  }

  function operationFailed () {
    sendingRequest.value = false
    isLoading.value = false
    responseError.value = true
  }

  function operationSuccess () {
    sendingRequest.value = false
    isLoading.value = false
    responseOk.value = true
  }

  function joinClicked () {
    responseError.value = false
    isLoading.value = true
    captcha69.value?.execute?.()
  }

  async function joinWaitlist (captchaToken: string) {
    try {
      showChart.value = false

      await api.waitlist.subscribe({
        email: email.value,
        captchaResponse: captchaToken,
      })

      // Claim the blue badge (ignore 409 if already claimed)
      try {
        await api.badges.claim()
      } catch {
        // 409 = already claimed — that's fine
      }

      await refreshStats()

      alreadyJoined.value = true
      operationSuccess()
    } catch {
      operationFailed()
    } finally {
      showChart.value = true
    }
  }

  function onVerify (token: string) {
    sendingRequest.value = true
    void joinWaitlist(token)
  }

  function onClosed () {
    operationFailed()
  }

  function onChallengeExpire () {
    operationFailed()
  }

  function onError () {
    operationFailed()
  }

  const labels = ref<string[]>([])
  const values = ref<number[]>([])

  async function refreshStats (): Promise<void> {
    const stats = await api.waitlist.getStats()
    labels.value = stats.labels
    values.value = stats.values
  }

  onMounted(async () => {
    try {
      const [badges] = await Promise.all([
        api.badges.me(),
        refreshStats(),
      ])
      if (badges.activeBadge) {
        alreadyJoined.value = true
      }
    } catch {
      // If badge check fails, show the form anyway
    } finally {
      checking.value = false
    }
  })

  const total = computed(() => values.value.at(-1) ?? 0)
</script>

<route lang="json">
{
  "path": "/waitlist",
  "meta": { "requiresAuth": true }
}
</route>

<style scoped>
.badge-circle {
  width: 88px;
  height: 88px;
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

.waitlist-icon-ring {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.08);
  border: 2px solid rgba(var(--v-theme-primary), 0.2);
}

.waitlist-icon-ring--success {
  background: rgba(var(--v-theme-success), 0.08);
  border-color: rgba(var(--v-theme-success), 0.2);
}
</style>
