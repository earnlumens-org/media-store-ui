<template>
  <v-container class="py-4 px-2 px-sm-4" fluid>
    <!-- Sign-in gate: anonymous visitor exhausted the free search budget -->
    <div v-if="requiresLogin" class="d-flex justify-center py-12">
      <v-card class="pa-6 text-center" max-width="480" rounded="lg" variant="tonal">
        <v-icon class="mb-4" color="primary" size="56">mdi-account-lock</v-icon>
        <h2 class="text-h6 mb-2">{{ $t('Search.loginRequiredTitle') }}</h2>
        <p class="text-body-2 text-medium-emphasis mb-6">
          {{ $t('Search.loginRequiredText') }}
        </p>
        <CxLoginDialog />
      </v-card>
    </div>

    <template v-else>
      <!-- Filters: type chips + sort -->
      <div class="d-flex align-center flex-wrap ga-2 mb-2">
        <v-chip-group
          v-model="typeFilter"
          mandatory
          selected-class="text-primary"
        >
          <v-chip filter size="small" value="all" variant="tonal">
            {{ $t('Common.all') }}
          </v-chip>
          <v-chip
            v-if="tenantStore.isEntryTypeAllowed('VIDEO')"
            filter
            size="small"
            value="video"
            variant="tonal"
          >
            {{ $t('Profile.tabs.video') }}
          </v-chip>
          <v-chip
            v-if="tenantStore.isEntryTypeAllowed('AUDIO')"
            filter
            size="small"
            value="audio"
            variant="tonal"
          >
            {{ $t('Profile.tabs.audio') }}
          </v-chip>
          <v-chip
            v-if="tenantStore.isEntryTypeAllowed('IMAGE')"
            filter
            size="small"
            value="image"
            variant="tonal"
          >
            {{ $t('Profile.tabs.image') }}
          </v-chip>
          <v-chip
            v-if="tenantStore.isEntryTypeAllowed('RESOURCE')"
            filter
            size="small"
            value="resource"
            variant="tonal"
          >
            {{ $t('Profile.tabs.resource') }}
          </v-chip>
          <v-chip
            v-if="tenantStore.isEntryTypeAllowed('COLLECTION')"
            filter
            size="small"
            value="collection"
            variant="tonal"
          >
            {{ $t('Profile.tabs.collections') }}
          </v-chip>
        </v-chip-group>

        <v-spacer />

        <v-menu>
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              append-icon="mdi-menu-down"
              prepend-icon="mdi-sort"
              size="small"
              variant="text"
            >
              {{ $t(`Search.sort.${sort}`) }}
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item
              v-for="opt in sortOptions"
              :key="opt"
              :active="sort === opt"
              :title="$t(`Search.sort.${opt}`)"
              @click="sort = opt"
            />
          </v-list>
        </v-menu>
      </div>

      <v-divider class="mb-4" />

      <!-- Channels (creators) -->
      <div v-if="channels.length > 0" class="mb-6">
        <h2 class="text-subtitle-1 font-weight-medium mb-3">{{ $t('Search.channels') }}</h2>
        <v-row dense>
          <v-col
            v-for="channel in channels"
            :key="channel.username"
            cols="12"
            md="6"
            sm="12"
          >
            <router-link class="text-decoration-none" :to="`/${channel.username}`">
              <v-card class="d-flex align-center pa-3 ga-3" variant="tonal">
                <v-avatar size="64">
                  <v-img v-if="channel.avatarUrl" :src="channel.avatarUrl" />
                  <v-icon v-else size="40">mdi-account-circle</v-icon>
                </v-avatar>
                <div class="flex-grow-1 overflow-hidden">
                  <div class="d-flex align-center ga-1">
                    <span class="text-body-1 font-weight-medium text-truncate">{{ channel.username }}</span>
                    <img
                      v-if="badgeSrc(channel.profileBadge)"
                      alt=""
                      height="16"
                      :src="badgeSrc(channel.profileBadge)"
                      width="16"
                    >
                  </div>
                  <span class="text-caption text-medium-emphasis">
                    {{ $t('Search.contentCount', { n: channel.contentCount }) }}
                  </span>
                </div>
                <v-btn
                  class="text-none"
                  color="primary"
                  size="small"
                  variant="flat"
                >
                  {{ $t('Search.viewChannel') }}
                </v-btn>
              </v-card>
            </router-link>
          </v-col>
        </v-row>
        <v-divider class="mt-4" />
      </div>

      <!-- Initial loading skeletons -->
      <v-row v-if="loading && items.length === 0" dense>
        <v-col
          v-for="n in 24"
          :key="`sk-${n}`"
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
        v-else-if="error"
        class="ma-2"
        closable
        type="error"
        @click:close="fetchResults"
      >
        {{ $t('Search.error') }}
      </v-alert>

      <!-- No results -->
      <div
        v-else-if="items.length === 0 && channels.length === 0"
        class="text-center py-12 text-medium-emphasis"
      >
        <v-icon class="mb-4" size="64">mdi-magnify-close</v-icon>
        <p class="text-h6">{{ $t('Search.noResults') }}</p>
        <p class="text-body-2">{{ $t('Search.noResultsHint', { query }) }}</p>
      </div>

      <!-- Content grid with infinite scroll -->
      <v-infinite-scroll
        v-else
        :disabled="!hasMorePages || loading"
        :empty-text="''"
        mode="intersect"
        @load="onInfiniteLoad"
      >
        <v-row dense>
          <v-col
            v-for="item in items"
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
              show-author
            />
          </v-col>
        </v-row>

        <template #loading>
          <div class="d-flex justify-center py-4">
            <v-progress-circular color="primary" indeterminate />
          </div>
        </template>
      </v-infinite-scroll>
    </template>
  </v-container>
