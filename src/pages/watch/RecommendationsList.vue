<!--
  Recommendations List (Internal component for Watch page)
  Displays a list of recommended videos based on the current video.
  This is an internal page component, not a shared component.
-->
<template>
  <!-- Loading State -->
  <template v-if="loading">
    <v-list class="pa-0 bg-transparent" lines="three">
      <v-list-item
        v-for="n in 6"
        :key="n"
        class="px-0"
      >
        <template #prepend>
          <v-skeleton-loader
            class="rounded-lg me-3"
            height="94"
            type="image"
            width="168"
          />
        </template>
        <v-skeleton-loader type="list-item-two-line" />
      </v-list-item>
    </v-list>
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
    <v-icon color="grey" size="48">mdi-playlist-remove</v-icon>
    <p class="text-body-2 text-medium-emphasis mt-2">
      No recommendations available
    </p>
  </v-sheet>

  <!-- Recommendations List -->
  <v-list v-else class="pa-0 bg-transparent" lines="three">
    <v-list-item
      v-for="item in recommendations"
      :key="item.id"
      class="px-0 rounded-lg"
      :to="`/watch/${item.id}`"
    >
      <template #prepend>
        <v-responsive
          :aspect-ratio="16 / 9"
          class="rounded-lg overflow-hidden me-3 flex-shrink-0"
          width="168"
        >
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
                <v-icon color="grey">mdi-video-outline</v-icon>
              </v-sheet>
            </template>
          </v-img>
          <v-sheet
            v-else
            class="h-100 d-flex align-center justify-center"
            color="grey-lighten-3"
          >
            <v-icon color="grey">mdi-video-outline</v-icon>
          </v-sheet>

          <!-- Duration chip -->
          <v-chip
            v-if="item.durationSec"
            class="position-absolute bottom-0 right-0 ma-1"
            color="black"
            density="compact"
            label
            size="x-small"
            variant="flat"
          >
            {{ formatDuration(item.durationSec) }}
          </v-chip>

          <!-- Locked indicator -->
          <v-avatar
            v-if="item.locked"
            class="position-absolute top-50 left-50"
            color="rgba(0,0,0,0.6)"
            size="32"
          >
            <v-icon color="white" size="18">mdi-lock</v-icon>
          </v-avatar>
        </v-responsive>
      </template>

      <v-list-item-title class="text-body-2 font-weight-medium">
        {{ item.title }}
      </v-list-item-title>

      <v-list-item-subtitle class="text-caption">
        {{ item.authorName }}
      </v-list-item-subtitle>

      <v-list-item-subtitle class="text-caption text-medium-emphasis">
        {{ formatViewCount(Math.floor(Math.random() * 50000)) }} views • {{ formatRelativeDate(item.publishedAt) }}
      </v-list-item-subtitle>
    </v-list-item>
  </v-list>
</template>

<script setup lang="ts">
  import type { EntryModel, FeedItemModel } from '@/api/api'

  import { onMounted, ref, watch } from 'vue'

  import { api } from '@/api/api'

  interface Props {
    currentId: string
  }

  const props = defineProps<Props>()

  const recommendations = ref<EntryModel[]>([])
  const loading = ref(true)
  const error = ref(false)

  async function fetchRecommendations () {
    loading.value = true
    error.value = false

    try {
      // Fetch video entries, excluding current
      const response = await api.mock.getEntries({
        page: 0,
        size: 10,
        type: 'video',
      })

      // Filter out current video and map to EntryModel
      recommendations.value = response.items
        .filter((item: FeedItemModel) => item.kind === 'entry' && item.entry.id !== props.currentId)
        .map((item: FeedItemModel) => (item as { kind: 'entry', entry: EntryModel }).entry)
        .slice(0, 8)
    } catch (error_) {
      console.error('[RecommendationsList] Failed to fetch:', error_)
      error.value = true
    } finally {
      loading.value = false
    }
  }

  function formatDuration (seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const ONE_MILLION = 10 ** 6
  const ONE_THOUSAND = 1000

  function formatViewCount (count: number): string {
    if (count >= ONE_MILLION) {
      return `${(count / ONE_MILLION).toFixed(1)}M`
    }
    if (count >= ONE_THOUSAND) {
      return `${(count / ONE_THOUSAND).toFixed(1)}K`
    }
    return count.toString()
  }

  function formatRelativeDate (date: string | Date): string {
    const d = date instanceof Date ? date : new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  watch(() => props.currentId, () => {
    fetchRecommendations()
  })

  onMounted(() => {
    fetchRecommendations()
  })
</script>
