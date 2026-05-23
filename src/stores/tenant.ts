/**
 * Visitor/tenant resolution store.
 *
 * Loaded once at app boot from `App.vue` BEFORE any storefront component
 * renders. Until `status === 'ready'`, the app shows a minimal splash so
 * we never flash the default tenant for a user who is actually on a
 * not-found subdomain.
 */
import { defineStore } from 'pinia'

import { fetchVisitorContext, type TenantBanner, type VisitorKind } from '@/api/modules/tenant.api'
import { getCdnBaseUrl } from '@/config/env'

export type VisitorStatus = 'idle' | 'loading' | 'ready' | 'error'

interface State {
  status: VisitorStatus
  kind: VisitorKind | null
  subdomain: string | null
  /** Optional storefront app-bar label. Null means "use the hardcoded default". */
  brandText: string | null
  /** When true the storefront renders no text label next to the logo. */
  brandTextHidden: boolean
  /** Optional R2 object key for the storefront logo. Null means "use the hardcoded SVG". */
  logoR2Key: string | null
  /** Optional dark-theme logo R2 key. Falls back to logoR2Key when null. */
  logoR2KeyDark: string | null
  /** Optional per-tenant hero banner block. Null means "do not render". */
  banner: TenantBanner | null
  /**
   * Per-tenant default Vuetify theme keys. Null means "use the platform
   * defaults from vuetify.ts". App.vue consumes these on boot when the
   * visitor has no localStorage preference yet, and CxDarkLightMode uses
   * them when toggling so the tenant's pick wins over the platform default.
   */
  defaultLightTheme: string | null
  defaultDarkTheme: string | null
  /**
   * Per-tenant uploads master switch. Defaults to {@code true} so the
   * storefront is open by default; flipped to {@code false} only when
   * the admin UI sets the kill switch. Consumed by upload entry points
   * (CreatorStudio, UploadForm) to hide/disable the button before the
   * user even attempts /api/uploads/init.
   */
  uploadsEnabled: boolean
}

export const useTenantStore = defineStore('tenant', {
  state: (): State => ({
    status: 'idle',
    kind: null,
    subdomain: null,
    brandText: null,
    brandTextHidden: false,
    logoR2Key: null,
    logoR2KeyDark: null,
    banner: null,
    defaultLightTheme: null,
    defaultDarkTheme: null,
    uploadsEnabled: true,
  }),

  getters: {
    isReady: state => state.status === 'ready',
    isNotFound: state => state.status === 'ready' && state.kind === 'notFound',
    /**
     * Public CDN URL for the tenant logo (light variant), composed from
     * the env-aware CDN base and the R2 key returned by the visitor probe.
     * Null when the tenant has no custom logo set, so the AppBar can fall
     * back to the hardcoded SVG without any further branching in the
     * template.
     */
    logoUrl: (state): string | null => {
      if (!state.logoR2Key) {
        return null
      }
      return `${getCdnBaseUrl()}/${state.logoR2Key}`
    },
    /**
     * Public CDN URL for the dark-theme logo. Falls back to the light
     * variant when the tenant has not uploaded a dark logo so callers
     * can use this getter unconditionally in dark mode.
     */
    logoUrlDark (state): string | null {
      const darkKey = state.logoR2KeyDark ?? state.logoR2Key
      if (!darkKey) {
        return null
      }
      return `${getCdnBaseUrl()}/${darkKey}`
    },
    /**
     * Public CDN URL for the hero banner image. Composed from the env-aware
     * CDN base. Null when no banner is configured or it has no image, so
     * callers can fall back to a gradient-only banner.
     */
    bannerImageUrl (state): string | null {
      if (!state.banner || !state.banner.imageR2Key) {
        return null
      }
      return `${getCdnBaseUrl()}/${state.banner.imageR2Key}`
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
        this.brandTextHidden = ctx.brandTextHidden ?? false
        this.logoR2Key = ctx.logoR2Key ?? null
        this.logoR2KeyDark = ctx.logoR2KeyDark ?? null
        this.banner = ctx.banner ?? null
        this.defaultLightTheme = ctx.defaultLightTheme ?? null
        this.defaultDarkTheme = ctx.defaultDarkTheme ?? null
        this.uploadsEnabled = ctx.uploadsEnabled ?? true
        this.status = 'ready'
      } catch (error) {
        // Probe failed (network, 5xx). Treat as platform so the SPA still
        // boots — a transient backend issue must not brand every visitor
        // as "tenant not found".
        console.warn('[tenantStore] visitor probe failed, falling back to platform', error)
        this.kind = 'platform'
        this.subdomain = null
        this.brandText = null
        this.brandTextHidden = false
        this.logoR2Key = null
        this.logoR2KeyDark = null
        this.banner = null
        this.defaultLightTheme = null
        this.defaultDarkTheme = null
        this.uploadsEnabled = true
        this.status = 'ready'
      }
    },
  },
})