</template>

<script setup lang="ts">
  import type { PublicFeedItemModel } from '@/api/types/feed.types'
  import type { SearchChannelModel } from '@/api/types/search.types'
  import type { Collection } from '@/components/collection/CollectionCard.vue'
  import type { Entry } from '@/components/entry/EntryCard.vue'
  import type { ProfileBadge } from '@/lib/profileBadge'

  import axios from 'axios'
  import { computed, ref, watch } from 'vue'
  import { useRoute } from 'vue-router'

  import { api } from '@/api/api'
  import CollectionCard from '@/components/collection/CollectionCard.vue'
  import CxLoginDialog from '@/components/CxLoginDialog.vue'
  import EntryCard from '@/components/entry/EntryCard.vue'
  import EntryCardSkeleton from '@/components/entry/EntryCardSkeleton.vue'
  import { useSearchHistory } from '@/composables/useSearchHistory'
  import { getProfileBadgeSrc } from '@/lib/profileBadge'
  import { useAuthStore } from '@/stores/auth'
  import { usePurchasesStore } from '@/stores/purchases'
  import { useTenantStore } from '@/stores/tenant'

  const PAGE_SIZE = 24

  const route = useRoute()
  const authStore = useAuthStore()
  const purchasesStore = usePurchasesStore()
  const tenantStore = useTenantStore()
  const { add: addToHistory } = useSearchHistory()

  const query = computed(() => String(route.query.q ?? '').trim())

  const sortOptions = ['relevance', 'newest', 'oldest', 'views'] as const
  type SortOption = (typeof sortOptions)[number]

  const typeFilter = ref<string>('all')
  const sort = ref<SortOption>('relevance')

  const channels = ref<SearchChannelModel[]>([])
  const items = ref<PublicFeedItemModel[]>([])
  const requiresLogin = ref(false)
  const loading = ref(false)
  const error = ref(false)
  const currentPage = ref(0)
  const totalPages = ref(0)

  const hasMorePages = computed(() => currentPage.value < totalPages.value - 1)

  let fetchController: AbortController | null = null

  function badgeSrc (badge?: ProfileBadge) {
    return getProfileBadgeSrc(badge)
  }

  const typeParam = computed(() => (typeFilter.value === 'all' ? undefined : typeFilter.value))

  function toEntryCardProps (item: PublicFeedItemModel): Entry {
    const isOwner = authStore.isAuthenticated && authStore.user?.username === item.authorName
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
    const isOwner = authStore.isAuthenticated && authStore.user?.username === item.authorName
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

  async function fetchResults () {
    const q = query.value
    if (!q) {
      items.value = []
      channels.value = []
      return
    }

    if (fetchController) fetchController.abort()
    fetchController = new AbortController()

    loading.value = true
    error.value = false
    requiresLogin.value = false

    try {
      const result = await api.search.query({
        q,
        type: typeParam.value,
        sort: sort.value,
        page: 0,
        size: PAGE_SIZE,
      }, fetchController.signal)

      if (result.requiresLogin) {
        requiresLogin.value = true
        items.value = []
        channels.value = []
        return
      }

      channels.value = result.channels
      items.value = result.content.items
      currentPage.value = result.content.page
      totalPages.value = result.content.totalPages
    } catch (error_: any) {
      if (axios.isCancel(error_) || error_?.code === 'ERR_CANCELED') return
      console.error('[Results] search failed:', error_)
      error.value = true
    } finally {
      loading.value = false
    }
  }

  async function onInfiniteLoad ({ done }: { done: (status: 'ok' | 'empty' | 'error') => void }) {
    if (!hasMorePages.value || requiresLogin.value) {
      done('empty')
      return
    }

    const controller = new AbortController()
    try {
      const result = await api.search.query({
        q: query.value,
        type: typeParam.value,
        sort: sort.value,
        page: currentPage.value + 1,
        size: PAGE_SIZE,
      }, controller.signal)

      if (result.requiresLogin) {
        requiresLogin.value = true
        done('empty')
        return
      }

      items.value.push(...result.content.items)
      currentPage.value = result.content.page
      totalPages.value = result.content.totalPages
      done(hasMorePages.value ? 'ok' : 'empty')
    } catch (error_: any) {
      if (axios.isCancel(error_) || error_?.code === 'ERR_CANCELED') return
      console.error('[Results] load more failed:', error_)
      done('error')
    }
  }

  // Refetch when the query, type filter or sort changes. Persist successful
  // queries to history so the search box surfaces them next time.
  watch(
    () => [query.value, typeFilter.value, sort.value],
    () => {
      if (query.value) {
        addToHistory(query.value)
        window.scrollTo(0, 0)
        fetchResults()
      }
    },
    { immediate: true },
  )
</script>

<route lang="json">
{
  "path": "/results"
}
</route>
