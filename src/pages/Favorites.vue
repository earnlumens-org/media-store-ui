<template>
  <v-container class="overflow-x-hidden py-4 px-1 px-sm-4" fluid>
    <!-- Login required -->
    <v-row v-if="auth.isAuthReady && !auth.isAuthenticated" justify="center" no-gutters>
      <v-col cols="12" md="6">
        <v-empty-state
          icon="mdi-heart-outline"
          :text="$t('Favorites.loginRequiredDescription')"
          :title="$t('Favorites.loginRequired')"
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

      <!-- Filter / Search / Sort bar -->
      <div class="d-flex flex-wrap align-center ga-2 mt-4">
        <!-- Pricing Filter Chips -->
        <v-chip-group
          v-model="pricingFilter"
          class="flex-grow-1"
          :disabled="loading"
          mandatory
          selected-class="text-primary"
        >
          <v-chip :disabled="loading" filter size="small" value="all" variant="tonal">
            {{ $t('Common.all') }}
          </v-chip>
          <v-chip :disabled="loading" filter size="small" value="free" variant="tonal">
            {{ $t('Common.free') }}
          </v-chip>
          <v-chip :disabled="loading" filter size="small" value="premium" variant="tonal">
            <v-icon size="14" start>mdi-lock</v-icon>
            {{ $t('Common.premium') }}
          </v-chip>
        </v-chip-group>

        <!-- Search -->
        <v-text-field
          v-model="searchQuery"
          clearable
          density="compact"
          :disabled="loading"
          hide-details
          :placeholder="$t('Common.searchItems')"
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
              :title="$t('Common.mostRecent')"
              @click="sortBy = 'recent'"
            />
            <v-list-item
              :active="sortBy === 'title'"
              :title="$t('Common.titleAZ')"
              @click="sortBy = 'title'"
            />
          </v-list>
        </v-menu>
      </div>

      <!-- Entry grid -->
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
        <v-alert
          v-else-if="error"
          class="ma-4"
          closable
          :text="$t('Favorites.errorDescription')"
          :title="$t('Favorites.errorTitle')"
          type="error"
          @click:close="fetchFavorites"
        />

        <!-- Empty state (no items from API) -->
        <v-row v-else-if="favorites.length === 0" justify="center" no-gutters>
          <v-col cols="12" md="6">
            <v-empty-state
              icon="mdi-heart-outline"
              :text="$t('Favorites.emptyDescription')"
              :title="$t('Favorites.empty')"
            />
          </v-col>
        </v-row>

        <!-- No items match filters -->
        <div
          v-else-if="filteredFavorites.length === 0"
          class="text-center py-12 text-medium-emphasis"
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

        <!-- Favorites grid -->
        <v-row v-else dense>
          <v-col
            v-for="item in filteredFavorites"
            :key="item.id"
            cols="12"
            lg="3"
            md="4"
            sm="6"
            xxl="2"
          >
            <EntryCard
              v-if="item.itemType === 'entry'"
              :entry="toEntryProps(item)"
            />
            <CollectionCard
              v-else
              :collection="toCollectionProps(item)"
            />
          </v-col>
        </v-row>

        <!-- Load more -->
        <v-row v-if="hasMorePages && !loading" justify="center">
          <v-btn
            class="my-4"
            :loading="loadingMore"
            variant="outlined"
            @click="loadMore"
          >
            {{ $t('Common.loadMore') }}
          </v-btn>
        </v-row>
      </div>
    </template>
  </v-container>
</template>

