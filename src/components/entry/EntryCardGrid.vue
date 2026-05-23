<template>
  <v-infinite-scroll
    :disabled="!hasMorePages || loading"
    :empty-text="''"
    mode="intersect"
    @load="onInfiniteLoad"
  >
    <v-container class="py-4 px-1 px-sm-4" fluid>
      <!-- Content tabs. The tenant's per-type allowlist drives which tabs
           render; turning a type off in admin /settings/content-types hides
           its tab here. 'all' is always shown so visitors keep a way back
           to the full feed. -->
      <v-tabs
        v-model="activeTab"
        centered
        color="primary"
        :disabled="loading && feedItems.length === 0"
        grow
      >
        <v-tab value="all">
          <v-icon start>mdi-view-grid</v-icon>
          {{ $t('Profile.tabs.all') }}
        </v-tab>
        <v-tab v-if="tenantStore.isEntryTypeAllowed('COLLECTION')" value="collections">
          <v-icon start>mdi-folder-multiple</v-icon>
          {{ $t('Profile.tabs.collections') }}
        </v-tab>
        <v-tab v-if="tenantStore.isEntryTypeAllowed('VIDEO')" value="video">
          <v-icon start>mdi-video</v-icon>
          {{ $t('Profile.tabs.video') }}
        </v-tab>
        <v-tab v-if="tenantStore.isEntryTypeAllowed('AUDIO')" value="audio">
          <v-icon start>mdi-music</v-icon>
          {{ $t('Profile.tabs.audio') }}
        </v-tab>
        <v-tab v-if="tenantStore.isEntryTypeAllowed('IMAGE')" value="image">
          <v-icon start>mdi-image</v-icon>
          {{ $t('Profile.tabs.image') }}
        </v-tab>
        <v-tab v-if="tenantStore.isEntryTypeAllowed('RESOURCE')" value="resource">
          <v-icon start>mdi-text-box</v-icon>
          {{ $t('Profile.tabs.resource') }}
        </v-tab>
      </v-tabs>

      <!-- Pricing Filter Chips + Content Language indicator -->
      <div class="d-flex align-center flex-wrap mt-4 ga-2">
        <v-chip-group
          v-model="pricingFilter"
          :disabled="loading && feedItems.length === 0"
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

        <v-spacer />

        <v-chip
          v-if="authStore.isAuthenticated && contentLangPrefs.loaded"
          class="mr-1"
          :color="languageChip.active ? 'primary' : undefined"
          prepend-icon="mdi-web"
          size="small"
          :title="$t('ContentLanguagePreferences.gridChipTooltip')"
          :variant="languageChip.active ? 'tonal' : 'outlined'"
          @click="langDialogOpen = true"
        >
          {{ languageChip.label }}
        </v-chip>
      </div>

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
        @click:close="() => fetchFeed()"
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
          <div v-if="contentLangPrefs.loaded && languageChip.active" class="ma-4">
            <div
              v-if="authStore.isAuthenticated"
              class="d-flex justify-end mb-2"
            >
              <v-btn
                color="info"
                prepend-icon="mdi-web"
                size="small"
                variant="tonal"
                @click="langDialogOpen = true"
              >
                {{ $t('ContentLanguagePreferences.changeLanguages') }}
              </v-btn>
            </div>
            <v-alert
              prominent
              :text="$t('ContentLanguagePreferences.emptyByLanguageText')"
              :title="$t('ContentLanguagePreferences.emptyByLanguageTitle')"
              type="info"
            />
          </div>
          <v-alert
            v-else
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
          class="align-center justify-center"
          contained
          persistent
          scrim="background"
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

  <ContentLanguageDialog
    v-if="authStore.isAuthenticated"
    v-model="langDialogOpen"
    hide-activator
  />
</template>

