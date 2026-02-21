/**
 * Feed Cache Store
 *
 * Lightweight in-memory cache for feed entries and collections.
 * Populated by grid components when items are loaded from the API.
 * Used by the preview page to display correct data without re-fetching.
 *
 * This solves the problem where:
 * - The mock API generates different random data on each request (by-ID ≠ feed)
 * - Real API entries don't have a by-ID public endpoint yet
 *
 * The cache is session-only (no persistence). If the user accesses a preview
 * URL directly without visiting the feed first, we fall back to the mock API.
 */

import type { CollectionModel, EntryModel } from '@/api/types/entryMock.types'

import { defineStore } from 'pinia'

export interface CachedEntry {
  kind: 'entry'
  entry: EntryModel
  /** Real price from backend, if available */
  priceXlm?: number
  /** Entry description/body, if available */
  description?: string
}

export interface CachedCollection {
  kind: 'collection'
  collection: CollectionModel
}

export type CachedItem = CachedEntry | CachedCollection

export const useFeedCacheStore = defineStore('feedCache', {
  state: () => ({
    items: new Map<string, CachedItem>(),
  }),

  actions: {
    /** Cache a single entry with optional metadata */
    cacheEntry (entry: EntryModel, meta?: { priceXlm?: number, description?: string }) {
      this.items.set(entry.id, {
        kind: 'entry',
        entry,
        priceXlm: meta?.priceXlm,
        description: meta?.description,
      })
    },

    /** Cache a single collection */
    cacheCollection (collection: CollectionModel) {
      this.items.set(collection.id, { kind: 'collection', collection })
    },

    /** Get a cached item by ID */
    getItem (id: string): CachedItem | undefined {
      return this.items.get(id)
    },

    /** Get a cached entry by ID (returns undefined if item is a collection) */
    getEntry (id: string): CachedEntry | undefined {
      const item = this.items.get(id)
      return item?.kind === 'entry' ? item : undefined
    },

    /** Get a cached collection by ID (returns undefined if item is an entry) */
    getCollection (id: string): CachedCollection | undefined {
      const item = this.items.get(id)
      return item?.kind === 'collection' ? item : undefined
    },

    /** Check if an item is in the cache */
    has (id: string): boolean {
      return this.items.has(id)
    },
  },
})
