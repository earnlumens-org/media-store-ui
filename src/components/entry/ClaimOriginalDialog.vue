<template>
  <v-dialog
    v-model="dialogModel"
    max-width="480"
    persistent
  >
    <v-card>
      <v-card-title class="d-flex align-center ga-2">
        <v-icon color="primary" icon="mdi-certificate-outline" />
        {{ t('OriginalFirst.claimTitle') }}
      </v-card-title>

      <!-- Step 1: Confirm -->
      <template v-if="step === 'confirm'">
        <v-card-text>
          <div class="text-body-2 mb-2">
            {{ t('OriginalFirst.claimIntro') }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ t('OriginalFirst.claimHint') }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="close">{{ t('Common.cancel') }}</v-btn>
          <v-btn
            color="primary"
            :loading="submitting"
            variant="flat"
            @click="submit"
          >
            {{ t('OriginalFirst.claimSubmit') }}
          </v-btn>
        </v-card-actions>
      </template>

      <!-- Step 2: Result -->
      <template v-if="step === 'result'">
        <v-card-text class="text-center py-6">
          <v-icon
            class="mb-3"
            :color="result?.granted ? 'success' : 'warning'"
            :icon="result?.granted ? 'mdi-check-decagram' : 'mdi-close-circle-outline'"
            size="48"
          />
          <div class="text-body-1 font-weight-medium">
            {{ result?.granted ? t('OriginalFirst.claimGrantedTitle') : t('OriginalFirst.claimRejectedTitle') }}
          </div>
          <div class="text-body-2 text-medium-emphasis mt-1">
            {{ result?.granted ? t('OriginalFirst.claimGrantedMessage') : t('OriginalFirst.claimRejectedMessage') }}
          </div>
          <v-sheet
            v-if="result"
            class="mt-4 pa-3 rounded-lg text-start"
            color="surface"
          >
            <div class="text-caption font-weight-bold mb-1">
              {{ t('OriginalFirst.scoreTitle') }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ t('OriginalFirst.yourScore') }}: {{ result.claimantScore }} ·
              {{ t('OriginalFirst.holderScore') }}: {{ result.holderScore }}
            </div>
            <div class="text-caption text-medium-emphasis mt-1" style="white-space: pre-line">
              {{ result.scoreBreakdown }}
            </div>
          </v-sheet>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="flat" @click="close">{{ t('Common.close') }}</v-btn>
        </v-card-actions>
      </template>

      <!-- Error -->
      <template v-if="step === 'error'">
        <v-card-text class="text-center py-6">
          <v-icon class="mb-3" color="error" icon="mdi-alert-circle-outline" size="48" />
          <div class="text-body-1 font-weight-medium">{{ t('OriginalFirst.claimErrorTitle') }}</div>
          <div class="text-body-2 text-medium-emphasis mt-1">{{ errorMessage }}</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="flat" @click="close">{{ t('Common.close') }}</v-btn>
        </v-card-actions>
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { ClaimOriginalResponse } from '@/api/modules/originals.api'

  import { computed, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'

  import { ApiError } from '@/api/apiRequest'
  import { claimAsOriginal } from '@/api/modules/originals.api'

  interface Props {
    modelValue: boolean
    entryId: string
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    /** Emitted when the claim was granted and attribution changed. */
    'granted': []
  }>()

  const { t } = useI18n()

  const dialogModel = computed({
    get: () => props.modelValue,
    set: (v: boolean) => emit('update:modelValue', v),
  })

  const step = ref<'confirm' | 'result' | 'error'>('confirm')
  const submitting = ref(false)
  const result = ref<ClaimOriginalResponse | null>(null)
  const errorMessage = ref('')

  const KNOWN_ERRORS = new Set([
    'ENTRY_NOT_FOUND',
    'NO_FINGERPRINT',
    'NO_MATCHING_ENTRY',
    'ALREADY_ORIGINAL',
    'ALREADY_CLAIMED',
    'DAILY_CLAIM_LIMIT_REACHED',
  ])

  // Reset on open
  watch(() => props.modelValue, open => {
    if (open) {
      step.value = 'confirm'
      result.value = null
      errorMessage.value = ''
    }
  })

  function close () {
    dialogModel.value = false
  }

  async function submit () {
    submitting.value = true
    try {
      const response = await claimAsOriginal(props.entryId)
      result.value = response
      step.value = 'result'
      if (response.granted) {
        emit('granted')
      }
    } catch (error) {
      const code = error instanceof ApiError && KNOWN_ERRORS.has(error.message)
        ? error.message
        : 'GENERIC'
      errorMessage.value = t(`OriginalFirst.errors.${code}`)
      step.value = 'error'
    } finally {
      submitting.value = false
    }
  }
</script>
