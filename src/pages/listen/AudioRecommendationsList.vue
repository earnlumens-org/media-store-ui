<!--
  Audio Recommendations List (Internal component for Listen page)
  Displays a list of recommended audio entries.
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
            height="64"
            type="image"
            width="64"
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
      :to="`/listen/${item.id}`"
    >
      <template #prepend>
        <v-sheet
          class="rounded-lg overflow-hidden me-3 flex-shrink-0 position-relative"
          height="64"
          width="64"
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
                color="red-lighten-4"
              >
                <v-icon color="grey-darken-2" size="24">mdi-music</v-icon>
              </v-sheet>
            </template>
          </v-img>
          <v-sheet
            v-else
            class="h-100 d-flex align-center justify-center"
            color="red-lighten-4"
          >
            <v-icon color="grey-darken-2" size="24">mdi-music</v-icon>
          </v-sheet>

          <!-- Locked indicator -->
          <v-avatar
            v-if="item.locked"
            class="position-absolute"
            color="rgba(0,0,0,0.6)"
            size="24"
            :style="{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }"
          >
            <v-icon color="white" size="14">mdi-lock</v-icon>
          </v-avatar>
        </v-sheet>
      </template>

      <v-list-item-title class="text-body-2 font-weight-medium">
        {{ item.title }}
      </v-list-item-title>

      <v-list-item-subtitle class="text-caption">
        {{ item.authorName }}
      </v-list-item-subtitle>

      <v-list-item-subtitle v-if="item.durationSec" class="text-caption text-medium-emphasis">
        {{ formatDuration(item.durationSec) }}
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
      const response = await api.mock.getEntries({
        page: 0,
        size: 10,
        type: 'audio',
      })

      recommendations.value = response.items
        .filter((item: FeedItemModel) => item.kind === 'entry' && item.entry.id !== props.currentId)
        .map((item: FeedItemModel) => (item as { kind: 'entry', entry: EntryModel }).entry)
        .slice(0, 8)
    } catch (error_) {
      console.error('[AudioRecommendationsList] Failed to fetch:', error_)
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

  watch(() => props.currentId, () => {
    fetchRecommendations()
  })

  onMounted(() => {
    fetchRecommendations()
  })
</script>
