<template>
  <v-container class="overflow-x-hidden py-4 px-1 px-sm-4" fluid>
    <!-- Page title -->
    <h1 class="text-h5 text-sm-h4 font-weight-bold mb-4 px-2 px-sm-0">
      {{ t('Purchased.title') }}
    </h1>

    <!-- Not authenticated -->
    <v-row v-if="authStore.isAuthReady && !authStore.isAuthenticated" dense>
      <v-col cols="12">
        <v-alert
          class="ma-4"
          icon="mdi-lock-outline"
          :text="t('Purchased.loginRequiredDescription')"
          :title="t('Purchased.loginRequired')"
          type="info"
        />
      </v-col>
    </v-row>

    <template v-else>
      <!-- Content tabs -->
      <v-tabs
        v-model="activeTab"
        centered
        color="primary"
        :disabled="loading"
        grow
      >
        <v-tab value="all">
          <v-icon start>mdi-view-grid</v-icon>
          {{ t('Profile.tabs.all') }}
        </v-tab>
        <v-tab value="collections">
          <v-icon start>mdi-folder-multiple</v-icon>
          {{ t('Profile.tabs.collections') }}
        </v-tab>
        <v-tab value="video">
          <v-icon start>mdi-video</v-icon>
          {{ t('Profile.tabs.video') }}
        </v-tab>
        <v-tab value="audio">
          <v-icon start>mdi-music</v-icon>
          {{ t('Profile.tabs.audio') }}
        </v-tab>
        <v-tab value="image">
          <v-icon start>mdi-image</v-icon>
          {{ t('Profile.tabs.image') }}
        </v-tab>
        <v-tab value="resource">
          <v-icon start>mdi-text-box</v-icon>
          {{ t('Profile.tabs.resource') }}
        </v-tab>
      </v-tabs>

      <!-- Filter / Search / Sort bar -->
      <div class="d-flex flex-wrap align-center ga-2 mt-4">
        <!-- Search -->
        <v-spacer />
        <v-text-field
          v-model="searchQuery"
          clearable
          density="compact"
          hide-details
          :placeholder="t('Common.searchItems')"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          width="200"
        />

        <!-- Sort Menu -->
        <v-menu>
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              :disabled="loading"
              icon="mdi-sort"
              variant="tonal"
            />
          </template>
          <v-list density="compact">
            <v-list-item
              :active="sortBy === 'recent'"
              :title="t('Common.mostRecent')"
              @click="sortBy = 'recent'"
            />
            <v-list-item
              :active="sortBy === 'title'"
              :title="t('Common.titleAZ')"
              @click="sortBy = 'title'"
            />
          </v-list>
        </v-menu>
      </div>

      <!-- Unified content grid -->
      <div class="mt-4">
        <!-- Loading state -->
        <v-row v-if="loading" dense>
          <v-col
            v-for="n in 12"
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
        <v-row v-else-if="error" dense>
          <v-col cols="12">
            <v-alert
              class="ma-4"
              closable
              :text="t('Purchased.errorDescription')"
              :title="t('Purchased.errorTitle')"
              type="error"
              @click:close="fetchFeed"
            />
          </v-col>
        </v-row>

        <!-- Empty state (no purchases at all) -->
        <v-row v-else-if="feedItems.length === 0" dense>
          <v-col cols="12">
            <v-alert
              class="ma-4"
              icon="mdi-cart-outline"
              :text="t('Purchased.emptyDescription')"
              :title="t('Purchased.empty')"
              type="info"
            />
          </v-col>
        </v-row>

        <!-- No items match filters -->
        <div
          v-else-if="filteredItems.length === 0"
          class="text-center py-12 text-medium-emphasis"
        >
          <v-icon class="mb-4" size="64">mdi-filter-off</v-icon>
          <p>{{ t('Common.noItemsMatchFilters') }}</p>
          <v-btn
            class="mt-2"
            size="small"
            variant="text"
            @click="clearFilters"
          >
            {{ t('Common.clearFilters') }}
          </v-btn>
        </div>

        <!-- Content cards (entries + collections mixed) -->
        <template v-else>
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
              <CollectionCard
                v-if="item.kind === 'collection'"
                :collection="toCollectionCardProps(item)"
              />
              <EntryCard
                v-else
                :entry="toEntryCardProps(item)"
              />
            </v-col>
          </v-row>

          <!-- Load more -->
          <v-row v-if="hasMorePages && !loading" dense>
            <v-col class="d-flex justify-center py-4" cols="12">
              <v-btn
                :loading="loadingMore"
                variant="outlined"
                @click="loadMore"
              >
                {{ t('Common.loadMore') }}
              </v-btn>
            </v-col>
          </v-row>
        </template>
      </div>
    </template>
  </v-container>
</template>

