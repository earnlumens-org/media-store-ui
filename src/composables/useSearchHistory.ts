/**
 * localStorage-backed recent-search history, the way large platforms surface
 * past queries in the search box.
 *
 * History is scoped per tenant (keyed by host) so searches made on one
 * tenant storefront never leak into another's suggestions — consistent with
 * the tenant-isolation guarantees of the rest of the app.
 */

import { ref } from 'vue'

const MAX_ENTRIES = 12
const KEY_PREFIX = 'ms.searchHistory'

function storageKey (): string {
  // window.location.host already distinguishes tenants (each storefront is a
  // distinct host), so it is a safe, stable per-tenant namespace.
  const host = typeof window === 'undefined' ? 'default' : window.location.host
  return `${KEY_PREFIX}:${host}`
}

function read (): string[] {
  if (typeof window === 'undefined') {
    return []
  }
  try {
    const raw = window.localStorage.getItem(storageKey())
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : []
  } catch {
    return []
  }
}

function write (items: string[]): void {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.localStorage.setItem(storageKey(), JSON.stringify(items))
  } catch {
    // storage full / disabled — history is a best-effort nicety
  }
}

// Shared reactive state so every consumer (dialog, results page) stays in sync.
const history = ref<string[]>(read())

export function useSearchHistory () {
  function refresh () {
    history.value = read()
  }

  function add (term: string) {
    const value = term.trim()
    if (!value) {
      return
    }
    const lower = value.toLowerCase()
    const next = [value, ...history.value.filter(t => t.toLowerCase() !== lower)]
    history.value = next.slice(0, MAX_ENTRIES)
    write(history.value)
  }

  function remove (term: string) {
    const lower = term.toLowerCase()
    history.value = history.value.filter(t => t.toLowerCase() !== lower)
    write(history.value)
  }

  function clear () {
    history.value = []
    write(history.value)
  }

  return { history, add, remove, clear, refresh }
}
