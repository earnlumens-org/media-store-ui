/**
 * Subscriptions Store - Server-backed user subscription management
 *
 * All subscriptions are persisted via the API.
 * This store keeps an in-memory set of subscribed user IDs for fast
 * UI lookups (button state). The full list is fetched on the Subscriptions page.
 *
 * Usage:
 *   import { useSubscriptionsStore } from '@/stores/subscriptions'
 *   const subs = useSubscriptionsStore()
 *
 *   // Check if subscribed to a userId (in-memory cache)
 *   if (subs.isSubscribed('user-123')) { ... }
 *
 *   // Toggle subscription (calls API + updates cache)
 *   await subs.toggleSubscription('user-123')
 */

import { defineStore } from 'pinia'

import { api } from '@/api/api'

interface SubscriptionsState {
  /** Set of target user IDs the current user is subscribed to */
  subscribedIds: Set<string>
  /** Whether the initial load from server has completed */
  isLoaded: boolean
  /** Loading state for toggle operations */
  isToggling: boolean
}

export const useSubscriptionsStore = defineStore('subscriptions', {
  state: (): SubscriptionsState => ({
    subscribedIds: new Set(),
    isLoaded: false,
    isToggling: false,
  }),

  getters: {
    /**
     * Check if the user is subscribed to a specific userId (instant, in-memory)
     */
    isSubscribed: state => {
      return (userId: string): boolean => state.subscribedIds.has(userId)
    },

    /**
     * Total number of cached subscription IDs
     */
    totalSubscriptions: (state): number => {
      return state.subscribedIds.size
    },
  },

  actions: {
    /**
     * Load all subscription target IDs from the server.
     * Fetches page by page to build the complete in-memory set.
     */
    async loadSubscriptionIds () {
      try {
        const ids = new Set<string>()
        let page = 0
        let hasMore = true

        while (hasMore) {
          const response = await api.subscriptions.mySubscriptions({ page, size: 100 })
          for (const item of response.items) {
            ids.add(item.userId)
          }
          page++
          hasMore = page < Math.ceil(response.totalElements / 100)
        }

        this.subscribedIds = ids
        this.isLoaded = true
      } catch (error) {
        console.error('[SubscriptionsStore] Failed to load subscription IDs:', error)
      }
    },

    /**
     * Toggle a subscription via the API.
     * Updates the in-memory cache immediately (optimistic), rolls back on error.
     *
     * @returns true if subscribed, false if unsubscribed, undefined on error
     */
    async toggleSubscription (targetUserId: string): Promise<boolean | undefined> {
      if (this.isToggling) {
        return undefined
      }
      this.isToggling = true

      const wasSubscribed = this.subscribedIds.has(targetUserId)

      // Optimistic update
      if (wasSubscribed) {
        this.subscribedIds.delete(targetUserId)
      } else {
        this.subscribedIds.add(targetUserId)
      }

      try {
        if (wasSubscribed) {
          await api.subscriptions.unsubscribe(targetUserId)
          this.subscribedIds.delete(targetUserId)
          return false
        } else {
          await api.subscriptions.subscribe(targetUserId)
          this.subscribedIds.add(targetUserId)
          return true
        }
      } catch (error) {
        // Rollback optimistic update
        if (wasSubscribed) {
          this.subscribedIds.add(targetUserId)
        } else {
          this.subscribedIds.delete(targetUserId)
        }
        console.error('[SubscriptionsStore] Failed to toggle subscription:', error)
        return undefined
      } finally {
        this.isToggling = false
      }
    },

    /**
     * Remove from the local cache (used after explicit unsubscribe on list page).
     */
    removeFromCache (userId: string) {
      this.subscribedIds.delete(userId)
    },

    /**
     * Clear all cached state (used on logout).
     */
    clearAll () {
      this.subscribedIds.clear()
      this.isLoaded = false
    },
  },
})
