/**
 * Favorites Store - Server-backed favorites management
 *
 * All favorites are persisted in the database via the API.
 * This store keeps an in-memory set of favorited item IDs for fast
 * UI lookups (heart icon state). The full list is fetched on the
 * Favorites page via the API directly.
 *
 * Usage:
 *   import { useFavoritesStore } from '@/stores/favorites'
 *   const favorites = useFavoritesStore()
 *
 *   // Check if content is favorited (in-memory cache)
 *   if (favorites.isFavorite('entry-123')) { ... }
 *
 *   // Toggle favorite (calls API + updates cache)
 *   await favorites.toggleFavorite('entry-123', 'ENTRY')
 */

import { defineStore } from 'pinia'

import { api } from '@/api/api'

interface FavoritesState {
  /** Set of item IDs that are favorited (in-memory cache) */
  favoriteIds: Set<string>
  /** Whether the initial load from server has completed */
  isLoaded: boolean
  /** Loading state for toggle operations */
  isToggling: boolean
}

export const useFavoritesStore = defineStore('favorites', {
  state: (): FavoritesState => ({
    favoriteIds: new Set(),
    isLoaded: false,
    isToggling: false,
  }),

  getters: {
    /**
     * Check if an item is favorited (instant, in-memory)
     */
    isFavorite: state => {
      return (id: string): boolean => state.favoriteIds.has(id)
    },

    /**
     * Total number of cached favorite IDs
     */
    totalFavorites: (state): number => {
      return state.favoriteIds.size
    },
  },

  actions: {
    /**
     * Load all favorite IDs from the server.
     * Fetches page by page to build the complete in-memory set.
     */
    async loadFavoriteIds () {
      try {
        const ids = new Set<string>()
        let page = 0
        let hasMore = true

        while (hasMore) {
          const response = await api.favorites.list({ page, size: 100 })
          for (const item of response.items) {
            ids.add(item.itemId)
          }
          page++
          hasMore = page < Math.ceil(response.totalElements / 100)
        }

        this.favoriteIds = ids
        this.isLoaded = true
      } catch (error) {
        console.error('[FavoritesStore] Failed to load favorite IDs:', error)
      }
    },

    /**
     * Toggle a favorite via the API.
     * Updates the in-memory cache immediately (optimistic), rolls back on error.
     *
     * @returns true if added, false if removed, undefined on error
     */
    async toggleFavorite (
      itemId: string,
      itemType: 'ENTRY' | 'COLLECTION',
    ): Promise<boolean | undefined> {
      if (this.isToggling) {
        return undefined
      }
      this.isToggling = true

      // Optimistic update
      const wasFavorited = this.favoriteIds.has(itemId)
      if (wasFavorited) {
        this.favoriteIds.delete(itemId)
      } else {
        this.favoriteIds.add(itemId)
      }

      try {
        const response = await api.favorites.toggle(itemId, itemType)

        // Reconcile with server truth
        if (response.favorited) {
          this.favoriteIds.add(itemId)
        } else {
          this.favoriteIds.delete(itemId)
        }

        return response.favorited
      } catch (error) {
        // Rollback optimistic update
        if (wasFavorited) {
          this.favoriteIds.add(itemId)
        } else {
          this.favoriteIds.delete(itemId)
        }
        console.error('[FavoritesStore] Failed to toggle favorite:', error)
        return undefined
      } finally {
        this.isToggling = false
      }
    },

    /**
     * Remove from the local cache (used when Favorites page removes an item).
     */
    removeFromCache (itemId: string) {
      this.favoriteIds.delete(itemId)
    },

    /**
     * Clear all cached state (used on logout).
     */
    clearAll () {
      this.favoriteIds.clear()
      this.isLoaded = false
    },
  },
})
