/**
 * Purchases Store - Track unlocked content
 *
 * Minimal store to track which content the user has purchased/unlocked.
 * Uses localStorage for persistence across sessions.
 *
 * Usage:
 *   import { usePurchasesStore } from '@/stores/purchases'
 *   const purchases = usePurchasesStore()
 *
 *   // Check if content is unlocked
 *   if (purchases.isUnlocked('entry-123')) { ... }
 *
 *   // Mark content as unlocked after purchase
 *   purchases.markUnlocked('entry-123')
 */

import { defineStore } from 'pinia'

const STORAGE_KEY = 'earnlumens_purchases'

interface PurchaseRecord {
  id: string
  purchasedAt: string
  type?: string
  title?: string
}

interface PurchasesState {
  /** Map of content ID to purchase record */
  purchases: Map<string, PurchaseRecord>
  /** Loading state for purchase operations */
  isProcessing: boolean
  /** Last error message */
  lastError: string | null
}

/**
 * Load purchases from localStorage
 */
function loadFromStorage (): Map<string, PurchaseRecord> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored) as PurchaseRecord[]
      return new Map(data.map(p => [p.id, p]))
    }
  } catch (error) {
    console.error('[PurchasesStore] Failed to load from storage:', error)
  }
  return new Map()
}

/**
 * Save purchases to localStorage
 */
function saveToStorage (purchases: Map<string, PurchaseRecord>): void {
  try {
    const data = Array.from(purchases.values())
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('[PurchasesStore] Failed to save to storage:', error)
  }
}

export const usePurchasesStore = defineStore('purchases', {
  state: (): PurchasesState => ({
    purchases: loadFromStorage(),
    isProcessing: false,
    lastError: null,
  }),

  getters: {
    /**
     * Check if content is unlocked
     */
    isUnlocked: state => {
      return (id: string): boolean => {
        return state.purchases.has(id)
      }
    },

    /**
     * Get purchase record for content
     */
    getPurchase: state => {
      return (id: string): PurchaseRecord | undefined => {
        return state.purchases.get(id)
      }
    },

    /**
     * Total number of purchases
     */
    totalPurchases: (state): number => {
      return state.purchases.size
    },

    /**
     * All purchase records as array
     */
    allPurchases: (state): PurchaseRecord[] => {
      return Array.from(state.purchases.values())
    },
  },

  actions: {
    /**
     * Mark content as unlocked (after successful purchase)
     */
    markUnlocked (id: string, metadata?: { type?: string, title?: string }) {
      const record: PurchaseRecord = {
        id,
        purchasedAt: new Date().toISOString(),
        type: metadata?.type,
        title: metadata?.title,
      }

      this.purchases.set(id, record)
      saveToStorage(this.purchases)
    },

    /**
     * Remove unlock (for testing/admin purposes)
     */
    removeUnlock (id: string) {
      this.purchases.delete(id)
      saveToStorage(this.purchases)
    },

    /**
     * Clear all purchases (for testing/logout)
     */
    clearAll () {
      this.purchases.clear()
      saveToStorage(this.purchases)
    },

    /**
     * Set processing state
     */
    setProcessing (value: boolean) {
      this.isProcessing = value
    },

    /**
     * Set error state
     */
    setError (message: string | null) {
      this.lastError = message
    },
  },
})
