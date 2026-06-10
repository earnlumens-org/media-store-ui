import type { PublicFranchiseDto } from '@/api/modules/franchise.api'

/**
 * Active franchise ("beta") store.
 *
 * Set by the `/f/:slug` storefront page when the visitor browses a franchise
 * sub-storefront of the current tenant. While a franchise is active the app
 * overrides the tenant's branding (logo, title, accent colour) and threads
 * the franchise slug into every purchase so the sale is attributed and the
 * franchise's commission is carved out of the franchisor's own share.
 *
 * Cleared on navigation away from `/f/:slug` so the plain tenant storefront
 * looks exactly as it did before.
 */
import { defineStore } from 'pinia'
import { getPublicFranchise } from '@/api/modules/franchise.api'
import { getCdnBaseUrl } from '@/config/env'

type LoadStatus = 'idle' | 'loading' | 'ready' | 'notFound' | 'error'

interface State {
  status: LoadStatus
  active: PublicFranchiseDto | null
}

export const useFranchiseStore = defineStore('franchise', {
  state: (): State => ({
    status: 'idle',
    active: null,
  }),

  getters: {
    /** True while a franchise sub-storefront is the active browsing context. */
    isActive: (state): boolean => state.status === 'ready' && state.active !== null,
    slug: (state): string | null => state.active?.slug ?? null,
    /** Franchise display title, when overriding the tenant brand text. */
    brandText: (state): string | null => {
      const title = state.active?.title?.trim()
      return title && title.length > 0 ? title : null
    },
    accentColor: (state): string | null => {
      const c = state.active?.accentColor?.trim()
      return c && c.length > 0 ? c : null
    },
    ownerDisplayName: (state): string | null => state.active?.ownerDisplayName ?? null,
    /** Public CDN URL for the franchise logo, or null to fall back to tenant. */
    logoUrl: (state): string | null => {
      if (!state.active?.logoR2Key) {
        return null
      }
      return `${getCdnBaseUrl()}/${state.active.logoR2Key}`
    },
    /** Public CDN URL for the franchise cover/hero image. */
    coverUrl: (state): string | null => {
      if (!state.active?.coverR2Key) {
        return null
      }
      return `${getCdnBaseUrl()}/${state.active.coverR2Key}`
    },
  },

  actions: {
    async loadBySlug (slug: string): Promise<void> {
      this.status = 'loading'
      try {
        this.active = await getPublicFranchise(slug)
        this.status = 'ready'
      } catch (error) {
        this.active = null
        const httpStatus = (error as { response?: { status?: number } })?.response?.status
        this.status = httpStatus === 404 ? 'notFound' : 'error'
        if (httpStatus !== 404) {
          console.warn('[franchiseStore] failed to load franchise', slug, error)
        }
      }
    },

    clear (): void {
      this.active = null
      this.status = 'idle'
    },
  },
})
