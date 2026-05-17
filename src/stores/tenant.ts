/**
 * Visitor/tenant resolution store.
 *
 * Loaded once at app boot from `App.vue` BEFORE any storefront component
 * renders. Until `status === 'ready'`, the app shows a minimal splash so
 * we never flash the default tenant for a user who is actually on a
 * not-found subdomain.
 */
import { defineStore } from 'pinia'

import { fetchVisitorContext, type VisitorKind } from '@/api/modules/tenant.api'
import { getCdnBaseUrl } from '@/config/env'

export type VisitorStatus = 'idle' | 'loading' | 'ready' | 'error'

interface State {
  status: VisitorStatus
  kind: VisitorKind | null
  subdomain: string | null
  /** Optional storefront app-bar label. Null means "use the hardcoded default". */
  brandText: string | null
  /** Optional R2 object key for the storefront logo. Null means "use the hardcoded SVG". */
  logoR2Key: string | null
}

export const useTenantStore = defineStore('tenant', {
  state: (): State => ({
    status: 'idle',
    kind: null,
    subdomain: null,
    brandText: null,
    logoR2Key: null,
  }),

  getters: {
    isReady: state => state.status === 'ready',
    isNotFound: state => state.status === 'ready' && state.kind === 'notFound',
    /**
     * Public CDN URL for the tenant logo, composed from the env-aware CDN
     * base and the R2 key returned by the visitor probe. Null when the
     * tenant has no custom logo set, so the AppBar can fall back to the
     * hardcoded SVG without any further branching in the template.
     */
    logoUrl: (state): string | null => {
      if (!state.logoR2Key) return null
      return `${getCdnBaseUrl()}/${state.logoR2Key}`
    },
  },

  actions: {
    async load (): Promise<void> {
      if (this.status === 'loading' || this.status === 'ready') {
        return
      }
      this.status = 'loading'
      try {
        const ctx = await fetchVisitorContext()
        this.kind = ctx.kind
        this.subdomain = ctx.subdomain ?? null
        this.brandText = ctx.brandText ?? null
        this.logoR2Key = ctx.logoR2Key ?? null
        this.status = 'ready'
      } catch (error) {
        // Probe failed (network, 5xx). Treat as platform so the SPA still
        // boots — a transient backend issue must not brand every visitor
        // as "tenant not found".
        console.warn('[tenantStore] visitor probe failed, falling back to platform', error)
        this.kind = 'platform'
        this.subdomain = null
        this.brandText = null
        this.logoR2Key = null
        this.status = 'ready'
      }
    },
  },
})
