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
        v-model="pricingFilter"
        class="mb-2"
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
        text="Failed to load entries. Please try again."
        title="Error"
        type="error"
        @click:close="fetchEntries"
      />

      <!-- Empty state -->
      <v-row v-else-if="entries.length === 0" dense>
        <v-col cols="12">
          <v-alert
            class="ma-4"
            text="No published content yet. Be the first to upload!"
            title="Nothing here yet"
            type="info"
          />
        </v-col>
      </v-row>

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
            :show-author="showAuthor"
          />
        </v-col>
      </v-row>
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
  import type { PublicEntryModel } from '@/api/api'
  import type { EntryModel } from '@/api/types/entryMock.types'
  import type { Entry } from '@/components/entry/EntryCard.vue'

  import { computed, nextTick, onMounted, ref, watch } from 'vue'
  import { onBeforeRouteLeave, useRoute } from 'vue-router'

  import { api } from '@/api/api'
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

  const entries = ref<PublicEntryModel[]>([])
  const loading = ref(true)
  const error = ref(false)
  const currentPage = ref(0)
  const totalPages = ref(0)
  const pricingFilter = ref('all')

  const hasMorePages = computed(() => currentPage.value < totalPages.value - 1)

  const filteredEntries = computed(() => {
    if (pricingFilter.value === 'free') return entries.value.filter(e => !e.isPaid)
    if (pricingFilter.value === 'premium') return entries.value.filter(e => e.isPaid)
    return entries.value
  })

  /**
   * Maps a PublicEntryModel to the Entry interface expected by EntryCard.
   * Own content (matching logged-in username) is never locked.
   */
  function toEntryCardProps (item: PublicEntryModel): Entry {
    const isOwner = authStore.isAuthenticated
      && authStore.user?.username === item.authorName
    const isUnlocked = item.isPaid && (isOwner || purchasesStore.isUnlocked(item.id))
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

  /**
   * Caches real API entries so the preview page can display correct data.
   */
  function cacheRealEntries (items: PublicEntryModel[]) {
    for (const item of items) {
      const entry: EntryModel = {
        id: item.id,
        type: item.type,
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
        contentLanguage: item.contentLanguage,
        description: item.description,
      })
    }
  }

  async function fetchEntries () {
    loading.value = true
    error.value = false

    try {
      const response = await api.entries.getPublished({
        page: 0,
        size: props.pageSize,
      })
      entries.value = response.items
      cacheRealEntries(response.items)
      currentPage.value = response.page
      totalPages.value = response.totalPages
    } catch (error_) {
      console.error('[EntryCardGrid] Failed to fetch entries:', error_)
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
      const response = await api.entries.getPublished({
        page: currentPage.value + 1,
        size: props.pageSize,
      })
      entries.value.push(...response.items)
      cacheRealEntries(response.items)
      currentPage.value = response.page
      totalPages.value = response.totalPages

      done(hasMorePages.value ? 'ok' : 'empty')
    } catch (error_) {
      console.error('[EntryCardGrid] Failed to load more:', error_)
      done('error')
    }
  }

  onBeforeRouteLeave(() => {
    if (entries.value.length > 0) {
      scrollCache.save(route.path, {
        items: [...entries.value],
        currentPage: currentPage.value,
        totalPages: totalPages.value,
        scrollY: window.scrollY,
      })
    }
  })

  onMounted(() => {
    const cached = scrollCache.get(route.path)
    if (cached && isPopNavigation()) {
      entries.value = cached.items as PublicEntryModel[]
      currentPage.value = cached.currentPage as number
      totalPages.value = cached.totalPages as number
      cacheRealEntries(entries.value)
      loading.value = false

      nextTick(() => {
        window.scrollTo(0, cached.scrollY as number)
      })
    } else {
      fetchEntries()
    }
  })

  watch(() => appStore.refreshKey, () => {
    window.scrollTo(0, 0)
    fetchEntries()
  })
</script>
