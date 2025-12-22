<template>
  <v-card>
    <v-list lines="two" subheader>
      <div :style="mobileView ? '' : 'display: flex; justify-content: center; align-items: center; flex-direction: column;'">
        <v-list-item :disabled="isLoading" :title="$t('WaitList.joinOurWaitingList')" />

        <v-list-item>
          <v-text-field
            v-model="email"
            :disabled="isLoading"
            :label="$t('Common.email')"
            prepend-icon="mdi-email"
            :rules="emailRules"
            :style="mobileView ? '' : 'width: 800px;'"
            type="email"
          />
        </v-list-item>

        <v-list-item>
          <v-textarea
            v-model="feedback"
            :disabled="isLoading"
            :label="$t('WaitList.feedbackOptional')"
            prepend-icon="mdi-comment-text-outline"
            :rules="feedbackRules"
            :style="mobileView ? '' : 'width: 800px;'"
          />
        </v-list-item>

        <v-list-item>
          <div :style="mobileView ? '' : 'width: 800px;'">
            <v-btn
              v-if="!responseOk"
              block
              color="orange-accent-2"
              :disabled="!formIsValid || isLoading"
              :loading="isLoading"
              @click="joinClicked"
            >
              {{ $t('WaitList.join') }}
            </v-btn>
            <v-btn v-else block color="green" @click="closeDialog">
              {{ $t('Common.close') }}
            </v-btn>

            <v-card-text class="text-center">
              <span v-if="sendingRequest" class="text-orange-accent-2">
                {{ $t('Common.pleaseWait') }}
              </span>
              <span v-if="responseOk" class="text-green">
                <i class="mdi mdi-check" />
                {{ $t('WaitList.registeredEmailWeWillKeepYouInformed') }}
              </span>
              <span v-if="responseError" class="text-red">
                <i class="mdi mdi-check" />
                {{ $t('Common.operationFailedPleaseTryAgain') }}
              </span>
            </v-card-text>
          </div>
        </v-list-item>

        <v-list-item class="d-flex justify-center">
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
        </v-list-item>
      </div>
    </v-list>
  </v-card>

  <!-- here CxLineChartCard -->
  <v-container v-if="showChart" fluid>
    <CxLineChartCard
      dataset-label="users"
      :height="350"
      :labels="labels"
      :max-width="900"
      title="Waitlist Users"
      :total="total"
      total-label="Total users on waitlist"
      :values="values"
    />
  </v-container>
</template>

<script setup lang="ts">
  import VueHcaptcha from '@hcaptcha/vue3-hcaptcha'
  import { storeToRefs } from 'pinia'
  import { computed, onMounted, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'

  import { api } from '@/api/api'
  import { useAppStore } from '@/stores/app'

  function validateEmail (value: string): boolean {
    return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(value)
  }

  const router = useRouter()
  const { t } = useI18n()
  const appStore = useAppStore()
  const { mobileView } = storeToRefs(appStore)

  const showChart = ref(true)

  // hCaptcha (hardcoded for now)
  const sitekey = ref('faf7b138-4fe8-4613-bd64-861007d6800c')
  const captcha69 = ref<any>(null)

  const email = ref('')
  const feedback = ref('')

  const isLoading = ref(false)
  const sendingRequest = ref(false)
  const responseOk = ref(false)
  const responseError = ref(false)

  const emailRules = computed<Array<(v: string) => true | string>>(() => [
    (v: string) => (v ? true : t('CxLoginDialog.emailRequired')),
    (v: string) => (validateEmail(v) ? true : t('CxLoginDialog.emailMostBeValid')),
  ])

  const feedbackRules = computed<Array<(v: string) => true | string>>(() => [
    (v: string) => (!v || v.length <= 500 ? true : 'Max 500 characters'),
  ])

  function isFieldValid (value: string, rules: Array<(v: string) => true | string>): boolean {
    return rules.every(rule => rule(value) === true)
  }

  const formIsValid = computed(() => {
    const emailOk = isFieldValid(email.value, emailRules.value)
    const feedbackOk = isFieldValid(feedback.value, feedbackRules.value)
    return emailOk && feedbackOk
  })

  function resetForm () {
    email.value = ''
    feedback.value = ''
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
        feedback: feedback.value || undefined,
        captchaResponse: captchaToken,
      })

      await refreshStats()

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
    await refreshStats()
  })

  const total = computed(() => values.value.at(-1) ?? 0)
</script>

<route lang="json">
{
  "path": "/waitlist"
}
</route>
