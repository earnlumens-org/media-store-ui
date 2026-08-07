/**
 * Content Language Preferences Store (Phase 4)
 *
 * Holds the consumer-side language filter for public feeds. One contract for
 * everyone — there is ALWAYS an effective preference:
 *
 *  - **Never configured (guest or logged-in):** the browser's languages.
 *    The store seeds from `navigator.languages` so the chip/dialog render the
 *    effective state, and the backend independently derives the same default
 *    from `Accept-Language` — no request param needed.
 *  - **Guests who configured:** persisted in `localStorage` (device-scoped)
 *    and enforced by sending an explicit `lang` CSV override on feed requests
 *    (see `feedLangParam`).
 *  - **Logged-in users who configured:** persisted server-side via
 *    `PATCH /api/user/me/preferences/content-languages` and enforced through
 *    access-token claims — no request param needed.
 *  - **First sign-in promotion:** if the account has no preferences yet but
 *    this device has explicit guest preferences, they are promoted to the
 *    account once (what the user set as a guest survives login).
 *  - **Logout:** full page reload; the store re-reads the guest state
 *    (explicit device prefs, else browser default). Account prefs stay on
 *    the account.
 *
 * When the effective filter matches nothing the backend automatically falls
 * back to all languages and flags the response (`languageFallback`) so feeds
 * can explain instead of rendering an empty wall.
 *
 * The store is loaded lazily — `loadIfNeeded()` is called by the picker
 * dialog on open and by the feed grid on mount.
 */

import { defineStore } from 'pinia'
import {
  type ContentLanguagePreferences,
  getCurrentUser,
  updateContentLanguagePreferences,
} from '@/api/modules/user.api'
import { setToken } from '@/services/tokenWorkerClient'
import { useAuthStore } from '@/stores/auth'

const GUEST_STORAGE_KEY = 'el_content_lang_prefs_v1'

interface State extends ContentLanguagePreferences {
  loaded: boolean
  saving: boolean
  error: string | null
  /**
   * True once the user has EXPLICITLY saved preferences (guest: on this
   * device via localStorage; logged-in: on their account). False means the
   * values in the store are the browser-derived default.
   */
  configured: boolean
  /**
   * Monotonic counter bumped ONLY when the user actively changes their
   * preferences via `update()` (or a guest→account promotion lands). Feed
   * components watch this (instead of the raw values) to decide when to
   * refetch: `loadIfNeeded()` syncing the navigator seed with stored prefs
   * must never trigger a refetch, because the backend already filtered the
   * initial request by the stored prefs — that redundant refetch caused an
   * empty-state flash.
   */
  revision: number
}

