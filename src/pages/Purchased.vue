<template>
  <v-container class="py-4 px-1 px-sm-4" fluid>
    <!-- Page title -->
    <h1 class="text-h5 text-sm-h4 font-weight-bold mb-4 px-2 px-sm-0">
      {{ t('Purchased.title') }}
    </h1>

    <!-- Not authenticated -->
    <v-row v-if="!authStore.isAuthenticated" dense>
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
        grow
      >
        <v-tab value="all">
          <v-icon start>mdi-view-grid</v-icon>
          {{ t('Profile.tabs.all') }}
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
        <v-tab value="collections">
          <v-icon start>mdi-folder-multiple</v-icon>
          {{ t('Common.collections') }}
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
          :disabled="loading"
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

      <!-- Entry grid (entries tabs) -->
      <div v-if="activeTab !== 'collections'" class="mt-4">
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
              @click:close="fetchPurchases"
            />
          </v-col>
        </v-row>

        <!-- Empty state -->
        <v-row v-else-if="entries.length === 0" dense>
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
          v-else-if="filteredEntries.length === 0"
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

        <!-- Purchased entries grid -->
        <template v-else>
          <v-row dense>
            <v-col
              v-for="item in filteredEntries"
              :key="item.id"
              cols="12"
              lg="3"
              md="4"
              sm="6"
              xxl="2"
            >
              <EntryCard
                :entry="toEntryCardProps(item)"
              />
            </v-col>
          </v-row>

          <!-- Load more -->
          <v-row v-if="hasMorePages" dense>
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

      <!-- Collections grid (collections tab) -->
      <div v-if="activeTab === 'collections'" class="mt-4">
        <!-- Loading state -->
        <v-row v-if="collectionsLoading" dense>
          <v-col
            v-for="n in 8"
            :key="`coll-skeleton-${n}`"
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
        <v-row v-else-if="collectionsError" dense>
          <v-col cols="12">
            <v-alert
              class="ma-4"
              closable
              :text="t('Purchased.errorDescription')"
              :title="t('Purchased.errorTitle')"
              type="error"
              @click:close="fetchCollections"
            />
          </v-col>
        </v-row>

        <!-- Empty state -->
        <v-row v-else-if="collections.length === 0" dense>
          <v-col cols="12">
            <v-alert
              class="ma-4"
              icon="mdi-folder-multiple-outline"
              :text="t('Purchased.emptyDescription')"
              :title="t('Purchased.empty')"
              type="info"
            />
          </v-col>
        </v-row>

        <!-- Collection cards -->
        <template v-else>
          <v-row dense>
            <v-col
              v-for="item in collections"
              :key="item.id"
              cols="12"
              lg="3"
              md="4"
              sm="6"
              xxl="2"
            >
              <CollectionCard
                :collection="toCollectionCardProps(item)"
              />
            </v-col>
          </v-row>

          <!-- Load more -->
          <v-row v-if="collectionsHasMorePages" dense>
            <v-col class="d-flex justify-center py-4" cols="12">
              <v-btn
                :loading="collectionsLoadingMore"
                variant="outlined"
                @click="loadMoreCollections"
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
  import type { PurchasedCollectionModel, PurchasedEntryModel } from '@/api/types/purchase.types'
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

  const entries = ref<PurchasedEntryModel[]>([])
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

  // Collections state
  const collections = ref<PurchasedCollectionModel[]>([])
  const collectionsLoading = ref(false)
  const collectionsLoadingMore = ref(false)
  const collectionsError = ref(false)
  const collectionsCurrentPage = ref(0)
  const collectionsTotalPages = ref(0)
  const collectionsHasMorePages = computed(() => collectionsCurrentPage.value < collectionsTotalPages.value - 1)

  const filteredEntries = computed(() => {
    let result = [...entries.value]

    // Filter by type tab
    if (activeTab.value !== 'all') {
      result = result.filter(item => item.type === activeTab.value)
    }

    // Filter by search
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(item =>
        item.title.toLowerCase().includes(query)
        || item.authorName.toLowerCase().includes(query),
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

  // Reset filters on tab change & fetch collections on demand
  watch(activeTab, (newTab) => {
    searchQuery.value = ''
    sortBy.value = 'recent'
    if (newTab === 'collections' && collections.value.length === 0 && !collectionsLoading.value) {
      fetchCollections()
    }
  })

  function toEntryCardProps (item: PurchasedEntryModel): Entry {
    return {
      id: item.id,
      type: item.type,
      title: item.title,
      authorName: item.authorName,
      authorAvatarUrl: item.authorAvatarUrl,
      publishedAt: item.publishedAt,
      thumbnailUrl: item.thumbnailUrl,
      durationSec: item.durationSec,
      locked: false,
      unlocked: true,
    }
  }

  function syncPurchasesStore (items: PurchasedEntryModel[]) {
    for (const item of items) {
      if (!purchasesStore.isUnlocked(item.id)) {
        purchasesStore.markUnlocked(item.id, {
          type: item.type,
          title: item.title,
        })
      }
    }
  }

  async function fetchPurchases () {
    if (!authStore.isAuthenticated) {
      loading.value = false
      return
    }

    loading.value = true
    error.value = false

    try {
      const response = await api.purchases.list({ page: 0, size: PAGE_SIZE })
      entries.value = response.items
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
      const response = await api.purchases.list({
        page: currentPage.value + 1,
        size: PAGE_SIZE,
      })
      entries.value.push(...response.items)
      currentPage.value = response.page
      totalPages.value = response.totalPages
      syncPurchasesStore(response.items)
    } catch (error_) {
      console.error('[Purchased] Failed to load more:', error_)
    } finally {
      loadingMore.value = false
    }
  }

  function toCollectionCardProps (item: PurchasedCollectionModel): Collection {
    return {
      id: item.id,
      collectionType: item.collectionType || 'collection',
      title: item.title,
      authorName: item.authorName || '',
      authorAvatarUrl: item.authorAvatarUrl,
      publishedAt: item.publishedAt,
      coverUrl: item.coverUrl,
      itemsCount: item.itemCount,
      locked: false,
      unlocked: true,
    }
  }

  async function fetchCollections () {
    if (!authStore.isAuthenticated) return

    collectionsLoading.value = true
    collectionsError.value = false

    try {
      const response = await api.purchases.collections({ page: 0, size: PAGE_SIZE })
      collections.value = response.items
      collectionsCurrentPage.value = response.page
      collectionsTotalPages.value = response.totalPages
    } catch (error_) {
      console.error('[Purchased] Failed to fetch collections:', error_)
      collectionsError.value = true
    } finally {
      collectionsLoading.value = false
    }
  }

  async function loadMoreCollections () {
    collectionsLoadingMore.value = true
    try {
      const response = await api.purchases.collections({
        page: collectionsCurrentPage.value + 1,
        size: PAGE_SIZE,
      })
      collections.value.push(...response.items)
      collectionsCurrentPage.value = response.page
      collectionsTotalPages.value = response.totalPages
    } catch (error_) {
      console.error('[Purchased] Failed to load more collections:', error_)
    } finally {
      collectionsLoadingMore.value = false
    }
  }

  onBeforeRouteLeave(() => {
    if (entries.value.length > 0) {
      scrollCache.save(route.path, {
        items: [...entries.value],
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
      entries.value = cached.items as PurchasedEntryModel[]
      currentPage.value = cached.currentPage as number
      totalPages.value = cached.totalPages as number
      activeTab.value = (cached.activeTab as string) ?? 'all'
      searchQuery.value = (cached.searchQuery as string) ?? ''
      sortBy.value = (cached.sortBy as 'recent' | 'title') ?? 'recent'
      syncPurchasesStore(entries.value)
      loading.value = false

      nextTick(() => {
        window.scrollTo(0, cached.scrollY as number)
      })
    } else {
      fetchPurchases()
    }
  })

  watch(() => appStore.refreshKey, () => {
    window.scrollTo(0, 0)
    fetchPurchases()
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
