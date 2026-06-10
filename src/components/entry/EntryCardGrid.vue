<template>
  <v-infinite-scroll
    :disabled="!hasMorePages || loading"
    :empty-text="''"
    mode="intersect"
    @load="onInfiniteLoad"
  >
    <v-container class="py-4 px-1 px-sm-4" fluid>
      <!-- "New content" pill (YouTube-style). A zero-height sticky anchor
           keeps the button pinned just below the app bar and horizontally
           centered over the feed without ever pushing the grid down. It
           shows up when background polling detects freshly published items
           and, on tap, swaps in the new feed + scrolls back to the top. -->
      <div class="new-content-anchor">
        <v-scale-transition origin="center top">
          <v-btn
            v-if="hasNewContent"
            class="new-content-pill"
            color="primary"
            elevation="6"
            prepend-icon="mdi-refresh"
            rounded="pill"
            variant="elevated"
            @click="applyNewContent"
          >
            {{ $t('Explore.newContent') }}
          </v-btn>
        </v-scale-transition>
      </div>

      <!-- Content tabs. The tenant's per-type allowlist drives which tabs
           render; turning a type off in admin /settings/content-types hides
           its tab here. 'all' is always shown so visitors keep a way back
           to the full feed. -->
      <v-tabs
        v-if="showTabs"
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
  import type { PublicFeedItemModel, PublicFeedPageModel } from '@/api/types/feed.types'
  import type { Collection } from '@/components/collection/CollectionCard.vue'
  import type { Entry } from '@/components/entry/EntryCard.vue'

  import axios from 'axios'
  import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
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

  // "New content" detection (YouTube-style refresh pill).
  // We silently poll page 0 in the background and, if items newer than the
  // ones currently on screen appear, surface a pill the user can tap to pull
  // them in. The freshly fetched page is stashed so the tap is instant and
  // doesn't trigger a second network round-trip.
  const NEW_CONTENT_POLL_MS = 60_000
  const hasNewContent = ref(false)
  const pendingFeed = ref<PublicFeedPageModel | null>(null)
  let newContentTimer: ReturnType<typeof setInterval> | null = null
  let checkController: AbortController | null = null

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

  // When the tenant only exposes a single non-"all" tab (e.g. only
  // VIDEO is allowed and collections are off), "All" and "Videos"
  // would show the exact same feed — hide the whole tab bar so the
  // UI doesn't ask visitors to pick between two identical views.
  const visibleNonAllTabs = computed(() => {
    let n = 0
    if (tenantStore.isEntryTypeAllowed('COLLECTION')) n++
    for (const t of ['VIDEO', 'AUDIO', 'IMAGE', 'RESOURCE']) {
      if (tenantStore.isEntryTypeAllowed(t)) n++
    }
    return n
  })
  const showTabs = computed(() => visibleNonAllTabs.value >= 2)

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

    // A fresh page-0 load supersedes any pending "new content" the pill was
    // advertising — drop it so we never apply stale data on top of new state.
    hasNewContent.value = false
    pendingFeed.value = null

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

  /**
   * Silently re-fetch page 0 with the active filters and compare it against
   * what's already on screen. We walk the fresh page from the top and count
   * how many leading items aren't part of the current feed; any such item is
   * content published since the user loaded the grid. The feed is sorted
   * newest-first server-side, so leading-only comparison is enough and cheap.
   */
  async function checkForNewContent () {
    // Don't poll while the grid is busy, empty, or already advertising new
    // content — nothing useful would come of it.
    if (
      loading.value
      || switching.value
      || error.value
      || hasNewContent.value
      || feedItems.value.length === 0
      || document.visibilityState === 'hidden'
    ) {
      return
    }

    if (checkController) checkController.abort()
    checkController = new AbortController()

    try {
      const response = await api.entries.getExploreFeed({
        type: feedTypeParam.value,
        pricing: feedPricingParam.value,
        page: 0,
        size: props.pageSize,
      }, checkController.signal)

      const currentIds = new Set(feedItems.value.map(i => i.id))
      let newCount = 0
      for (const item of response.items) {
        if (currentIds.has(item.id)) break
        newCount++
      }

      if (newCount > 0) {
        pendingFeed.value = response
        hasNewContent.value = true
      }
    } catch (error_: any) {
      if (axios.isCancel(error_) || error_?.code === 'ERR_CANCELED') return
      // Polling is best-effort; a transient failure just means we try again
      // on the next tick. Swallow it so it never surfaces to the user.
    }
  }

  /**
   * User tapped the "new content" pill: swap in the page we already fetched
   * during polling (no extra request), reset pagination, and glide back to
   * the top so the freshest items are immediately in view.
   */
  function applyNewContent () {
    const fresh = pendingFeed.value
    hasNewContent.value = false
    pendingFeed.value = null
    if (!fresh) {
      // Fallback: pill somehow shown without stashed data — do a normal fetch.
      window.scrollTo({ top: 0, behavior: 'smooth' })
      fetchFeed()
      return
    }
    feedItems.value = fresh.items
    cacheFeedEntries(fresh.items)
    currentPage.value = fresh.page
    totalPages.value = fresh.totalPages
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function startNewContentPolling () {
    stopNewContentPolling()
    newContentTimer = setInterval(checkForNewContent, NEW_CONTENT_POLL_MS)
  }

  function stopNewContentPolling () {
    if (newContentTimer) {
      clearInterval(newContentTimer)
      newContentTimer = null
    }
    if (checkController) {
      checkController.abort()
      checkController = null
    }
  }

  // Returning to the tab is the moment users most expect to see "new content"
  // (YouTube checks on focus too), so probe immediately when it becomes visible.
  function onVisibilityChange () {
    if (document.visibilityState === 'visible') {
      checkForNewContent()
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

    startNewContentPolling()
    document.addEventListener('visibilitychange', onVisibilityChange)
  })

  onUnmounted(() => {
    stopNewContentPolling()
    document.removeEventListener('visibilitychange', onVisibilityChange)
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

<style scoped>
/*
 * Zero-height sticky anchor. Because it never occupies vertical space the
 * grid below never reflows when the pill toggles. `top` clears the fixed
 * app bar (Vuetify default 64px) plus a small gap so the pill sits just
 * under it and stays pinned there while scrolling — always reachable, even
 * on mobile where it's the user's primary "refresh" affordance.
 */
.new-content-anchor {
  position: sticky;
  top: calc(64px + 12px);
  z-index: 4;
  display: flex;
  justify-content: center;
  height: 0;
  /* Let taps fall through the empty anchor to the cards underneath. */
  pointer-events: none;
}

.new-content-pill {
  pointer-events: auto;
  text-transform: none;
  letter-spacing: normal;
}
</style>
