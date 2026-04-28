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

export type VisitorStatus = 'idle' | 'loading' | 'ready' | 'error'

interface State {
  status: VisitorStatus
  kind: VisitorKind | null
  subdomain: string | null
}

export const useTenantStore = defineStore('tenant', {
  state: (): State => ({
    status: 'idle',
    kind: null,
    subdomain: null,
  }),

  getters: {
    isReady: state => state.status === 'ready',
    isNotFound: state => state.status === 'ready' && state.kind === 'notFound',
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
        this.status = 'ready'
      } catch (error) {
        // Probe failed (network, 5xx). Treat as platform so the SPA still
        // boots — a transient backend issue must not brand every visitor
        // as "tenant not found".
        console.warn('[tenantStore] visitor probe failed, falling back to platform', error)
        this.kind = 'platform'
        this.subdomain = null
        this.status = 'ready'
      }
    },
  },
})
