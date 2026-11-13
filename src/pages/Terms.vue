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

        <!--
          Purchase terms (MYCELIUM-RESILIENCE.md L3 / G4, generated from
          DATA-MODEL.md §13). `id="purchases"` is the deep-link target used by
          the checkout dialog and the footer (/terms#purchases).
        -->
        <v-divider class="my-8" />
        <div id="purchases" class="d-flex align-center ga-3 mb-2 purchase-anchor">
          <v-icon color="primary" icon="mdi-shield-check-outline" />
          <h2 class="text-h5 font-weight-bold">
            {{ $t('Legal.purchase.title') }}
          </h2>
        </div>
        <p class="text-body-1 mb-4">
          {{ $t('Legal.purchase.intro') }}
        </p>

        <template v-for="(section, idx) in purchaseSections" :key="`p-${idx}`">
          <h3 class="text-subtitle-1 font-weight-bold mt-6 mb-2">
            {{ section.heading }}
          </h3>
          <p class="text-body-2">
            {{ section.body }}
          </p>
          <ul v-if="section.items.length > 0" class="text-body-2 pl-6 mt-2">
            <li v-for="(item, i) in section.items" :key="i" class="mb-1">
              {{ item }}
            </li>
          </ul>
        </template>
      </v-card>

      <!-- Cross-link to Privacy + back -->
      <div class="d-flex flex-wrap justify-space-between align-center mt-8 ga-2">
        <v-btn color="primary" prepend-icon="mdi-arrow-left" variant="text" @click="$router.back()">
          {{ $t('Common.goBack') }}
        </v-btn>
        <v-btn append-icon="mdi-shield-lock-outline" color="primary" to="/privacy" variant="text">
          {{ $t('Common.privacy') }}
        </v-btn>
      </div>
    </template>
  </v-container>
</template>

<script setup lang="ts">
  import { computed, nextTick, onMounted, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRoute } from 'vue-router'
  import { useLegalContent } from '@/lib/useLegalContent'

  const { t, tm } = useI18n()
  const route = useRoute()
  const { loading, error } = useLegalContent()

  const lastUpdated = '2026-11-11'

  interface LegalSection {
    heading: string
    body: string
  }

  interface PurchaseSection extends LegalSection {
    items: string[]
  }

  const termsSections = computed<LegalSection[]>(() => {
    const raw = tm('Legal.terms.sections')
    if (!Array.isArray(raw)) return []
    return raw.map((s: Record<string, unknown>) => ({
      heading: t(String(s.heading ?? '')),
      body: t(String(s.body ?? '')),
    }))
  })

  const purchaseSections = computed<PurchaseSection[]>(() => {
    const raw = tm('Legal.purchase.sections')
    if (!Array.isArray(raw)) return []
    return raw.map((s: Record<string, unknown>) => ({
      heading: t(String(s.heading ?? '')),
      body: t(String(s.body ?? '')),
      items: Array.isArray(s.items)
        ? (s.items as unknown[]).map(i => t(String(i)))
        : [],
    }))
  })

  // The legal content loads asynchronously, so the router's hash scroll can
  // fire before `#purchases` exists; re-scroll once the content is rendered.
  function scrollToHash () {
    if (!route.hash) return
    nextTick(() => {
      const el = document.querySelector(route.hash)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  }

  onMounted(scrollToHash)
  watch(loading, scrollToHash)
</script>

<style scoped>
/* Keep the anchored heading clear of the fixed app bar on hash navigation. */
.purchase-anchor {
  scroll-margin-top: 80px;
}
</style>

<route lang="json">
{
  "path": "/terms",
  "meta": {
    "requiresAuth": false
  }
}
</route>