function readGuestPrefs (): { prefs: ContentLanguagePreferences, explicit: boolean } {
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY)
    if (!raw) {
      return { prefs: defaultPrefs(), explicit: false }
    }
    const parsed = JSON.parse(raw)
    const prefs: ContentLanguagePreferences = {
      contentLanguages: Array.isArray(parsed.contentLanguages) ? parsed.contentLanguages : [],
      includeMulti: typeof parsed.includeMulti === 'boolean' ? parsed.includeMulti : true,
      showAllLanguages: typeof parsed.showAllLanguages === 'boolean' ? parsed.showAllLanguages : false,
    }
    // An empty language list without "show all" carries no meaning under the
    // current contract (the dialog no longer allows saving it) — treat it as
    // not configured and fall back to the browser default.
    if (prefs.contentLanguages.length === 0 && !prefs.showAllLanguages) {
      return { prefs: defaultPrefs(), explicit: false }
    }
    return { prefs, explicit: true }
  } catch {
    return { prefs: defaultPrefs(), explicit: false }
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
  // except Chinese, whose content codes are script-bearing (zh-cn / zh-tw);
  // dedupe and cap at 3 to avoid an excessively wide filter. Mirrors the
  // backend's Accept-Language default so the chip shows what the server
  // actually filters by.
  const fromNavigator = (typeof navigator !== 'undefined' && navigator.languages
    ? Array.from(navigator.languages)
    : ['en'])
    .map(raw => {
      const l = raw.toLowerCase()
      if (l.startsWith('zh')) {
        return (l === 'zh-tw' || l === 'zh-hk' || l === 'zh-mo' || l.includes('hant'))
          ? 'zh-tw'
          : 'zh-cn'
      }
      return l.split('-')[0] ?? ''
    })
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
      configured: false,
      revision: 0,
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
        return 'All'
      }
      const head = langs.slice(0, 2).map(l => l.toUpperCase()).join(', ')
      const tail = langs.length > 2 ? ` +${langs.length - 2}` : ''
      return head + tail
    },

    /**
     * The `lang` request param feeds should send, or undefined.
     * - Logged-in: undefined — the token claims (or the server-side
     *   Accept-Language default for unconfigured accounts) drive filtering.
     * - Guest, not configured: undefined — server derives the same browser
     *   default from Accept-Language.
     * - Guest, configured: explicit CSV override ('all', or 'es,en[,multi]').
     */
    feedLangParam (state): string | undefined {
      const auth = useAuthStore()
      if (auth.isAuthenticated || !state.configured) {
        return undefined
      }
      if (state.showAllLanguages || state.contentLanguages.length === 0) {
        return 'all'
      }
      const parts = [...state.contentLanguages]
      if (state.includeMulti) {
        parts.push('multi')
      }
      return parts.join(',')
    },
  },

  actions: {
    /**
     * Load preferences once. Logged-in: from `/api/user/me` (promoting
     * explicit guest prefs to the account when the account has none yet).
     * Guests: from localStorage (or the browser default). Subsequent calls
     * are no-ops unless {@code force=true} is passed.
     */
    async loadIfNeeded (force = false): Promise<void> {
      if (this.loaded && !force) {
        return
      }
      const auth = useAuthStore()
      if (!auth.isAuthenticated) {
        const { prefs, explicit } = readGuestPrefs()
        this.contentLanguages = prefs.contentLanguages
        this.includeMulti = prefs.includeMulti
        this.showAllLanguages = prefs.showAllLanguages
        this.configured = explicit
        this.loaded = true
        return
      }
      try {
        const profile = await getCurrentUser()
        const server = profile.contentLanguagePreferences
        const serverConfigured = !!server
          && ((server.contentLanguages?.length ?? 0) > 0 || server.showAllLanguages === true)
        if (serverConfigured) {
          this.contentLanguages = server.contentLanguages ?? []
          this.includeMulti = server.includeMulti ?? true
          this.showAllLanguages = server.showAllLanguages ?? false
          this.configured = true
          this.loaded = true
          return
        }
        // Account never configured preferences. Keep the effective browser
        // default visible, and — first sign-in promotion — persist explicit
        // guest prefs from this device to the account so what the user set
        // before logging in survives login.
        const guest = readGuestPrefs()
        this.contentLanguages = guest.prefs.contentLanguages
        this.includeMulti = guest.prefs.includeMulti
        this.showAllLanguages = guest.prefs.showAllLanguages
        this.configured = false
        this.loaded = true
        if (guest.explicit) {
          // update() persists, swaps the refreshed token and bumps
          // `revision` so feeds refetch with the promoted prefs.
          await this.update(guest.prefs).catch(error => {
            console.warn('[contentLangPrefs] guest→account promotion failed', error)
          })
        }
      } catch (error) {
        console.warn('[contentLangPrefs] failed to load /me', error)
        // Fall back to defaults so the UI is still usable.
        const fallback = defaultPrefs()
        this.contentLanguages = fallback.contentLanguages
        this.includeMulti = fallback.includeMulti
        this.showAllLanguages = fallback.showAllLanguages
        this.configured = false
        this.loaded = true
      }
    },

    /**
     * Persist a partial update. Logged-in: PATCH server. Guests: write
     * localStorage. The store is updated optimistically and rolled back
     * on server error.
     */
    async update (patch: Partial<ContentLanguagePreferences>): Promise<void> {
      const previous: ContentLanguagePreferences & { configured: boolean } = {
        contentLanguages: [...this.contentLanguages],
        includeMulti: this.includeMulti,
        showAllLanguages: this.showAllLanguages,
        configured: this.configured,
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
        this.configured = true
        this.revision++
        return
      }
      this.saving = true
      this.error = null
      try {
        const saved = await updateContentLanguagePreferences(patch)
        this.contentLanguages = saved.contentLanguages ?? []
        this.includeMulti = saved.includeMulti ?? true
        this.showAllLanguages = saved.showAllLanguages ?? false
        this.configured = true
        // The backend reads language prefs from JWT claims (no DB lookup per
        // feed request), so swap in the freshly minted token BEFORE bumping
        // the revision — otherwise refetching feeds would still send the old
        // token with the old claims until it expires.
        if (saved.accessToken) {
          try {
            await setToken(saved.accessToken)
          } catch (error) {
            console.warn('[contentLangPrefs] failed to swap refreshed token', error)
          }
        }
        // Bump only after the server has persisted: feeds refetching on this
        // signal are guaranteed to be filtered by the new prefs.
        this.revision++
      } catch (error) {
        // Roll back optimistic state on failure.
        this.contentLanguages = previous.contentLanguages
        this.includeMulti = previous.includeMulti
        this.showAllLanguages = previous.showAllLanguages
        this.configured = previous.configured
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
      this.configured = false
    },
  },
})
