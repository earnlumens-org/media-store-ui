<template>
  <v-alert
    border="start"
    border-color="primary"
    class="mb-4"
    color="primary"
    density="comfortable"
    icon="mdi-book-open-page-variant-outline"
    variant="tonal"
  >
    <div class="d-flex flex-column flex-sm-row align-sm-center ga-3">
      <div class="flex-grow-1">
        <div class="text-overline text-primary font-weight-bold">
          {{ t('Account.contentGuidelines') }}
        </div>
        <div class="text-body-1 font-weight-medium">
          {{ guidelinesTitle }}
        </div>
        <div class="text-body-2 text-medium-emphasis">
          {{ t('Account.contentGuidelinesHint') }}
        </div>
      </div>

      <v-btn
        append-icon="mdi-arrow-top-right"
        color="primary"
        to="/guidelines"
        variant="tonal"
      >
        {{ t('Account.contentGuidelines') }}
      </v-btn>
    </div>
  </v-alert>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'

  import { useGuidelinesContent } from '@/lib/useGuidelinesContent'

  const { t } = useI18n()
  const { loading, error } = useGuidelinesContent()

  const guidelinesTitle = computed(() => {
    if (loading.value || error.value) {
      return t('Account.contentGuidelines')
    }
    return t('Guidelines.title')
  })
</script>
