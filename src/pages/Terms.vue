<template>
  <v-container class="py-8" style="max-width: 860px">
    <!-- Loading -->
    <v-row v-if="loading" justify="center">
      <v-col class="text-center py-12" cols="12">
        <v-progress-circular color="primary" indeterminate size="48" />
      </v-col>
    </v-row>

    <!-- Error -->
    <v-alert v-else-if="error" class="mb-6" type="error" variant="tonal">
      {{ error }}
    </v-alert>

    <!-- Content -->
    <template v-else>
      <!-- Tabs: Terms / Privacy -->
      <v-tabs v-model="tab" class="mb-6" color="primary" grow>
        <v-tab value="terms">
          <v-icon start>mdi-file-document-outline</v-icon>
          {{ $t('Legal.termsTitle') }}
        </v-tab>
        <v-tab value="privacy">
          <v-icon start>mdi-shield-lock-outline</v-icon>
          {{ $t('Legal.privacyTitle') }}
        </v-tab>
      </v-tabs>

      <!-- Terms -->
      <v-window v-model="tab">
        <v-window-item value="terms">
          <v-card class="pa-6 pa-md-8" elevation="1">
            <h1 class="text-h4 font-weight-bold mb-2">
              {{ $t('Legal.termsTitle') }}
            </h1>

            <p class="text-caption text-medium-emphasis mb-6">
              {{ $t('Legal.lastUpdated', { date: lastUpdated }) }}
            </p>

            <p class="text-body-1 mb-6">
              {{ $t('Legal.terms.intro') }}
            </p>

            <template v-for="(section, idx) in termsSections" :key="idx">
              <h2 class="text-h6 font-weight-bold mt-6 mb-2">
                {{ section.heading }}
              </h2>
              <p class="text-body-2">
                {{ section.body }}
              </p>
            </template>
          </v-card>
        </v-window-item>

        <!-- Privacy -->
        <v-window-item value="privacy">
          <v-card class="pa-6 pa-md-8" elevation="1">
            <h1 class="text-h4 font-weight-bold mb-2">
              {{ $t('Legal.privacyTitle') }}
            </h1>

            <p class="text-caption text-medium-emphasis mb-6">
              {{ $t('Legal.lastUpdated', { date: lastUpdated }) }}
            </p>

            <p class="text-body-1 mb-6">
              {{ $t('Legal.privacy.intro') }}
            </p>

            <template v-for="(section, idx) in privacySections" :key="idx">
              <h2 class="text-h6 font-weight-bold mt-6 mb-2">
                {{ section.heading }}
              </h2>
              <p class="text-body-2">
                {{ section.body }}
              </p>
            </template>
          </v-card>
        </v-window-item>
      </v-window>

      <!-- Back -->
      <div class="d-flex justify-center mt-8">
        <v-btn color="primary" prepend-icon="mdi-arrow-left" variant="text" @click="$router.back()">
          {{ $t('Common.goBack') }}
        </v-btn>
      </div>
    </template>
  </v-container>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useLegalContent } from '@/lib/useLegalContent'

  const { t, tm } = useI18n()
  const { loading, error } = useLegalContent()

  const tab = ref('terms')
  const lastUpdated = '2026-03-07'

  interface LegalSection {
    heading: string
    body: string
  }

  const termsSections = computed<LegalSection[]>(() => {
    const raw = tm('Legal.terms.sections')
    if (!Array.isArray(raw)) return []
    return raw.map((s: Record<string, unknown>) => ({
      heading: t(String(s.heading ?? '')),
      body: t(String(s.body ?? '')),
    }))
  })

  const privacySections = computed<LegalSection[]>(() => {
    const raw = tm('Legal.privacy.sections')
    if (!Array.isArray(raw)) return []
    return raw.map((s: Record<string, unknown>) => ({
      heading: t(String(s.heading ?? '')),
      body: t(String(s.body ?? '')),
    }))
  })
</script>

<route lang="json">
{
  "path": "/terms",
  "meta": {
    "requiresAuth": false
  }
}
</route>
