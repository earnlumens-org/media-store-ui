/**
 * Scroll Cache Store
 *
 * Caches scroll position + component data per route so that navigating
 * back (browser back/forward) restores exactly where the user left off.
 * Entries expire after 5 minutes to avoid stale data.
 */
import { defineStore } from 'pinia'

const MAX_AGE_MS = 5 * 60 * 1000

export const useScrollCacheStore = defineStore('scrollCache', () => {
  const cache = new Map<string, Record<string, unknown>>()

  function save (key: string, data: Record<string, unknown>) {
    cache.set(key, { ...data, _savedAt: Date.now() })
  }

  function get (key: string): Record<string, unknown> | undefined {
    const entry = cache.get(key)
    if (!entry) {
      return undefined
    }

    if (Date.now() - (entry._savedAt as number) > MAX_AGE_MS) {
      cache.delete(key)
      return undefined
    }

    return entry
  }

  function remove (key: string) {
    cache.delete(key)
  }

  function clear () {
    cache.clear()
  }

  return { save, get, remove, clear }
})
