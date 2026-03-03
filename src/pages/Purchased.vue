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

    <!-- Loading state -->
    <v-row v-else-if="loading" dense>
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

    <!-- Purchased entries grid -->
    <template v-else>
      <v-row dense>
        <v-col
          v-for="item in entries"
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
  </v-container>
</template>

<script setup lang="ts">
  import type { PurchasedEntryModel } from '@/api/types/purchase.types'
  import type { Entry } from '@/components/entry/EntryCard.vue'

  import { computed, nextTick, onMounted, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { onBeforeRouteLeave, useRoute } from 'vue-router'

  import { api } from '@/api/api'
  import EntryCard from '@/components/entry/EntryCard.vue'
  import EntryCardSkeleton from '@/components/entry/EntryCardSkeleton.vue'
  import { isPopNavigation } from '@/router'
  import { useAuthStore } from '@/stores/auth'
  import { usePurchasesStore } from '@/stores/purchases'
  import { useScrollCacheStore } from '@/stores/scrollCache'

  const { t } = useI18n()
  const authStore = useAuthStore()
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

  const hasMorePages = computed(() => currentPage.value < totalPages.value - 1)

  /**
   * Maps a PurchasedEntryModel to the Entry interface expected by EntryCard.
   * All items are unlocked (they were purchased).
   */
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

  /**
   * Sync local purchasesStore with server data so other pages
   * also know about these entitlements.
   */
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
    } catch (err) {
      console.error('[Purchased] Failed to fetch purchases:', err)
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
    } catch (err) {
      console.error('[Purchased] Failed to load more:', err)
    } finally {
      loadingMore.value = false
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
      entries.value = cached.items as PurchasedEntryModel[]
      currentPage.value = cached.currentPage as number
      totalPages.value = cached.totalPages as number
      syncPurchasesStore(entries.value)
      loading.value = false

      nextTick(() => {
        window.scrollTo(0, cached.scrollY as number)
      })
    } else {
      fetchPurchases()
    }
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