<script setup lang="ts">
  import type { EntryModel } from '@/api/types/entryMock.types'
  import type { PublicFeedItemModel } from '@/api/types/feed.types'
  import type { Collection } from '@/components/collection/CollectionCard.vue'
  import type { Entry } from '@/components/entry/EntryCard.vue'

  import axios from 'axios'
  import { computed, nextTick, onMounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { onBeforeRouteLeave, useRoute } from 'vue-router'

  import { api } from '@/api/api'
  import CollectionCard from '@/components/collection/CollectionCard.vue'
  import ContentLanguageDialog from '@/components/ContentLanguageDialog.vue'
  import { isPopNavigation } from '@/router'
  import { useAppStore } from '@/stores/app'
  import { useAuthStore } from '@/stores/auth'
  import { useContentLanguagePreferencesStore } from '@/stores/contentLanguagePreferences'
  import { useFeedCacheStore } from '@/stores/feedCache'
  import { usePurchasesStore } from '@/stores/purchases'
  import { useScrollCacheStore } from '@/stores/scrollCache'
  import { useTenantStore } from '@/stores/tenant'

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
  const contentLangPrefs = useContentLanguagePreferencesStore()
  const route = useRoute()
  const scrollCache = useScrollCacheStore()
  const tenantStore = useTenantStore()
  const { t } = useI18n()

  const langDialogOpen = ref(false)

  /**
   * Visible language indicator for the grid.
   * - active=false → user is in "show all" mode; chip is a subtle hint.
   * - 1 lang → "EN"
   * - 2 langs → "EN/ES"
   * - >2 langs → "5 langs" (i18n)
   */
  const languageChip = computed(() => {
    if (contentLangPrefs.showAllLanguages) {
      return {
        active: false,
        label: t('ContentLanguagePreferences.chipAll'),
      }
    }
    const langs = contentLangPrefs.contentLanguages
    if (langs.length === 0) {
      return {
        active: true,
        label: contentLangPrefs.includeMulti
          ? t('ContentLanguagePreferences.chipMultiOnly')
          : t('ContentLanguagePreferences.chipNone'),
      }
    }
    if (langs.length === 1) {
      return { active: true, label: langs[0]!.toUpperCase() }
    }
    if (langs.length === 2) {
      return { active: true, label: langs.map(l => l.toUpperCase()).join('/') }
    }
    return {
      active: true,
      label: t('ContentLanguagePreferences.gridChipMany', { n: langs.length }),
    }
  })

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

  // If the tenant owner restricts the content-type allowlist and the
  // currently selected tab becomes disallowed (or the user lands on a
  // direct link to a tab the tenant has turned off), fall back to "all"
  // so the grid keeps rendering something instead of staying blank.
  function tabIsAllowed (tab: string): boolean {
    if (tab === 'all') return true
    if (tab === 'collections') return tenantStore.isEntryTypeAllowed('COLLECTION')
    return tenantStore.isEntryTypeAllowed(tab)
  }
  watch(() => tenantStore.allowedEntryTypes, () => {
    if (!tabIsAllowed(activeTab.value)) {
      activeTab.value = 'all'
    }
  }, { immediate: true })

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
      profileBadge: item.profileBadge,
      publishedAt: item.publishedAt,
      thumbnailUrl: item.thumbnailUrl,
      thumbnailSrcset: item.thumbnailSrcset,
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
      profileBadge: item.profileBadge,
      publishedAt: item.publishedAt,
      coverUrl: item.coverUrl,
      coverSrcset: item.coverSrcset,
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
        thumbnailSrcset: item.thumbnailSrcset,
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
    } catch (error_: any) {
      if (axios.isCancel(error_) || error_?.code === 'ERR_CANCELED') return
      console.error('[EntryCardGrid] Failed to fetch feed:', error_)
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
    } catch (error_: any) {
      if (axios.isCancel(error_) || error_?.code === 'ERR_CANCELED') return
      console.error('[EntryCardGrid] Failed to load more:', error_)
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
    // Ensure the language chip + empty-state alert reflect the user's
    // actual stored preferences (server for logged-in, localStorage for
    // guests) instead of the navigator-derived seed. Without this the
    // chip can show e.g. "ES" while the feed is actually filtered by
    // "ZH-CN", until the user opens the language dialog.
    contentLangPrefs.loadIfNeeded().catch(() => { /* handled in store */ })

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

  // Refetch when the user updates their content-language preferences so
  // the explore feed reflects the new filter without a manual reload.
  watch(
    () => [
      contentLangPrefs.showAllLanguages,
      contentLangPrefs.includeMulti,
      contentLangPrefs.contentLanguages.join(','),
    ],
    () => {
      window.scrollTo(0, 0)
      fetchFeed()
    },
  )
</script>
