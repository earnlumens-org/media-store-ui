/**
 * Content Language Preferences Store (Phase 4)
 *
 * Holds the consumer-side language filter for public feeds. Two modes:
 *  - **Logged-in users:** preferences are persisted server-side via
 *    `PATCH /api/user/me/preferences/content-languages`. The backend reads
 *    them on every public-feed request, so the UI store is purely for
 *    rendering the picker chip + dialog.
 *  - **Guests:** the backend always returns `LanguageFilter.NONE` for
 *    anonymous requests, so guest preferences are not enforced today.
 *    A future iteration may forward `?lang=...` for guests; this store is
 *    designed so guest state lives in `localStorage` and can be promoted
 *    to the server on first sign-in.
 *
 * The store is loaded lazily — `loadIfNeeded()` is called by the picker
 * dialog on open and by `App.vue` once auth is ready (best-effort).
 */

import { defineStore } from 'pinia'
import {
  type ContentLanguagePreferences,
  getCurrentUser,
  updateContentLanguagePreferences,
} from '@/api/modules/user.api'
import { useAuthStore } from '@/stores/auth'

const GUEST_STORAGE_KEY = 'el_content_lang_prefs_v1'

interface State extends ContentLanguagePreferences {
  loaded: boolean
  saving: boolean
  error: string | null
}

function readGuestPrefs (): ContentLanguagePreferences {
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY)
    if (!raw) {
      return defaultPrefs()
    }
    const parsed = JSON.parse(raw)
    return {
      contentLanguages: Array.isArray(parsed.contentLanguages) ? parsed.contentLanguages : [],
      includeMulti: typeof parsed.includeMulti === 'boolean' ? parsed.includeMulti : true,
      showAllLanguages: typeof parsed.showAllLanguages === 'boolean' ? parsed.showAllLanguages : false,
    }
  } catch {
    return defaultPrefs()
  }
}

function writeGuestPrefs (prefs: ContentLanguagePreferences): void {
  try {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // localStorage unavailable (private mode, quota) — silently ignore;
    // the store still works in-memory for the current session.
  }
}

function defaultPrefs (): ContentLanguagePreferences {
  // Seed from the browser's preferred languages so first-time users get
  // a sensible default without any setup. Strip region tags ("en-US" → "en")
  // and dedupe; cap at 3 to avoid an excessively wide filter.
  const fromNavigator = (typeof navigator !== 'undefined' && navigator.languages
    ? Array.from(navigator.languages)
    : ['en'])
    .map(l => l.toLowerCase().split('-')[0] ?? '')
    .filter((l, i, a) => l && a.indexOf(l) === i)
    .slice(0, 3)
  return {
    contentLanguages: fromNavigator,
    includeMulti: true,
    showAllLanguages: false,
  }
}

export const useContentLanguagePreferencesStore = defineStore('contentLanguagePreferences', {
  state: (): State => {
    // Seed from navigator.languages so the chip + modal show a sensible
    // value on first paint, BEFORE loadIfNeeded() resolves. Once loaded,
    // server/localStorage values overwrite this.
    const seed = defaultPrefs()
    return {
      contentLanguages: seed.contentLanguages,
      includeMulti: seed.includeMulti,
      showAllLanguages: seed.showAllLanguages,
      loaded: false,
      saving: false,
      error: null,
    }
  },

  getters: {
    /** Human-readable summary for the picker chip (e.g. "ES, EN +1" or "All"). */
    summary (state): string {
      if (state.showAllLanguages) {
        return 'All'
      }
      const langs = state.contentLanguages
      if (langs.length === 0) {
        return state.includeMulti ? 'Multi' : 'None'
      }
      const head = langs.slice(0, 2).map(l => l.toUpperCase()).join(', ')
      const tail = langs.length > 2 ? ` +${langs.length - 2}` : ''
      return head + tail
    },
  },

  actions: {
    /**
     * Load preferences once. Logged-in: from `/api/user/me`. Guests: from
     * localStorage (or defaults). Subsequent calls are no-ops unless
     * {@code force=true} is passed.
     */
    async loadIfNeeded (force = false): Promise<void> {
      if (this.loaded && !force) {
        return
      }
      const auth = useAuthStore()
      if (!auth.isAuthenticated) {
        const prefs = readGuestPrefs()
        this.contentLanguages = prefs.contentLanguages
        this.includeMulti = prefs.includeMulti
        this.showAllLanguages = prefs.showAllLanguages
        this.loaded = true
        return
      }
      try {
        const profile = await getCurrentUser()
        const prefs = profile.contentLanguagePreferences ?? defaultPrefs()
        this.contentLanguages = prefs.contentLanguages ?? []
        this.includeMulti = prefs.includeMulti ?? true
        this.showAllLanguages = prefs.showAllLanguages ?? false
        this.loaded = true
      } catch (error) {
        console.warn('[contentLangPrefs] failed to load /me', error)
        // Fall back to defaults so the UI is still usable.
        const fallback = defaultPrefs()
        this.contentLanguages = fallback.contentLanguages
        this.includeMulti = fallback.includeMulti
        this.showAllLanguages = fallback.showAllLanguages
        this.loaded = true
      }
    },

    /**
     * Persist a partial update. Logged-in: PATCH server. Guests: write
     * localStorage. The store is updated optimistically and rolled back
     * on server error.
     */
    async update (patch: Partial<ContentLanguagePreferences>): Promise<void> {
      const previous: ContentLanguagePreferences = {
        contentLanguages: [...this.contentLanguages],
        includeMulti: this.includeMulti,
        showAllLanguages: this.showAllLanguages,
      }
      // Optimistic apply
      if (patch.contentLanguages !== undefined) {
        this.contentLanguages = [...patch.contentLanguages]
      }
      if (patch.includeMulti !== undefined) {
        this.includeMulti = patch.includeMulti
      }
      if (patch.showAllLanguages !== undefined) {
        this.showAllLanguages = patch.showAllLanguages
      }

      const auth = useAuthStore()
      if (!auth.isAuthenticated) {
        writeGuestPrefs({
          contentLanguages: this.contentLanguages,
          includeMulti: this.includeMulti,
          showAllLanguages: this.showAllLanguages,
        })
        return
      }
      this.saving = true
      this.error = null
      try {
        const saved = await updateContentLanguagePreferences(patch)
        this.contentLanguages = saved.contentLanguages ?? []
        this.includeMulti = saved.includeMulti ?? true
        this.showAllLanguages = saved.showAllLanguages ?? false
      } catch (error) {
        // Roll back optimistic state on failure.
        this.contentLanguages = previous.contentLanguages
        this.includeMulti = previous.includeMulti
        this.showAllLanguages = previous.showAllLanguages
        this.error = error instanceof Error ? error.message : 'Failed to save preferences'
        throw error
      } finally {
        this.saving = false
      }
    },

    /** Wipe in-memory state (called on logout). Re-seeds from navigator. */
    reset (): void {
      const seed = defaultPrefs()
      this.contentLanguages = seed.contentLanguages
      this.includeMulti = seed.includeMulti
      this.showAllLanguages = seed.showAllLanguages
      this.loaded = false
      this.saving = false
      this.error = null
    },
  },
})
