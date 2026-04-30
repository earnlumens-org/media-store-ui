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

      <!-- ============================ -->
      <!-- Layer 1: platform-wide rules -->
      <!-- ============================ -->
      <div class="d-flex align-center ga-3 mb-3">
        <v-icon color="primary" icon="mdi-shield-check" size="28" />
        <div>
          <h2 class="text-h5 font-weight-bold mb-0">
            {{ platformHeading }}
          </h2>
          <p class="text-body-2 text-medium-emphasis mb-0">
            {{ platformBody }}
          </p>
        </div>
      </div>

      <!-- Sections -->
      <template v-for="(section, idx) in creatorSections" :key="'c-' + idx">
        <v-card class="mb-4 pa-5 pa-md-6" elevation="1">
          <h3 class="text-subtitle-1 font-weight-bold mb-2">
            {{ section.heading }}
          </h3>
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

      <!-- =============================== -->
      <!-- Layer 2: tenant-specific rules  -->
      <!-- =============================== -->
      <div class="d-flex align-center ga-3 mt-8 mb-3">
        <v-icon color="secondary" icon="mdi-store-cog" size="28" />
        <div>
          <h2 class="text-h5 font-weight-bold mb-0">
            {{ tenantHeading }}
          </h2>
          <p class="text-body-2 text-medium-emphasis mb-0">
            {{ tenantBody }}
          </p>
        </div>
      </div>

      <v-card class="mb-4 pa-5 pa-md-6" elevation="0" variant="outlined">
        <div class="d-flex align-start ga-3 text-body-2 text-medium-emphasis">
          <v-icon class="mt-px" color="medium-emphasis" icon="mdi-information-outline" size="20" />
          <span>{{ tenantPlaceholder }}</span>
        </div>
      </v-card>

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
  import { useTenantStore } from '@/stores/tenant'

  const { t, te, tm } = useI18n()
  const { loading, error } = useGuidelinesContent()
  const tenantStore = useTenantStore()

  const lastUpdated = '2026-04-30'

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

  // Hard-coded English fallbacks: when a translated guidelines locale (e.g.
  // fr, de) doesn't yet expose the new platform/tenant section keys, vue-i18n
  // falls back to the global `fallbackLocale` (en in main.ts). If even that
  // fails (no global en match for these keys) we use these strings so the
  // page never shows raw keys to users.
  const platformHeading = computed(() =>
    te('Guidelines.platformSection.heading')
      ? t('Guidelines.platformSection.heading')
      : 'Platform-wide rules'
  )
  const platformBody = computed(() =>
    te('Guidelines.platformSection.body')
      ? t('Guidelines.platformSection.body')
      : 'These rules apply to every tenant on EarnLumens, including this one.'
  )
  const tenantLabel = computed(() => tenantStore.subdomain || 'this tenant')
  const tenantHeading = computed(() => {
    const base = te('Guidelines.tenantSection.heading')
      ? t('Guidelines.tenantSection.heading')
      : 'Tenant-specific rules'
    return `${base} (${tenantLabel.value})`
  })
  const tenantBody = computed(() =>
    te('Guidelines.tenantSection.body')
      ? t('Guidelines.tenantSection.body')
      : 'On top of the platform rules above, each tenant may add its own publishing notes.'
  )
  const tenantPlaceholder = computed(() =>
    te('Guidelines.tenantSection.placeholder')
      ? t('Guidelines.tenantSection.placeholder')
      : 'This tenant has not added specific publishing notes yet. Only the platform-wide rules above apply here.'
  )

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
