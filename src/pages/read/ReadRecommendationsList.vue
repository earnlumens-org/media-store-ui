<!--
  Read Recommendations List (Internal component for Read page)
  Displays a list of recommended entries/posts.
  This is an internal page component, not a shared component.
-->
<template>
  <!-- Loading State -->
  <template v-if="loading">
    <v-list class="pa-0 bg-transparent">
      <v-list-item
        v-for="n in 4"
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
    color="surface"
    rounded="lg"
  >
    <v-icon size="48">mdi-file-document-outline</v-icon>
    <p class="text-body-2 mt-2">
      No more entries to read
    </p>
  </v-sheet>

  <!-- Recommendations List -->
  <v-list v-else class="pa-0 bg-transparent">
    <v-list-item
      v-for="item in recommendations"
      :key="item.id"
      class="px-0 rounded-lg"
      :to="`/read/${item.id}`"
    >
      <template #prepend>
        <v-avatar
          class="me-3 rounded-lg"
          color="grey-lighten-3"
          :image="item.thumbnailUrl"
          size="64"
        >
          <v-icon v-if="!item.thumbnailUrl" color="grey">mdi-file-document-outline</v-icon>
        </v-avatar>
      </template>

      <v-list-item-title class="text-body-2 font-weight-medium">
        {{ item.title }}
      </v-list-item-title>

      <v-list-item-subtitle class="text-caption">
        <router-link class="text-decoration-none" style="color: inherit" :to="`/${item.authorName}`">{{ item.authorName }}</router-link> · {{ formatDate(item.publishedAt) }}
      </v-list-item-subtitle>

      <!-- Locked indicator -->
      <template v-if="item.locked" #append>
        <v-icon color="warning" size="18">mdi-lock</v-icon>
      </template>
    </v-list-item>
  </v-list>
</template>

<script setup lang="ts">
  import type { PublicEntryModel } from '@/api/types/entry.types'

  import { onMounted, ref, watch } from 'vue'

  import { api } from '@/api/api'
  import { usePurchasesStore } from '@/stores/purchases'

  interface Props {
    /** Entry ID to exclude from recommendations (current entry) */
    excludeId?: string
    /** Author username to fetch entries from */
    authorName?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    excludeId: '',
    authorName: '',
  })

  const purchasesStore = usePurchasesStore()

  // State
  const recommendations = ref<(PublicEntryModel & { locked?: boolean })[]>([])
  const loading = ref(true)
  const error = ref(false)

  function formatDate (date: string | Date): string {
    const d = date instanceof Date ? date : new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`

    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  // Fetch recommendations
  async function fetchRecommendations () {
    loading.value = true
    error.value = false

    try {
      if (!props.authorName) {
        recommendations.value = []
        return
      }

      const response = await api.entries.getByUser(props.authorName, {
        type: 'resource',
        size: 10,
      })

      recommendations.value = response.items
        .filter(item => item.id !== props.excludeId)
        .slice(0, 6)
        .map(item => ({
          ...item,
          locked: item.isPaid && !purchasesStore.isUnlocked(item.id),
        }))
    } catch (error_: unknown) {
      console.error('[ReadRecommendationsList] Failed to fetch:', error_)
      error.value = true
    } finally {
      loading.value = false
    }
  }

  // Watch for prop changes
  watch(() => [props.excludeId, props.authorName], () => {
    fetchRecommendations()
  })

  // Initial load
  onMounted(() => {
    fetchRecommendations()
  })
</script>
