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
        text="Failed to load feed. Please try again."
        title="Error"
        type="error"
        @click:close="fetchFeed"
      />

      <!-- Feed content -->
      <v-row v-else dense>
        <v-col
          v-for="item in feed"
          :key="itemKey(item)"
          cols="12"
          lg="3"
          md="4"
          sm="6"
          xxl="2"
        >
          <EntryCard
            v-if="item.kind === 'entry'"
            :entry="item.entry"
            :show-author="showAuthor"
          />
          <CollectionCard
            v-else
            :collection="item.collection"
            :show-author="showAuthor"
          />
        </v-col>
      </v-row>
    </v-container>

    <template #loading>
      <v-container class="py-4 px-1 px-sm-4" fluid>
        <v-row dense>
          <!-- Skeleton 1: always visible (xs+) -->
          <v-col
            cols="12"
            lg="3"
            md="4"
            sm="6"
            xxl="2"
          >
            <EntryCardSkeleton />
          </v-col>
          <!-- Skeleton 2: visible from sm+ -->
          <v-col
            class="d-none d-sm-flex"
            lg="3"
            md="4"
            sm="6"
            xxl="2"
          >
            <EntryCardSkeleton />
          </v-col>
          <!-- Skeleton 3: visible from md+ -->
          <v-col
            class="d-none d-md-flex"
            lg="3"
            md="4"
            xxl="2"
          >
            <EntryCardSkeleton />
          </v-col>
          <!-- Skeleton 4: visible from lg+ -->
          <v-col
            class="d-none d-lg-flex"
            lg="3"
            xxl="2"
          >
            <EntryCardSkeleton />
          </v-col>
          <!-- Skeleton 5: visible from xxl+ -->
          <v-col
            class="d-none d-xxl-flex"
            xxl="2"
          >
            <EntryCardSkeleton />
          </v-col>
          <!-- Skeleton 6: visible from xxl+ -->
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
  import type { FeedItemModel } from '@/api/api'

  import { computed, onMounted, ref } from 'vue'

  import { api } from '@/api/api'

  interface Props {
    /** Whether to show author info on cards (UI design decision) */
    showAuthor?: boolean
    /** Number of items per page */
    pageSize?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    showAuthor: true,
    pageSize: 48,
  })

  const feed = ref<FeedItemModel[]>([])
  const loading = ref(true)
  const error = ref(false)
  const currentPage = ref(0)
  const totalPages = ref(0)

  const hasMorePages = computed(() => currentPage.value < totalPages.value - 1)

  function itemKey (item: FeedItemModel) {
    return item.kind === 'entry'
      ? `entry-${item.entry.id}`
      : `collection-${item.collection.id}`
  }

  async function fetchFeed () {
    loading.value = true
    error.value = false

    try {
      const response = await api.mock.getFeed({
        page: 0,
        size: props.pageSize,
      })
      feed.value = response.items
      currentPage.value = response.page
      totalPages.value = response.totalPages
    } catch (error_) {
      console.error('[EntryCardMockGrid] Failed to fetch feed:', error_)
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
      const response = await api.mock.getFeed({
        page: currentPage.value + 1,
        size: props.pageSize,
      })
      feed.value.push(...response.items)
      currentPage.value = response.page
      totalPages.value = response.totalPages

      done(hasMorePages.value ? 'ok' : 'empty')
    } catch (error_) {
      console.error('[EntryCardMockGrid] Failed to load more:', error_)
      done('error')
    }
  }

  onMounted(() => {
    fetchFeed()
  })
</script>
