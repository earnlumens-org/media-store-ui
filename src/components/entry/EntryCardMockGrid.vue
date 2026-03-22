<template>
  <v-infinite-scroll
    :disabled="!hasMorePages || loading"
    :empty-text="''"
    mode="intersect"
    @load="onInfiniteLoad"
  >
    <v-container class="py-4 px-1 px-sm-4" fluid>
      <!-- Pricing filter chips -->
      <v-chip-group
        v-if="!loading && !error && feed.length > 0"
        v-model="pricingFilter"
        class="mb-2"
        mandatory
        selected-class="text-primary"
      >
        <v-chip filter size="small" value="all" variant="tonal">
          {{ $t('Common.all') }}
        </v-chip>
        <v-chip filter size="small" value="free" variant="tonal">
          {{ $t('Common.free') }}
        </v-chip>
        <v-chip filter size="small" value="premium" variant="tonal">
          <v-icon size="14" start>mdi-lock</v-icon>
          {{ $t('Common.premium') }}
        </v-chip>
      </v-chip-group>

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
          v-for="item in filteredFeed"
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
  import type { FeedPageModel, FeedRequestParams } from '@/api/api'
  import type { FeedItemModel } from '@/api/api'

  import { computed, nextTick, onMounted, ref, watch } from 'vue'
  import { onBeforeRouteLeave, useRoute } from 'vue-router'

  import { api } from '@/api/api'
  import { isPopNavigation } from '@/router'
  import { useAppStore } from '@/stores/app'
  import { useFeedCacheStore } from '@/stores/feedCache'
  import { useScrollCacheStore } from '@/stores/scrollCache'

  interface Props {
    /** Whether to show author info on cards (UI design decision) */
    showAuthor?: boolean
    /** Number of items per page */
    pageSize?: number
    /** Custom feed function (defaults to api.mock.getFeed) */
    feedFn?: (params: FeedRequestParams) => Promise<FeedPageModel>
  }

  const props = withDefaults(defineProps<Props>(), {
    showAuthor: true,
    pageSize: 48,
    feedFn: undefined,
  })

  const feedCache = useFeedCacheStore()
  const appStore = useAppStore()
  const route = useRoute()
  const scrollCache = useScrollCacheStore()

  const feed = ref<FeedItemModel[]>([])
  const loading = ref(true)
  const error = ref(false)
  const currentPage = ref(0)
  const totalPages = ref(0)
  const pricingFilter = ref('all')

  const hasMorePages = computed(() => currentPage.value < totalPages.value - 1)

  const filteredFeed = computed(() => {
    if (pricingFilter.value === 'all') return feed.value
    const isPremium = pricingFilter.value === 'premium'
    return feed.value.filter(item => {
      const locked = item.kind === 'entry' ? item.entry.locked : item.collection.locked
      return isPremium ? !!locked : !locked
    })
  })

  const fetchFeedFn = computed(() => props.feedFn ?? api.mock.getFeed)

  function itemKey (item: FeedItemModel) {
    return item.kind === 'entry'
      ? `entry-${item.entry.id}`
      : `collection-${item.collection.id}`
  }

  async function fetchFeed () {
    loading.value = true
    error.value = false

    try {
      const response = await fetchFeedFn.value({
        page: 0,
        size: props.pageSize,
      })
      feed.value = response.items
      cacheItems(response.items)
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
      const response = await fetchFeedFn.value({
        page: currentPage.value + 1,
        size: props.pageSize,
      })
      feed.value.push(...response.items)
      cacheItems(response.items)
      currentPage.value = response.page
      totalPages.value = response.totalPages

      done(hasMorePages.value ? 'ok' : 'empty')
    } catch (error_) {
      console.error('[EntryCardMockGrid] Failed to load more:', error_)
      done('error')
    }
  }

  function cacheItems (items: FeedItemModel[]) {
    for (const item of items) {
      if (item.kind === 'entry') {
        feedCache.cacheEntry(item.entry)
      } else {
        feedCache.cacheCollection(item.collection)
      }
    }
  }

  onBeforeRouteLeave(() => {
    if (feed.value.length > 0) {
      scrollCache.save(route.path, {
        items: [...feed.value],
        currentPage: currentPage.value,
        totalPages: totalPages.value,
        scrollY: window.scrollY,
      })
    }
  })

  onMounted(() => {
    const cached = scrollCache.get(route.path)
    if (cached && isPopNavigation()) {
      feed.value = cached.items as FeedItemModel[]
      currentPage.value = cached.currentPage as number
      totalPages.value = cached.totalPages as number
      cacheItems(feed.value)
      loading.value = false

      nextTick(() => {
        window.scrollTo(0, cached.scrollY as number)
      })
    } else {
      fetchFeed()
    }
  })

  watch(() => appStore.refreshKey, () => {
    window.scrollTo(0, 0)
    fetchFeed()
  })
</script>
