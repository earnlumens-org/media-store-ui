<template>
  <v-dialog
    v-model="dialogModel"
    max-width="480"
    persistent
  >
    <v-card>
      <v-card-title class="d-flex align-center ga-2">
        <v-icon color="error" icon="mdi-flag" />
        {{ t('report.title') }}
      </v-card-title>

      <!-- Step 1: Select reason -->
      <template v-if="step === 'reason'">
        <v-card-text class="pb-0">
          <div class="text-body-2 text-medium-emphasis mb-3">
            {{ t('report.selectReason') }}
          </div>

          <!-- High severity -->
          <div class="text-caption font-weight-bold text-error mb-1">
            {{ t('report.severityHigh') }}
          </div>
          <v-list class="mb-2" density="compact">
            <v-list-item
              v-for="r in highReasons"
              :key="r.value"
              :active="selectedReason === r.value"
              color="error"
              :prepend-icon="r.icon"
              :title="t(`report.reasons.${r.value}`)"
              @click="selectedReason = r.value"
            />
          </v-list>

          <!-- Medium severity -->
          <div class="text-caption font-weight-bold text-warning mb-1">
            {{ t('report.severityMedium') }}
          </div>
          <v-list class="mb-2" density="compact">
            <v-list-item
              v-for="r in mediumReasons"
              :key="r.value"
              :active="selectedReason === r.value"
              color="warning"
              :prepend-icon="r.icon"
              :title="t(`report.reasons.${r.value}`)"
              @click="selectedReason = r.value"
            />
          </v-list>

          <!-- Low severity -->
          <div class="text-caption font-weight-bold text-medium-emphasis mb-1">
            {{ t('report.severityLow') }}
          </div>
          <v-list density="compact">
            <v-list-item
              v-for="r in lowReasons"
              :key="r.value"
              :active="selectedReason === r.value"
              :prepend-icon="r.icon"
              :title="t(`report.reasons.${r.value}`)"
              @click="selectedReason = r.value"
            />
          </v-list>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="close">{{ t('Common.cancel') }}</v-btn>
          <v-btn
            color="error"
            :disabled="!selectedReason"
            variant="flat"
            @click="step = 'comment'"
          >
            {{ t('Common.continue') }}
          </v-btn>
        </v-card-actions>
      </template>

      <!-- Step 2: Optional comment + submit -->
      <template v-if="step === 'comment'">
        <v-card-text>
          <v-chip
            class="mb-3"
            color="error"
            label
            size="small"
            variant="tonal"
          >
            {{ t(`report.reasons.${selectedReason}`) }}
          </v-chip>

          <v-textarea
            v-model="comment"
            :counter="500"
            :label="t('report.commentLabel')"
            :maxlength="500"
            :placeholder="t('report.commentPlaceholder')"
            rows="3"
            variant="outlined"
          />
        </v-card-text>

        <v-card-actions>
          <v-btn variant="text" @click="step = 'reason'">{{ t('Common.goBack') }}</v-btn>
          <v-spacer />
          <v-btn variant="text" @click="close">{{ t('Common.cancel') }}</v-btn>
          <v-btn
            color="error"
            :loading="submitting"
            variant="flat"
            @click="submit"
          >
            {{ t('report.submit') }}
          </v-btn>
        </v-card-actions>
      </template>

      <!-- Step 3: Success -->
      <template v-if="step === 'done'">
        <v-card-text class="text-center py-6">
          <v-icon class="mb-3" color="success" icon="mdi-check-circle" size="48" />
          <div class="text-body-1 font-weight-medium">{{ t('report.successTitle') }}</div>
          <div class="text-body-2 text-medium-emphasis mt-1">{{ t('report.successMessage') }}</div>
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
  import { computed, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'

  import { ApiError } from '@/api/apiRequest'
  import { submitReport } from '@/api/modules/report.api'
  import { REPORT_REASONS } from '@/api/types/report.types'
  import { showGlobalNotification } from '@/services/globalNotification'

  interface Props {
    modelValue: boolean
    entryId: string
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
  }>()

  const { t } = useI18n()

  const dialogModel = computed({
    get: () => props.modelValue,
    set: (v: boolean) => emit('update:modelValue', v),
  })

  const step = ref<'reason' | 'comment' | 'done'>('reason')
  const selectedReason = ref<string | null>(null)
  const comment = ref('')
  const submitting = ref(false)

  const highReasons = REPORT_REASONS.filter(r => r.severity === 'HIGH')
  const mediumReasons = REPORT_REASONS.filter(r => r.severity === 'MEDIUM')
  const lowReasons = REPORT_REASONS.filter(r => r.severity === 'LOW')

  // Reset on open
  watch(() => props.modelValue, open => {
    if (open) {
      step.value = 'reason'
      selectedReason.value = null
      comment.value = ''
    }
  })

  function close () {
    dialogModel.value = false
  }

  async function submit () {
    if (!selectedReason.value) return
    submitting.value = true
    try {
      await submitReport(props.entryId, {
        reason: selectedReason.value,
        comment: comment.value.trim() || undefined,
      })
      step.value = 'done'
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          showGlobalNotification('report.alreadyReported')
        } else if (error.status === 429) {
          showGlobalNotification('report.dailyLimitReached')
        } else {
          showGlobalNotification('Common.operationFailedPleaseTryAgain')
        }
      }
      close()
    } finally {
      submitting.value = false
    }
  }
</script>
