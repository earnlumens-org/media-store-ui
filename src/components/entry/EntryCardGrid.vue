<template>
  <v-infinite-scroll
    :disabled="!hasMorePages || loading"
    :empty-text="''"
    mode="intersect"
    @load="onInfiniteLoad"
  >
    <v-container class="py-4 px-1 px-sm-4" fluid>
      <!-- Loading state (initial load) -->
      <v-row v-if="loading" dense>
        <v-col
          v-for="n in 36"
          :key="`skeleton-${n}`"
          cols="12"
          lg="3"
          md="4"
          sm="6"
          xxl="2"
        >
          <EntryCardSkeleton />
        </v-col>
      </v-row>

      <!-- Error state -->
      <v-alert
        v-else-if="error"
        class="ma-4"
        closable
        text="Failed to load entries. Please try again."
        title="Error"
        type="error"
        @click:close="fetchEntries"
      />

      <!-- Empty state -->
      <v-row v-else-if="entries.length === 0" dense>
        <v-col cols="12">
          <v-alert
            class="ma-4"
            text="No published content yet. Be the first to upload!"
            title="Nothing here yet"
            type="info"
          />
        </v-col>
      </v-row>

      <!-- Entry cards -->
      <v-row v-else dense>
        <v-col
          v-for="item in entries"
          :key="item.id"
          cols="12"
          lg="3"
          md="4"
          sm="6"
          xxl="2"
        >
          <EntryCard
            :entry="toEntryCardProps(item)"
            :show-author="showAuthor"
          />
        </v-col>
      </v-row>
    </v-container>

    <template #loading>
      <v-container class="py-4 px-1 px-sm-4" fluid>
        <v-row dense>
          <v-col
            cols="12"
            lg="3"
            md="4"
            sm="6"
            xxl="2"
          >
            <EntryCardSkeleton />
          </v-col>
          <v-col
            class="d-none d-sm-flex"
            lg="3"
            md="4"
            sm="6"
            xxl="2"
          >
            <EntryCardSkeleton />
          </v-col>
          <v-col
            class="d-none d-md-flex"
            lg="3"
            md="4"
            xxl="2"
          >
            <EntryCardSkeleton />
          </v-col>
          <v-col
            class="d-none d-lg-flex"
            lg="3"
            xxl="2"
          >
            <EntryCardSkeleton />
          </v-col>
          <v-col
            class="d-none d-xxl-flex"
            xxl="2"
          >
            <EntryCardSkeleton />
          </v-col>
          <v-col
            class="d-none d-xxl-flex"
            xxl="2"
          >
            <EntryCardSkeleton />
          </v-col>
        </v-row>
      </v-container>
    </template>
  </v-infinite-scroll>
</template>

<script setup lang="ts">
  import type { PublicEntryModel } from '@/api/api'
  import type { Entry } from '@/components/entry/EntryCard.vue'

  import { computed, onMounted, ref } from 'vue'

  import { api } from '@/api/api'

  interface Props {
    showAuthor?: boolean
    pageSize?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    showAuthor: true,
    pageSize: 48,
  })

  const entries = ref<PublicEntryModel[]>([])
  const loading = ref(true)
  const error = ref(false)
  const currentPage = ref(0)
  const totalPages = ref(0)

  const hasMorePages = computed(() => currentPage.value < totalPages.value - 1)

  /**
   * Maps a PublicEntryModel to the Entry interface expected by EntryCard.
   */
  function toEntryCardProps (item: PublicEntryModel): Entry {
    return {
      id: item.id,
      type: item.type === 'file' ? 'entry' : item.type,
      title: item.title,
      authorName: item.authorName,
      authorAvatarUrl: item.authorAvatarUrl,
      publishedAt: item.publishedAt,
      thumbnailUrl: item.thumbnailUrl,
      durationSec: item.durationSec,
      locked: item.isPaid,
    }
  }

  async function fetchEntries () {
    loading.value = true
    error.value = false

    try {
      const response = await api.entries.getPublished({
        page: 0,
        size: props.pageSize,
      })
      entries.value = response.items
      currentPage.value = response.page
      totalPages.value = response.totalPages
    } catch (error_) {
      console.error('[EntryCardGrid] Failed to fetch entries:', error_)
      error.value = true
    } finally {
      loading.value = false
    }
  }

  async function onInfiniteLoad ({ done }: { done: (status: 'ok' | 'empty' | 'error') => void }) {
    if (!hasMorePages.value) {
      done('empty')
      return
    }

    try {
      const response = await api.entries.getPublished({
        page: currentPage.value + 1,
        size: props.pageSize,
      })
      entries.value.push(...response.items)
      currentPage.value = response.page
      totalPages.value = response.totalPages

      done(hasMorePages.value ? 'ok' : 'empty')
    } catch (error_) {
      console.error('[EntryCardGrid] Failed to load more:', error_)
      done('error')
    }
  }

  onMounted(() => {
    fetchEntries()
  })
</script>