<script setup lang="ts">
  import type { FavoriteItemModel } from '@/api/types/favorite.types'
  import type { Collection } from '@/components/collection/CollectionCard.vue'
  import type { Entry } from '@/components/entry/EntryCard.vue'

  import { computed, nextTick, onMounted, ref, watch } from 'vue'
  import { onBeforeRouteLeave, useRoute } from 'vue-router'

  import { api } from '@/api/api'
  import CollectionCard from '@/components/collection/CollectionCard.vue'
  import EntryCard from '@/components/entry/EntryCard.vue'
  import EntryCardSkeleton from '@/components/entry/EntryCardSkeleton.vue'
  import { isPopNavigation } from '@/router'
  import { useAppStore } from '@/stores/app'
  import { useAuthStore } from '@/stores/auth'
  import { useScrollCacheStore } from '@/stores/scrollCache'

  const auth = useAuthStore()
  const appStore = useAppStore()
  const route = useRoute()
  const scrollCache = useScrollCacheStore()

  const favorites = ref<FavoriteItemModel[]>([])
  const loading = ref(true)
  const loadingMore = ref(false)
  const error = ref(false)
  const currentPage = ref(0)
  const totalPages = ref(0)

  // Tabs & filter state
  const activeTab = ref('all')
  const pricingFilter = ref('all')
  const searchQuery = ref('')
  const sortBy = ref<'recent' | 'title'>('recent')

  const hasMorePages = computed(() => currentPage.value < totalPages.value - 1)

  const filteredFavorites = computed(() => {
    let result = [...favorites.value]

    // Filter by type tab
    if (activeTab.value === 'collections') {
      result = result.filter(item => item.itemType === 'collection')
    } else if (activeTab.value !== 'all') {
      result = result.filter(item => {
        if (item.itemType === 'entry') return item.entryType === activeTab.value
        return false
      })
    }

    // Filter by pricing
    if (pricingFilter.value === 'free') {
      result = result.filter(item => !item.locked)
    } else if (pricingFilter.value === 'premium') {
      result = result.filter(item => item.locked)
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
    pricingFilter.value = 'all'
    searchQuery.value = ''
    sortBy.value = 'recent'
  }

  // Reset filters on tab change
  watch(activeTab, () => {
    pricingFilter.value = 'all'
    searchQuery.value = ''
    sortBy.value = 'recent'
  })

  async function fetchFavorites () {
    if (!auth.isAuthenticated) {
      loading.value = false
      return
    }

    loading.value = true
    error.value = false

    try {
      const response = await api.favorites.list({ page: 0, size: 24 })
      favorites.value = response.items
      currentPage.value = response.page
      totalPages.value = Math.ceil(response.totalElements / response.size)
    } catch {
      error.value = true
    } finally {
      loading.value = false
    }
  }

  async function loadMore () {
    loadingMore.value = true
    try {
      const response = await api.favorites.list({
        page: currentPage.value + 1,
        size: 24,
      })
      favorites.value.push(...response.items)
      currentPage.value = response.page
      totalPages.value = Math.ceil(response.totalElements / response.size)
    } catch {
      // Silently fail on load-more
    } finally {
      loadingMore.value = false
    }
  }

  function toEntryProps (item: FavoriteItemModel): Entry {
    return {
      id: item.itemId,
      type: item.entryType ?? 'resource',
      title: item.title,
      authorName: item.authorName ?? '',
      authorAvatarUrl: item.authorAvatarUrl,
      publishedAt: item.publishedAt,
      thumbnailUrl: item.thumbnailUrl,
      durationSec: item.durationSec,
      locked: item.locked,
      unlocked: item.unlocked,
    }
  }

  function toCollectionProps (item: FavoriteItemModel): Collection {
    return {
      id: item.itemId,
      collectionType: item.collectionType ?? 'list',
      title: item.title,
      authorName: item.authorName ?? '',
      authorAvatarUrl: item.authorAvatarUrl,
      publishedAt: item.publishedAt,
      coverUrl: item.coverUrl,
      itemsCount: item.itemsCount,
      locked: item.locked,
      unlocked: item.unlocked,
    }
  }

  onBeforeRouteLeave(() => {
    if (favorites.value.length > 0) {
      scrollCache.save(route.path, {
        items: [...favorites.value],
        currentPage: currentPage.value,
        totalPages: totalPages.value,
        activeTab: activeTab.value,
        pricingFilter: pricingFilter.value,
        searchQuery: searchQuery.value,
        sortBy: sortBy.value,
        scrollY: window.scrollY,
      })
    }
  })

  onMounted(() => {
    const cached = scrollCache.get(route.path)
    if (cached && isPopNavigation()) {
      favorites.value = cached.items as FavoriteItemModel[]
      currentPage.value = cached.currentPage as number
      totalPages.value = cached.totalPages as number
      activeTab.value = (cached.activeTab as string) ?? 'all'
      pricingFilter.value = (cached.pricingFilter as string) ?? 'all'
      searchQuery.value = (cached.searchQuery as string) ?? ''
      sortBy.value = (cached.sortBy as 'recent' | 'title') ?? 'recent'
      loading.value = false

      nextTick(() => {
        window.scrollTo(0, cached.scrollY as number)
      })
    } else if (auth.isAuthReady) {
      fetchFavorites()
    }
  })

  watch(() => auth.isAuthReady, (ready) => {
    if (ready && favorites.value.length === 0 && loading.value) {
      fetchFavorites()
    }
  })

  watch(() => appStore.refreshKey, () => {
    window.scrollTo(0, 0)
    fetchFavorites()
  })
</script>

<route lang="json">
{
  "path": "/favorites"
}
</route>