<script setup lang="ts">
  import type { PublicFeedItemModel } from '@/api/types/feed.types'
  import type { Entry } from '@/components/entry/EntryCard.vue'
  import type { Collection } from '@/components/collection/CollectionCard.vue'

  import { computed, nextTick, onMounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { onBeforeRouteLeave, useRoute } from 'vue-router'

  import { api } from '@/api/api'
  import CollectionCard from '@/components/collection/CollectionCard.vue'
  import EntryCard from '@/components/entry/EntryCard.vue'
  import EntryCardSkeleton from '@/components/entry/EntryCardSkeleton.vue'
  import { isPopNavigation } from '@/router'
  import { useAppStore } from '@/stores/app'
  import { useAuthStore } from '@/stores/auth'
  import { usePurchasesStore } from '@/stores/purchases'
  import { useScrollCacheStore } from '@/stores/scrollCache'

  const { t } = useI18n()
  const authStore = useAuthStore()
  const appStore = useAppStore()
  const purchasesStore = usePurchasesStore()
  const route = useRoute()
  const scrollCache = useScrollCacheStore()

  // Unified feed state
  const feedItems = ref<PublicFeedItemModel[]>([])
  const loading = ref(true)
  const loadingMore = ref(false)
  const error = ref(false)
  const currentPage = ref(0)
  const totalPages = ref(0)
  const PAGE_SIZE = 24

  // Tabs & filter state
  const activeTab = ref('all')
  const searchQuery = ref('')
  const sortBy = ref<'recent' | 'title'>('recent')

  const hasMorePages = computed(() => currentPage.value < totalPages.value - 1)

  // ── Client-side filtering (same pattern as Favorites) ──

  const filteredItems = computed(() => {
    let result = [...feedItems.value]

    // Filter by type tab
    if (activeTab.value === 'collections') {
      result = result.filter(item => item.kind === 'collection')
    } else if (activeTab.value !== 'all') {
      result = result.filter(item => {
        if (item.kind === 'entry') return item.type === activeTab.value
        return false
      })
    }

    // Filter by search
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(item =>
        item.title.toLowerCase().includes(query)
        || (item.authorName ?? '').toLowerCase().includes(query),
      )
    }

    // Sort
    if (sortBy.value === 'recent') {
      result.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    } else if (sortBy.value === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title))
    }

    return result
  })

  function clearFilters () {
    searchQuery.value = ''
    sortBy.value = 'recent'
  }

  function toEntryCardProps (item: PublicFeedItemModel): Entry {
    return {
      id: item.id,
      type: item.type as 'video' | 'audio' | 'image' | 'resource',
      title: item.title,
      authorName: item.authorName,
      authorAvatarUrl: item.authorAvatarUrl,
      profileBadge: item.profileBadge,
      publishedAt: item.publishedAt,
      thumbnailUrl: item.thumbnailUrl,
      durationSec: item.durationSec,
      locked: false,
      unlocked: item.isPaid,
    }
  }

  function toCollectionCardProps (item: PublicFeedItemModel): Collection {
    return {
      id: item.id,
      collectionType: item.type || 'catalog',
      title: item.title,
      authorName: item.authorName || '',
      authorAvatarUrl: item.authorAvatarUrl,
      profileBadge: item.profileBadge,
      publishedAt: item.publishedAt,
      coverUrl: item.coverUrl,
      itemsCount: item.itemCount,
      locked: false,
      unlocked: item.isPaid,
    }
  }

  function syncPurchasesStore (items: PublicFeedItemModel[]) {
    for (const item of items) {
      if (item.kind === 'entry' && !purchasesStore.isUnlocked(item.id)) {
        purchasesStore.markUnlocked(item.id, {
          type: item.type,
          title: item.title,
        })
      }
    }
  }

  async function fetchFeed () {
    if (!authStore.isAuthenticated) {
      loading.value = false
      return
    }

    loading.value = true
    error.value = false

    try {
      const response = await api.purchases.feed({
        page: 0,
        size: PAGE_SIZE,
      })
      feedItems.value = response.items
      currentPage.value = response.page
      totalPages.value = response.totalPages
      syncPurchasesStore(response.items)
    } catch (error_) {
      console.error('[Purchased] Failed to fetch purchases:', error_)
      error.value = true
    } finally {
      loading.value = false
    }
  }

  async function loadMore () {
    loadingMore.value = true
    try {
      const response = await api.purchases.feed({
        page: currentPage.value + 1,
        size: PAGE_SIZE,
      })
      feedItems.value.push(...response.items)
      currentPage.value = response.page
      totalPages.value = response.totalPages
      syncPurchasesStore(response.items)
    } catch (error_) {
      console.error('[Purchased] Failed to load more:', error_)
    } finally {
      loadingMore.value = false
    }
  }

  // Reset filters on tab change
  watch(activeTab, () => {
    searchQuery.value = ''
    sortBy.value = 'recent'
  })

  onBeforeRouteLeave(() => {
    if (feedItems.value.length > 0) {
      scrollCache.save(route.path, {
        feedItems: [...feedItems.value],
        currentPage: currentPage.value,
        totalPages: totalPages.value,
        activeTab: activeTab.value,
        searchQuery: searchQuery.value,
        sortBy: sortBy.value,
        scrollY: window.scrollY,
      })
    }
  })

  onMounted(() => {
    const cached = scrollCache.get(route.path)
    if (cached && isPopNavigation()) {
      feedItems.value = (cached.feedItems as PublicFeedItemModel[]) ?? []
      currentPage.value = cached.currentPage as number
      totalPages.value = cached.totalPages as number
      activeTab.value = (cached.activeTab as string) ?? 'all'
      searchQuery.value = (cached.searchQuery as string) ?? ''
      sortBy.value = (cached.sortBy as 'recent' | 'title') ?? 'recent'
      syncPurchasesStore(feedItems.value)
      loading.value = false

      nextTick(() => {
        window.scrollTo(0, cached.scrollY as number)
      })
    } else if (authStore.isAuthReady) {
      fetchFeed()
    }
  })

  watch(() => authStore.isAuthReady, (ready) => {
    if (ready && feedItems.value.length === 0 && loading.value) {
      fetchFeed()
    }
  })

  watch(() => appStore.refreshKey, () => {
    window.scrollTo(0, 0)
    fetchFeed()
  })
</script>

<route lang="json">
{
  "path": "/purchased",
  "meta": {
    "requiresAuth": true
  }
}
</route>
