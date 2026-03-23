<template>
  <!-- Loading state -->
  <v-container v-if="loading" class="fill-height">
    <v-row align="center" justify="center">
      <v-col class="text-center" cols="12">
        <v-progress-circular color="primary" indeterminate size="64" />
        <p class="mt-4 text-medium-emphasis">{{ $t('Profile.loading') }}</p>
      </v-col>
    </v-row>
  </v-container>

  <!-- User not found -->
  <v-container v-else-if="!user" class="py-8">
    <v-row justify="center">
      <v-col cols="12" lg="6" md="8">
        <div class="text-center py-12">
          <v-avatar class="mb-6" size="120">
            <v-icon color="grey" size="64">mdi-account-off</v-icon>
          </v-avatar>
          <h1 class="text-h4 mb-2">{{ $t('Profile.notFound') }}</h1>
          <p class="text-body-1 text-medium-emphasis mb-6">
            {{ $t('Profile.notFoundDescription', { username: requestedUsername }) }}
          </p>
          <v-btn color="primary" to="/" variant="tonal">
            <v-icon start>mdi-home</v-icon>
            {{ $t('Profile.goHome') }}
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>

  <!-- User profile -->
  <v-container v-else class="py-6 py-md-10">
    <!-- Profile header -->
    <v-row align="center" justify="center">
      <v-col cols="12" lg="8" md="10">
        <div class="position-relative" style="max-width: 500px; margin: 0 auto;">
          <!-- Options menu (top right) -->
          <v-menu location="bottom end">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                :aria-label="$t('Common.moreOptions')"
                class="position-absolute"
                icon="mdi-dots-vertical"
                size="small"
                style="top: 0; right: 0; z-index: 1"
                variant="text"
              />
            </template>
            <v-list density="compact" min-width="200">
              <v-list-item
                v-if="user?.username"
                :href="`https://x.com/${user.username}`"
                rel="noopener noreferrer"
                target="_blank"
              >
                <template #prepend>
                  <v-icon size="small">mdi-open-in-new</v-icon>
                </template>
                <v-list-item-title>{{ $t('Account.viewOnX') }}</v-list-item-title>
              </v-list-item>
              <v-list-item @click="copyProfileLink">
                <template #prepend>
                  <v-icon size="small">mdi-link-variant</v-icon>
                </template>
                <v-list-item-title>{{ $t('Account.copyProfileLink') }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          <div class="d-flex flex-column flex-sm-row align-center align-sm-start ga-4 ga-sm-6">
            <!-- Avatar -->
            <v-avatar class="flex-shrink-0" size="120">
              <v-img
                v-if="user.profileImageUrl"
                :alt="user.displayName"
                :src="user.profileImageUrl"
              />
              <v-icon v-else color="grey" size="64">mdi-account</v-icon>
            </v-avatar>

            <!-- Info -->
            <div class="text-center text-sm-start flex-grow-1">
              <h1 class="text-h5 text-sm-h4 font-weight-bold mb-1">
                @{{ user.username }}
              </h1>
              <p class="text-body-1 text-medium-emphasis mb-2">
                {{ user.displayName }}
              </p>
              <p class="text-body-2 text-medium-emphasis mb-4">
                {{ user.followersCount?.toLocaleString() ?? 0 }} {{ $t('Account.followers') }}
              </p>

              <!-- Action buttons -->
              <div class="d-flex flex-wrap justify-center justify-sm-start ga-2">
                <CxSubscribeButton
                  v-if="user.id"
                  :target-user-id="user.id"
                />
                <v-btn
                  disabled
                  rounded="pill"
                  variant="outlined"
                >
                  {{ $t('Profile.message') }}
                </v-btn>
              </div>
            </div>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Content tabs -->
    <v-row class="mt-8" justify="center">
      <v-col cols="12">
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
          <v-tab value="collections">
            <v-icon start>mdi-folder-multiple</v-icon>
            {{ $t('Profile.tabs.collections') }}
          </v-tab>
        </v-tabs>

        <!-- Collections tab content -->
        <div v-if="activeTab === 'collections'" class="mt-4">
          <!-- Loading -->
          <v-row v-if="collectionsLoading" dense>
            <v-col
              v-for="n in 6"
              :key="`coll-skeleton-${n}`"
              cols="12"
              lg="3"
              md="4"
              sm="6"
              xxl="2"
            >
              <v-skeleton-loader type="card" />
            </v-col>
          </v-row>

          <!-- Empty -->
          <div
            v-else-if="collections.length === 0"
            class="text-center py-12 text-medium-emphasis"
          >
            <v-icon class="mb-4" size="64">mdi-folder-open-outline</v-icon>
            <p>{{ $t('Profile.noCollections') }}</p>
          </div>

          <!-- Collection cards -->
          <v-row v-else dense>
            <v-col
              v-for="coll in collections"
              :key="coll.id"
              cols="12"
              lg="3"
              md="4"
              sm="6"
              xxl="2"
            >
              <router-link class="text-decoration-none" :to="`/collection/${coll.id}`">
                <CollectionCard
                  :collection="toCollectionCardProps(coll)"
                  :show-author="false"
                />
              </router-link>
            </v-col>
          </v-row>

          <!-- Load more -->
          <div
            v-if="collectionsHasMore && collections.length > 0"
            class="text-center py-4"
          >
            <v-btn
              :loading="collectionsLoadingMore"
              variant="outlined"
              @click="loadMoreCollections"
            >
              Load more
            </v-btn>
          </div>
        </div>

        <!-- Filter / Search / Sort bar -->
        <div v-if="activeTab !== 'collections'" class="d-flex flex-wrap align-center ga-2 mt-4">
          <!-- Pricing Filter Chips -->
          <v-chip-group
            v-model="pricingFilter"
            class="flex-grow-1"
            :disabled="entriesLoading"
            mandatory
            selected-class="text-primary"
          >
            <v-chip
              :disabled="entriesLoading"
              filter
              size="small"
              value="all"
              variant="tonal"
            >
              {{ $t('Common.all') }}
            </v-chip>
            <v-chip
              :disabled="entriesLoading"
              filter
              size="small"
              value="free"
              variant="tonal"
            >
              {{ $t('Common.free') }}
            </v-chip>
            <v-chip
              :disabled="entriesLoading"
              filter
              size="small"
              value="premium"
              variant="tonal"
            >
              <v-icon size="14" start>mdi-lock</v-icon>
              {{ $t('Common.premium') }}
            </v-chip>
          </v-chip-group>

          <!-- Search -->
          <v-text-field
            v-model="searchQuery"
            clearable
            density="compact"
            :disabled="entriesLoading"
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
                :disabled="entriesLoading"
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
        <div v-if="activeTab !== 'collections'" class="mt-4">
          <!-- Loading -->
          <v-row v-if="entriesLoading" dense>
            <v-col
              v-for="n in 6"
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

          <!-- Error -->
          <v-alert
            v-else-if="entriesError"
            class="ma-4"
            closable
            text="Failed to load entries. Please try again."
            type="error"
            @click:close="fetchEntries"
          />

          <!-- Empty state -->
          <div
            v-else-if="entries.length === 0"
            class="text-center py-12 text-medium-emphasis"
          >
            <v-icon class="mb-4" size="64">mdi-image-off</v-icon>
            <p>{{ activeTab === 'all' ? $t('Profile.noEntries') : $t('Profile.noEntriesFiltered', { type: $t(`Profile.tabs.${activeTab}`) }) }}</p>
          </div>

          <!-- No items match filters -->
          <div
            v-else-if="filteredEntries.length === 0"
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

          <!-- Entry cards -->
          <v-row v-else dense>
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
                :show-author="false"
              />
            </v-col>
          </v-row>

          <!-- Load more -->
          <div
            v-if="hasMorePages && entries.length > 0"
            class="text-center py-4"
          >
            <v-btn
              :loading="loadingMore"
              variant="outlined"
              @click="loadMore"
            >
              Load more
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>
    <v-snackbar v-model="snackbar" color="success" :timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
  import type { PublicEntryModel } from '@/api/api'
  import type { UserProfile } from '@/api/modules/user.api'
  import type { CollectionItemModel } from '@/api/types/collection.types'
  import type { Collection } from '@/components/collection/CollectionCard.vue'
  import type { Entry } from '@/components/entry/EntryCard.vue'

  import { computed, nextTick, onMounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { onBeforeRouteLeave, useRoute } from 'vue-router'

  import { api } from '@/api/api'
  import CollectionCard from '@/components/collection/CollectionCard.vue'
  import CxSubscribeButton from '@/components/CxSubscribeButton.vue'
  import { isPopNavigation } from '@/router'
  import { usePurchasesStore } from '@/stores/purchases'
  import { useScrollCacheStore } from '@/stores/scrollCache'

  const route = useRoute()
  const { t } = useI18n()
  const purchasesStore = usePurchasesStore()
  const scrollCache = useScrollCacheStore()

  const user = ref<UserProfile | null>(null)
  const loading = ref(true)
  const snackbar = ref(false)
  const snackbarText = ref('')
  const activeTab = ref('all')

  // Entry state
  const entries = ref<PublicEntryModel[]>([])
  const entriesLoading = ref(false)
  const entriesError = ref(false)
  const loadingMore = ref(false)
  const currentPage = ref(0)
  const totalPages = ref(0)
  const PAGE_SIZE = 24

  // Collection state
  const collections = ref<CollectionItemModel[]>([])
  const collectionsLoading = ref(false)
  const collectionsLoadingMore = ref(false)
  const collectionsPage = ref(0)
  const collectionsTotalPages = ref(0)
  const collectionsHasMore = computed(() => collectionsPage.value < collectionsTotalPages.value - 1)

  // Filter / Search / Sort state
  const pricingFilter = ref('all')
  const searchQuery = ref('')
  const sortBy = ref<'recent' | 'title'>('recent')

  const hasMorePages = computed(() => currentPage.value < totalPages.value - 1)

  const filteredEntries = computed(() => {
    let result = [...entries.value]

    // Filter by pricing
    if (pricingFilter.value === 'free') {
      result = result.filter(item => !item.isPaid)
    } else if (pricingFilter.value === 'premium') {
      result = result.filter(item => item.isPaid)
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
    pricingFilter.value = 'all'
    searchQuery.value = ''
    sortBy.value = 'recent'
  }

  // Get username from route param
  const requestedUsername = computed(() => {
    const params = route.params as Record<string, string | string[]>
    const param = params.username
    return (Array.isArray(param) ? param[0] : param)?.toLowerCase() ?? ''
  })

  /**
   * Maps a PublicEntryModel to the Entry interface expected by EntryCard.
   */
  function toEntryCardProps (item: PublicEntryModel): Entry {
    const isUnlocked = item.isPaid && purchasesStore.isUnlocked(item.id)
    return {
      id: item.id,
      type: item.type,
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

  async function fetchEntries () {
    if (!requestedUsername.value) return
    entriesLoading.value = true
    entriesError.value = false
    entries.value = []

    try {
      const typeFilter = activeTab.value === 'all' ? undefined : activeTab.value as 'video' | 'audio' | 'image' | 'resource'
      const response = await api.entries.getByUser(requestedUsername.value, {
        type: typeFilter,
        page: 0,
        size: PAGE_SIZE,
      })
      entries.value = response.items
      currentPage.value = response.page
      totalPages.value = response.totalPages
    } catch (error_) {
      console.error('[ProfilePage] Failed to fetch entries:', error_)
      entriesError.value = true
    } finally {
      entriesLoading.value = false
    }
  }

  async function loadMore () {
    loadingMore.value = true
    try {
      const typeFilter = activeTab.value === 'all' ? undefined : activeTab.value as 'video' | 'audio' | 'image' | 'resource'
      const response = await api.entries.getByUser(requestedUsername.value, {
        type: typeFilter,
        page: currentPage.value + 1,
        size: PAGE_SIZE,
      })
      entries.value.push(...response.items)
      currentPage.value = response.page
      totalPages.value = response.totalPages
    } catch (error_) {
      console.error('[ProfilePage] Failed to load more:', error_)
    } finally {
      loadingMore.value = false
    }
  }

  function toCollectionCardProps (item: CollectionItemModel): Collection {
    return {
      id: item.id,
      collectionType: (item.collectionType ?? 'list').toLowerCase(),
      title: item.title,
      authorName: item.authorName ?? '',
      authorAvatarUrl: item.authorAvatarUrl,
      publishedAt: item.publishedAt,
      coverUrl: item.coverUrl,
      itemsCount: item.itemCount,
      locked: item.locked,
      unlocked: item.unlocked,
    }
  }

  async function fetchCollections () {
    if (!requestedUsername.value) return
    collectionsLoading.value = true
    collections.value = []

    try {
      const response = await api.collections.getPublished({
        username: requestedUsername.value,
        page: 0,
        size: PAGE_SIZE,
      })
      collections.value = response.items
      collectionsPage.value = response.page
      collectionsTotalPages.value = response.totalPages
    } catch (error_) {
      console.error('[ProfilePage] Failed to fetch collections:', error_)
    } finally {
      collectionsLoading.value = false
    }
  }

  async function loadMoreCollections () {
    collectionsLoadingMore.value = true
    try {
      const response = await api.collections.getPublished({
        username: requestedUsername.value,
        page: collectionsPage.value + 1,
        size: PAGE_SIZE,
      })
      collections.value.push(...response.items)
      collectionsPage.value = response.page
      collectionsTotalPages.value = response.totalPages
    } catch (error_) {
      console.error('[ProfilePage] Failed to load more collections:', error_)
    } finally {
      collectionsLoadingMore.value = false
    }
  }

  async function fetchUser () {
    if (!requestedUsername.value) {
      loading.value = false
      return
    }

    loading.value = true
    user.value = null

    try {
      user.value = await api.user.getByUsername(requestedUsername.value)
    } catch {
      // User not found - user.value remains null
      user.value = null
    } finally {
      loading.value = false
    }
  }

  async function copyProfileLink () {
    if (!user.value?.username) return
    const url = `${window.location.origin}/${user.value.username}`
    try {
      await navigator.clipboard.writeText(url)
      snackbarText.value = t('Account.profileLinkCopied')
      snackbar.value = true
    } catch {
      // Fallback: silently fail
    }
  }

  // Fetch entries when tab changes
  watch(activeTab, () => {
    pricingFilter.value = 'all'
    searchQuery.value = ''
    sortBy.value = 'recent'
    if (activeTab.value === 'collections') {
      if (collections.value.length === 0) {
        fetchCollections()
      }
    } else {
      fetchEntries()
    }
  })

  // Fetch user and entries when username changes
  watch(requestedUsername, () => {
    fetchUser()
    fetchEntries()
    if (activeTab.value === 'collections') {
      fetchCollections()
    }
  })

  onBeforeRouteLeave(() => {
    if (user.value && (entries.value.length > 0 || collections.value.length > 0)) {
      scrollCache.save(route.path, {
        user: { ...user.value },
        entries: [...entries.value],
        collections: [...collections.value],
        activeTab: activeTab.value,
        currentPage: currentPage.value,
        totalPages: totalPages.value,
        collectionsPage: collectionsPage.value,
        collectionsTotalPages: collectionsTotalPages.value,
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
      user.value = cached.user as UserProfile
      entries.value = cached.entries as PublicEntryModel[]
      collections.value = (cached.collections as CollectionItemModel[]) ?? []
      activeTab.value = cached.activeTab as string
      currentPage.value = cached.currentPage as number
      totalPages.value = cached.totalPages as number
      collectionsPage.value = (cached.collectionsPage as number) ?? 0
      collectionsTotalPages.value = (cached.collectionsTotalPages as number) ?? 0
      pricingFilter.value = (cached.pricingFilter as string) ?? 'all'
      searchQuery.value = (cached.searchQuery as string) ?? ''
      sortBy.value = (cached.sortBy as 'recent' | 'title') ?? 'recent'
      loading.value = false
      entriesLoading.value = false

      nextTick(() => {
        window.scrollTo(0, cached.scrollY as number)
      })
    } else {
      fetchUser()
      fetchEntries()
    }
  })
</script>

<route lang="json">
{
  "path": "/:username"
}
</route>
