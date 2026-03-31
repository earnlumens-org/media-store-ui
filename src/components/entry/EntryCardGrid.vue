<template>
  <v-infinite-scroll
    :disabled="!hasMorePages || loading"
    :empty-text="''"
    mode="intersect"
    @load="onInfiniteLoad"
  >
    <v-container class="py-4 px-1 px-sm-4" fluid>
      <!-- Content tabs -->
      <v-tabs
        v-model="activeTab"
        centered
        color="primary"
        grow
      >
        <v-tab value="all">
          <v-icon start>mdi-view-grid</v-icon>
          {{ $t('Profile.tabs.all') }}
        </v-tab>
        <v-tab value="collections">
          <v-icon start>mdi-folder-multiple</v-icon>
          {{ $t('Profile.tabs.collections') }}
        </v-tab>
        <v-tab value="video">
          <v-icon start>mdi-video</v-icon>
          {{ $t('Profile.tabs.video') }}
        </v-tab>
        <v-tab value="audio">
          <v-icon start>mdi-music</v-icon>
          {{ $t('Profile.tabs.audio') }}
        </v-tab>
        <v-tab value="image">
          <v-icon start>mdi-image</v-icon>
          {{ $t('Profile.tabs.image') }}
        </v-tab>
        <v-tab value="resource">
          <v-icon start>mdi-text-box</v-icon>
          {{ $t('Profile.tabs.resource') }}
        </v-tab>
      </v-tabs>

      <!-- Pricing Filter Chips -->
      <v-chip-group
        v-model="pricingFilter"
        class="mt-4"
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

      <!-- Loading state (initial load only) -->
      <v-row v-if="loading && feedItems.length === 0" class="mt-4" dense>
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
        class="ma-4 mt-4"
        closable
        type="error"
        @click:close="fetchFeed"
      >
        <template #title>
          Error
        </template>
        <template #text>
          Failed to load entries. Please try again.
        </template>
      </v-alert>

      <!-- Empty state (no items from API) -->
      <v-row v-else-if="feedItems.length === 0" class="mt-4" dense>
        <v-col cols="12">
          <v-alert
            class="ma-4"
            text="No published content yet. Be the first to upload!"
            title="Nothing here yet"
            type="info"
          />
        </v-col>
      </v-row>

      <!-- No items match filters -->
      <div
        v-else-if="filteredItems.length === 0"
        class="text-center py-12 text-medium-emphasis mt-4"
      >
        <v-icon class="mb-4" size="64">mdi-filter-off</v-icon>
        <p>{{ $t('Common.noItemsMatchFilters') }}</p>
        <v-btn
          class="mt-2"
          size="small"
          variant="text"
          @click="clearFilters"
        >
          {{ $t('Common.clearFilters') }}
        </v-btn>
      </div>

      <!-- Content cards (entries + collections mixed) -->
      <div v-else class="position-relative mt-4">
        <!-- Dimming overlay while switching filters -->
        <v-overlay
          v-model="switching"
          contained
          persistent
          scrim="background"
          class="align-center justify-center"
        >
          <v-progress-circular indeterminate size="48" />
        </v-overlay>

        <v-row dense>
          <v-col
            v-for="item in filteredItems"
            :key="item.id"
            cols="12"
            lg="3"
            md="4"
            sm="6"
            xxl="2"
          >
            <router-link
              v-if="item.kind === 'collection'"
              class="text-decoration-none"
              :to="`/collection/${item.id}`"
            >
              <CollectionCard :collection="toCollectionCardProps(item)" />
            </router-link>
            <EntryCard
              v-else
              :entry="toEntryCardProps(item)"
              :show-author="showAuthor"
            />
          </v-col>
        </v-row>
      </div>

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
  import type { PublicFeedItemModel } from '@/api/types/feed.types'
  import type { EntryModel } from '@/api/types/entryMock.types'
  import type { Entry } from '@/components/entry/EntryCard.vue'
  import type { Collection } from '@/components/collection/CollectionCard.vue'

  import axios from 'axios'
  import { computed, nextTick, onMounted, ref, watch } from 'vue'
  import { onBeforeRouteLeave, useRoute } from 'vue-router'

  import { api } from '@/api/api'
  import CollectionCard from '@/components/collection/CollectionCard.vue'
  import { isPopNavigation } from '@/router'
  import { useAppStore } from '@/stores/app'
  import { useAuthStore } from '@/stores/auth'
  import { useFeedCacheStore } from '@/stores/feedCache'
  import { usePurchasesStore } from '@/stores/purchases'
  import { useScrollCacheStore } from '@/stores/scrollCache'

  interface Props {
    showAuthor?: boolean
    pageSize?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    showAuthor: true,
    pageSize: 48,
  })

  const feedCache = useFeedCacheStore()
  const purchasesStore = usePurchasesStore()
  const authStore = useAuthStore()
  const appStore = useAppStore()
  const route = useRoute()
  const scrollCache = useScrollCacheStore()

  const feedItems = ref<PublicFeedItemModel[]>([])
  const loading = ref(true)
  const switching = ref(false)
  const error = ref(false)
  const currentPage = ref(0)
  const totalPages = ref(0)

  // Tabs & filter state
  const activeTab = ref('all')
  const pricingFilter = ref('all')

  // Fix #4: AbortController to cancel in-flight requests
  let fetchController: AbortController | null = null

  const hasMorePages = computed(() => currentPage.value < totalPages.value - 1)

  // Server-side params derived from UI state
  const feedTypeParam = computed(() => {
    if (activeTab.value === 'all') return undefined
    if (activeTab.value === 'collections') return 'collection'
    return activeTab.value // video, audio, image, resource
  })

  const feedPricingParam = computed(() => {
    if (pricingFilter.value === 'all') return undefined
    return pricingFilter.value // 'free' or 'premium'
  })

  // No client-side filtering — everything is server-side
  const filteredItems = computed(() => feedItems.value)

  function clearFilters () {
    activeTab.value = 'all'
    pricingFilter.value = 'all'
  }

  // Tab change resets pricing and re-fetches; suppress the pricing watcher
  let suppressFilterWatch = false

  watch(activeTab, () => {
    suppressFilterWatch = true
    pricingFilter.value = 'all'
    suppressFilterWatch = false
    refetchFeed()
  })

  watch(pricingFilter, () => {
    if (suppressFilterWatch) return
    refetchFeed()
  }, { flush: 'sync' })

  // Fix #3: Filter change keeps old cards visible with overlay
  function refetchFeed () {
    switching.value = true
    fetchFeed(true)
  }

  function toEntryCardProps (item: PublicFeedItemModel): Entry {
    const isOwner = authStore.isAuthenticated
      && authStore.user?.username === item.authorName
    const isUnlocked = item.isPaid && (isOwner || purchasesStore.isUnlocked(item.id))
    return {
      id: item.id,
      type: item.type as 'video' | 'audio' | 'image' | 'resource',
      title: item.title,
      authorName: item.authorName,
      authorAvatarUrl: item.authorAvatarUrl,
      publishedAt: item.publishedAt,
      thumbnailUrl: item.thumbnailUrl,
      durationSec: item.durationSec,
      locked: item.isPaid && !isUnlocked,
      unlocked: isUnlocked,
    }
  }

  function toCollectionCardProps (item: PublicFeedItemModel): Collection {
    const isOwner = authStore.isAuthenticated
      && authStore.user?.username === item.authorName
    const isUnlocked = item.isPaid && (isOwner || purchasesStore.isUnlocked(item.id))
    return {
      id: item.id,
      collectionType: item.type || 'catalog',
      title: item.title,
      authorName: item.authorName || '',
      authorAvatarUrl: item.authorAvatarUrl,
      publishedAt: item.publishedAt,
      coverUrl: item.coverUrl,
      itemsCount: item.itemCount,
      locked: item.isPaid && !isUnlocked,
      unlocked: isUnlocked,
    }
  }

  function cacheFeedEntries (items: PublicFeedItemModel[]) {
    for (const item of items) {
      if (item.kind !== 'entry') continue
      const entry: EntryModel = {
        id: item.id,
        type: item.type as 'video' | 'audio' | 'image' | 'resource',
        title: item.title,
        authorName: item.authorName,
        authorAvatarUrl: item.authorAvatarUrl,
        publishedAt: item.publishedAt,
        thumbnailUrl: item.thumbnailUrl,
        durationSec: item.durationSec,
        locked: item.isPaid,
      }
      feedCache.cacheEntry(entry, {
        priceXlm: item.priceXlm,
        priceUsd: item.priceUsd,
        priceCurrency: item.priceCurrency,
        description: item.description,
      })
    }
  }

  async function fetchFeed (isSwitch = false) {
    // Fix #4: Abort any in-flight request before starting a new one
    if (fetchController) {
      fetchController.abort()
    }
    fetchController = new AbortController()
    const signal = fetchController.signal

    if (!isSwitch) loading.value = true
    error.value = false

    try {
      const response = await api.entries.getExploreFeed({
        type: feedTypeParam.value,
        pricing: feedPricingParam.value,
        page: 0,
        size: props.pageSize,
      }, signal)
      feedItems.value = response.items
      cacheFeedEntries(response.items)
      currentPage.value = response.page
      totalPages.value = response.totalPages
    } catch (err: any) {
      if (axios.isCancel(err) || err?.code === 'ERR_CANCELED') return
      console.error('[EntryCardGrid] Failed to fetch feed:', err)
      error.value = true
    } finally {
      loading.value = false
      switching.value = false
    }
  }

  async function onInfiniteLoad ({ done }: { done: (status: 'ok' | 'empty' | 'error') => void }) {
    if (!hasMorePages.value) {
      done('empty')
      return
    }

    const controller = new AbortController()

    try {
      const response = await api.entries.getExploreFeed({
        type: feedTypeParam.value,
        pricing: feedPricingParam.value,
        page: currentPage.value + 1,
        size: props.pageSize,
      }, controller.signal)
      feedItems.value.push(...response.items)
      cacheFeedEntries(response.items)
      currentPage.value = response.page
      totalPages.value = response.totalPages

      done(hasMorePages.value ? 'ok' : 'empty')
    } catch (err: any) {
      if (axios.isCancel(err) || err?.code === 'ERR_CANCELED') return
      console.error('[EntryCardGrid] Failed to load more:', err)
      done('error')
    }
  }

  onBeforeRouteLeave(() => {
    if (feedItems.value.length > 0) {
      scrollCache.save(route.path, {
        items: [...feedItems.value],
        currentPage: currentPage.value,
        totalPages: totalPages.value,
        activeTab: activeTab.value,
        pricingFilter: pricingFilter.value,
        scrollY: window.scrollY,
      })
    }
  })

  onMounted(() => {
    const cached = scrollCache.get(route.path)
    if (cached && isPopNavigation()) {
      feedItems.value = cached.items as PublicFeedItemModel[]
      currentPage.value = cached.currentPage as number
      totalPages.value = cached.totalPages as number
      activeTab.value = (cached.activeTab as string) ?? 'all'
      pricingFilter.value = (cached.pricingFilter as string) ?? 'all'
      cacheFeedEntries(feedItems.value)
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
