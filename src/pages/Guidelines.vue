<template>
  <v-container class="py-8" style="max-width: 900px">
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
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-h4 text-md-h3 font-weight-bold mb-2">
          {{ $t('Guidelines.title') }}
        </h1>
        <p class="text-body-1 text-medium-emphasis mb-1">
          {{ $t('Guidelines.subtitle') }}
        </p>
        <p class="text-caption text-medium-emphasis">
          {{ $t('Guidelines.lastUpdated', { date: lastUpdated }) }}
        </p>
      </div>

      <!-- Intro -->
      <v-alert class="mb-8" color="info" icon="mdi-information-outline" variant="tonal">
        {{ $t('Guidelines.intro') }}
      </v-alert>

      <!-- Sections -->
      <template v-for="(section, idx) in creatorSections" :key="'c-' + idx">
        <v-card class="mb-4 pa-5 pa-md-6" elevation="1">
          <h2 class="text-h6 font-weight-bold mb-2">
            {{ section.heading }}
          </h2>
          <p class="text-body-2 text-medium-emphasis mb-3">
            {{ section.body }}
          </p>
          <ul v-if="section.items.length > 0" class="text-body-2 pl-4">
            <li v-for="(item, j) in section.items" :key="j" class="mb-1">
              {{ item }}
            </li>
          </ul>
        </v-card>
      </template>

      <!-- Footer note -->
      <v-alert class="mt-6 mb-4" color="warning" icon="mdi-alert-outline" variant="tonal">
        {{ $t('Guidelines.footer') }}
      </v-alert>

      <!-- Back -->
      <div class="d-flex justify-center mt-6">
        <v-btn color="primary" prepend-icon="mdi-arrow-left" variant="text" @click="$router.back()">
          {{ $t('Common.goBack') }}
        </v-btn>
      </div>
    </template>
  </v-container>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useGuidelinesContent } from '@/lib/useGuidelinesContent'

  const { t, tm } = useI18n()
  const { loading, error } = useGuidelinesContent()

  const lastUpdated = '2026-04-23'

  interface GuidelineSection {
    heading: string
    body: string
    items: string[]
  }

  function resolveSections (path: string): GuidelineSection[] {
    const raw = tm(path)
    if (!Array.isArray(raw)) return []
    return raw.map((s: Record<string, unknown>) => ({
      heading: t(String(s.heading ?? '')),
      body: t(String(s.body ?? '')),
      items: Array.isArray(s.items)
        ? (s.items as unknown[]).map(i => t(String(i)))
        : [],
    }))
  }

  const creatorSections = computed(() => resolveSections('Guidelines.forCreators.sections'))
</script>

<route lang="json">
{
  "path": "/guidelines",
  "meta": {
    "requiresAuth": false
  }
}
</route>
