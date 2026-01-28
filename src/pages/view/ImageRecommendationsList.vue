<!--
  Image Recommendations List (Internal component for View page)
  Displays a grid/list of recommended images from the same creator.
  This is an internal page component, not a shared component.
-->
<template>
  <!-- Loading State -->
  <template v-if="loading">
    <v-row dense>
      <v-col
        v-for="n in 6"
        :key="n"
        cols="4"
        lg="4"
        md="6"
      >
        <v-skeleton-loader
          :aspect-ratio="1"
          class="rounded-lg"
          type="image"
        />
      </v-col>
    </v-row>
  </template>

  <!-- Error State -->
  <v-alert
    v-else-if="error"
    class="mb-2"
    density="compact"
    type="warning"
    variant="tonal"
  >
    <template #text>
      Failed to load recommendations
    </template>
    <template #append>
      <v-btn
        density="compact"
        size="small"
        variant="text"
        @click="fetchRecommendations"
      >
        Retry
      </v-btn>
    </template>
  </v-alert>

  <!-- Empty State -->
  <v-sheet
    v-else-if="recommendations.length === 0"
    class="text-center pa-6"
    color="surface-variant"
    rounded="lg"
  >
    <v-icon color="grey" size="48">mdi-image-multiple-outline</v-icon>
    <p class="text-body-2 text-medium-emphasis mt-2">
      No more images from this creator
    </p>
  </v-sheet>

  <!-- Recommendations Grid -->
  <v-row v-else dense>
    <v-col
      v-for="item in recommendations"
      :key="item.id"
      cols="4"
      lg="4"
      md="6"
    >
      <v-card
        class="rounded-lg overflow-hidden"
        :to="`/view/${item.id}`"
        variant="flat"
      >
        <v-responsive :aspect-ratio="1">
          <v-img
            v-if="item.thumbnailUrl"
            class="h-100"
            cover
            :src="item.thumbnailUrl"
          >
            <template #placeholder>
              <v-sheet
                class="h-100 d-flex align-center justify-center"
                color="grey-lighten-3"
              >
                <v-icon color="grey">mdi-image-outline</v-icon>
              </v-sheet>
            </template>
            <template #error>
              <v-sheet
                class="h-100 d-flex align-center justify-center"
                color="grey-lighten-3"
              >
                <v-icon color="grey">mdi-image-broken</v-icon>
              </v-sheet>
            </template>

            <!-- Locked indicator (using absolute positioning instead of v-overlay to avoid scroll blocking) -->
            <v-sheet
              v-if="item.locked"
              class="position-absolute d-flex align-center justify-center"
              color="rgba(0, 0, 0, 0.5)"
              style="top: 0; left: 0; right: 0; bottom: 0;"
            >
              <v-icon color="white" size="24">mdi-lock</v-icon>
            </v-sheet>
          </v-img>
          <v-sheet
            v-else
            class="h-100 d-flex align-center justify-center"
            color="grey-lighten-3"
          >
            <v-icon color="grey">mdi-image-outline</v-icon>
          </v-sheet>
        </v-responsive>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
  import type { EntryModel } from '@/api/api'

  import { onMounted, ref, watch } from 'vue'

  import { api } from '@/api/api'

  interface Props {
    /** Entry ID to exclude from recommendations (current image) */
    excludeId?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    excludeId: '',
  })

  // State
  const recommendations = ref<EntryModel[]>([])
  const loading = ref(true)
  const error = ref(false)

  // Fetch recommendations
  async function fetchRecommendations () {
    loading.value = true
    error.value = false

    try {
      // Fetch images only
      const response = await api.mock.getEntries({ type: 'image', size: 12 })

      // Filter to images only and exclude current
      recommendations.value = response.items
        .filter(item => item.kind === 'entry')
        .map(item => (item as { kind: 'entry', entry: EntryModel }).entry)
        .filter(entry => entry.type === 'image' && entry.id !== props.excludeId)
        .slice(0, 9)
    } catch (error_: unknown) {
      console.error('[ImageRecommendationsList] Failed to fetch:', error_)
      error.value = true
    } finally {
      loading.value = false
    }
  }

  // Watch for excludeId changes
  watch(() => props.excludeId, () => {
    fetchRecommendations()
  })

  // Initial load
  onMounted(() => {
    fetchRecommendations()
  })
</script>
