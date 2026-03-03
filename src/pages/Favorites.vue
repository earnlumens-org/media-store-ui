<template>
  <v-container class="py-4 px-1 px-sm-4" fluid>
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

    <!-- Login required -->
    <v-row v-else-if="!auth.isAuthenticated" justify="center">
      <v-col cols="12" md="6">
        <v-empty-state
          class="mt-8"
          icon="mdi-heart-outline"
          :text="$t('Favorites.loginRequiredDescription')"
          :title="$t('Favorites.loginRequired')"
        />
      </v-col>
    </v-row>

    <!-- Empty state -->
    <v-row v-else-if="favorites.length === 0" justify="center">
      <v-col cols="12" md="6">
        <v-empty-state
          class="mt-8"
          icon="mdi-heart-outline"
          :text="$t('Favorites.emptyDescription')"
          :title="$t('Favorites.empty')"
        />
      </v-col>
    </v-row>

    <!-- Favorites grid -->
    <v-row v-else dense>
      <v-col
        v-for="item in favorites"
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

    <!-- Load more (infinite scroll) -->
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
  </v-container>
</template>

<script setup lang="ts">
  import type { FavoriteItemModel } from '@/api/types/favorite.types'
  import type { Collection } from '@/components/collection/CollectionCard.vue'
  import type { Entry } from '@/components/entry/EntryCard.vue'

  import { computed, onMounted, ref } from 'vue'

  import { api } from '@/api/api'
  import CollectionCard from '@/components/collection/CollectionCard.vue'
  import EntryCard from '@/components/entry/EntryCard.vue'
  import EntryCardSkeleton from '@/components/entry/EntryCardSkeleton.vue'
  import { useAuthStore } from '@/stores/auth'

  const auth = useAuthStore()

  const favorites = ref<FavoriteItemModel[]>([])
  const loading = ref(true)
  const loadingMore = ref(false)
  const error = ref(false)
  const currentPage = ref(0)
  const totalPages = ref(0)

  const hasMorePages = computed(() => currentPage.value < totalPages.value - 1)

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

  /**
   * Map a FavoriteItemModel to the Entry props shape expected by EntryCard.
   */
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

  /**
   * Map a FavoriteItemModel to the Collection props shape expected by CollectionCard.
   */
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

  onMounted(() => {
    fetchFavorites()
  })
</script>

<route lang="json">
{
  "path": "/favorites"
}
</route>
