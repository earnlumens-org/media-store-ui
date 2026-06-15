/**
 * Environment configuration for API base URL resolution.
 *
 * Priority:
 * 1. VITE_API_BASE_URL env var (if set, overrides everything)
 * 2. Runtime hostname detection:
 *    - localhost / 127.0.0.1                       -> http://localhost:8080
 *    - app-dev.earnlumens.org / *.app-dev.earnlumens.org -> https://api-dev.earnlumens.org
 *    - earnlumens.org / *.earnlumens.org (prod)   -> SAME ORIGIN
 *
 * Why same-origin in production:
 *   The tenant edge Worker rewrites *.earnlumens.org/api/* to the backend
 *   while keeping the original host. Calling the API on the same origin the
 *   user is browsing means the refresh cookie stays host-only (scoped to
 *   acme.earnlumens.org, not visible to widget.earnlumens.org) and CORS
 *   isn't involved. This is the foundation of tenant session isolation.
 */

/**
 * Primary apex host for this deployment.
 *
 * This is the ONLY value that needs to change to run the whole frontend
 * under a different domain. Defaults to `earnlumens.org`; override at build
 * time with `VITE_PRIMARY_HOST` (e.g. each Cloudflare Pages project bakes its
 * own domain). Every dev/api/cdn hostname and the brand name are derived from
 * it, so a single variable re-brands and re-points the entire SPA.
 */
const PRIMARY_HOST: string = (() => {
  const raw = import.meta.env.VITE_PRIMARY_HOST
  return typeof raw === 'string' && raw.trim() !== ''
    ? raw.trim().toLowerCase()
    : 'earnlumens.org'
})()

/** Dev/api/cdn hostnames derived from the primary apex. */
const APP_DEV_HOST = `app-dev.${PRIMARY_HOST}`
const API_DEV_HOST = `api-dev.${PRIMARY_HOST}`
const CDN_DEV_HOST = `cdn-dev.${PRIMARY_HOST}`

/** API base URLs per environment for non-production targets */
const API_URLS = {
  local: 'http://localhost:8080',
  tunnelDev: `https://${API_DEV_HOST}`,
} as const

/** CDN base URLs per environment.
 *  - production / tunnelDev: `${currentOrigin()}/cdn` so requests stay on
 *    the visitor's tenant origin and the host-only refresh-cookie is sent
 *    along. The cdn-worker is also bound to `<tenant>/cdn/*` and strips
 *    the prefix internally, so the existing /media and /public paths keep
 *    working unchanged.
 *  - local: still hits the dev CDN host directly because the local SPA
 *    runs on http://localhost:3000 and there's no edge proxy in front.
 */
const CDN_URLS = {
  local: `https://${CDN_DEV_HOST}`,
} as const

/** Stellar Horizon URLs per environment */
const STELLAR_HORIZON_URLS = {
  local: 'https://horizon-testnet.stellar.org',
  tunnelDev: 'https://horizon-testnet.stellar.org',
  production: 'https://horizon.stellar.org',
} as const

/** Stellar network passphrases per environment */
const STELLAR_NETWORK_PASSPHRASES = {
  local: 'Test SDF Network ; September 2015',
  tunnelDev: 'Test SDF Network ; September 2015',
  production: 'Public Global Stellar Network ; September 2015',
} as const

type Environment = 'local' | 'tunnelDev' | 'production'

function normalizeBaseUrl (value: string): string {
  const trimmed = value.trim()
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed
}

/**
 * Returns the current origin in both window and Web Worker contexts.
 * Used as the API base URL in production (same-origin).
 */
function currentOrigin (): string {
  if (typeof globalThis !== 'undefined' && 'location' in globalThis) {
    return (globalThis as { location: { origin: string } }).location.origin
  }
  if (typeof self !== 'undefined' && 'location' in self) {
    return self.location.origin
  }
  // SSR: fall back to apex
  return `https://${PRIMARY_HOST}`
}

/**
 * Detects the current environment based on the current hostname.
 * Works in both main thread (window) and Web Workers (self).
 */
function detectEnvironment (): Environment {
  // Get hostname - works in both main thread and Web Workers
  let hostname: string

  if (typeof globalThis !== 'undefined' && 'location' in globalThis) {
    hostname = (globalThis as { location: { hostname: string } }).location.hostname
  } else if (typeof self !== 'undefined' && 'location' in self) {
    hostname = self.location.hostname
  } else {
    // SSR or unknown environment - fallback to local
    return 'local'
  }

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'local'
  }

  // Dev tunnel covers both the bare host and any tenant subdomain under it
  // (e.g. acme.app-dev.<apex>). The wildcard CNAME → cloudflared tunnel
  // routes every *.app-dev.<apex> request to the local SPA, so they all
  // share the tunnelDev API + CDN endpoints.
  if (
    hostname === APP_DEV_HOST
    || hostname.endsWith(`.${APP_DEV_HOST}`)
  ) {
    return 'tunnelDev'
  }

  // <apex> or *.<apex> -> production (same-origin)
  if (hostname === PRIMARY_HOST || hostname.endsWith(`.${PRIMARY_HOST}`)) {
    return 'production'
  }

  // Fallback for unknown hostnames (e.g., preview deploys) -> production API
  return 'production'
}

/**
 * Returns the current hostname in both window and Web Worker contexts.
 */
function currentHostname (): string {
  if (typeof globalThis !== 'undefined' && 'location' in globalThis) {
    return (globalThis as { location: { hostname: string } }).location.hostname
  }
  if (typeof self !== 'undefined' && 'location' in self) {
    return self.location.hostname
  }
  return ''
}

/**
 * Resolves the API base URL using runtime hostname detection.
 * Falls back to VITE_API_BASE_URL env var if explicitly set.
 */
function resolveApiBaseUrl (): string {
  // Allow explicit override via env var
  const envOverride = import.meta.env.VITE_API_BASE_URL
  if (typeof envOverride === 'string' && envOverride.trim() !== '') {
    return normalizeBaseUrl(envOverride)
  }

  // Runtime hostname-based detection
  const env = detectEnvironment()
  // production  : every tenant talks to its own origin; the edge Worker
  //               routes /api/* to the backend behind the scenes.
  // tunnelDev   : same-origin for BOTH the bare app-dev host and tenant
  //               subdomains. The tenants-router dev env binds
  //               app-dev.earnlumens.org/api/* and /public/* and proxies
  //               them to api-dev with X-Visitor-Host, mirroring prod.
  //               Same-origin is what scopes the host-only refresh cookie
  //               to app-dev so it reaches the cdn-worker on /cdn/* —
  //               calling api-dev directly would scope the cookie to
  //               api-dev and paid content would 403 at the CDN.
  // local       : http://localhost:8080.
  let baseUrl: string
  if (env === 'production' || env === 'tunnelDev') {
    baseUrl = currentOrigin()
  } else {
    baseUrl = API_URLS[env]
  }

  // Dev-only logging to verify correct resolution
  if (import.meta.env.DEV) {
    console.info(`[env] API base URL resolved: ${baseUrl} (env: ${env}, hostname: ${currentHostname()})`)
  }

  return baseUrl
}

// Cache the resolved URL (evaluated once at module load)
let cachedApiBaseUrl: string | null = null

export function getApiBaseUrl (): string {
  if (cachedApiBaseUrl === null) {
    cachedApiBaseUrl = resolveApiBaseUrl()
  }
  return cachedApiBaseUrl
}

/**
 * Builds a full API URL from a relative path.
 */
export function apiUrl (path: string): string {
  const baseUrl = getApiBaseUrl()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return new URL(normalizedPath, baseUrl).toString()
}

// ==================== CDN URL helpers ====================

// Cache the resolved CDN URL (evaluated once at module load)
let cachedCdnBaseUrl: string | null = null

/**
 * Returns the CDN base URL for the current environment.
 * Supports VITE_CDN_BASE_URL override.
 *
 * In production and the dev tunnel the CDN is served from a same-origin
 * `/cdn` path on the tenant origin (the cdn-worker is bound to
 * `<tenant>/cdn/*` in addition to its legacy `cdn.<apex>` host). This
 * keeps cookies, CORS and tenant resolution all aligned with the tenant
 * subdomain the user is browsing.
 */
export function getCdnBaseUrl (): string {
  if (cachedCdnBaseUrl === null) {
    const envOverride = import.meta.env.VITE_CDN_BASE_URL
    if (typeof envOverride === 'string' && envOverride.trim() !== '') {
      cachedCdnBaseUrl = normalizeBaseUrl(envOverride)
    } else {
      const env = detectEnvironment()
      cachedCdnBaseUrl = env === 'local'
        ? CDN_URLS.local
        : `${currentOrigin()}/cdn`
    }
  }
  return cachedCdnBaseUrl
}

/**
 * Builds a CDN URL for a PUBLIC asset (thumbnail, preview).
 * The r2Key already includes the "public/" prefix as stored in R2.
 *
 * @example cdnPublicUrl('public/thumbs/abc.jpg')
 *          // => 'https://earnlumens.org/cdn/public/thumbs/abc.jpg'  (prod)
 */
export function cdnPublicUrl (r2Key: string): string {
  const key = r2Key.startsWith('/') ? r2Key.slice(1) : r2Key
  return `${getCdnBaseUrl()}/${key}`
}

/**
 * Widths (in CSS pixels) of the WebP variants emitted by the
 * thumbnail-worker for every approved entry/collection cover.
 * Keep in sync with `thumbnail-worker/src/index.mjs` (TARGET_WIDTHS).
 */
export const THUMBNAIL_VARIANT_WIDTHS = [320, 640, 1280] as const

/**
 * Builds an `<img srcset>` string from a server-supplied R2 prefix
 * containing the pre-generated WebP variants ({@code 320.webp},
 * {@code 640.webp}, {@code 1280.webp}).
 *
 * Returns {@code undefined} when the prefix is empty/missing — callers
 * must always fall back to the legacy {@code thumbnailR2Key} as the
 * single {@code src}, so older entries (worker has not run, was
 * skipped, or failed) keep rendering.
 *
 * @example
 *   r2VariantsPrefixToSrcset('public/entries/abc123/thumb-variants')
 *   // => 'https://earnlumens.org/cdn/public/entries/abc123/thumb-variants/320.webp 320w, ...'
 */
export function r2VariantsPrefixToSrcset (prefix?: string): string | undefined {
  if (!prefix) {
    return undefined
  }
  const cleanPrefix = prefix.replace(/^\/+|\/+$/g, '')
  const base = `${getCdnBaseUrl()}/${cleanPrefix}`
  return THUMBNAIL_VARIANT_WIDTHS
    .map(w => `${base}/${w}.webp ${w}w`)
    .join(', ')
}

/**
 * Builds a CDN URL for a PRIVATE media entry.
 * Auth is handled via refresh-cookie session by the CDN Worker.
 *
 * @example cdnMediaUrl('entry-uuid-123')
 *          // => 'https://earnlumens.org/cdn/media/entry-uuid-123'  (prod)
 */
export function cdnMediaUrl (entryId: string): string {
  return `${getCdnBaseUrl()}/media/${entryId}`
}

/**
 * Builds the CDN URL for an entry's HLS master playlist (authenticated).
 *
 * @example cdnHlsUrl('665a1b2c3d4e5f6a7b8c9d0e')
 *          // => 'https://earnlumens.org/cdn/media/665a.../hls/master.m3u8'  (prod)
 */
export function cdnHlsUrl (entryId: string): string {
  return `${getCdnBaseUrl()}/media/${entryId}/hls/master.m3u8`
}

/**
 * Returns the detected environment name (useful for debugging).
 */
export function getEnvironment (): Environment {
  return detectEnvironment()
}

// ==================== Platform branding helpers ====================

/**
 * The platform's apex domain for this deployment, e.g. `earnlumens.org`.
 * Use this for any user-visible domain reference (links, "powered by", etc.)
 * so a different deployment automatically shows its own domain.
 */
export function getPlatformDomain (): string {
  return PRIMARY_HOST
}

/**
 * The platform brand name derived from the domain: the first label,
 * uppercased. `earnlumens.org` -> `EARNLUMENS`, `pepe.com` -> `PEPE`.
 * Use this for any user-visible brand/title text.
 */
export function getPlatformName (): string {
  return (PRIMARY_HOST.split('.')[0] || PRIMARY_HOST).toUpperCase()
}

/**
 * Rewrites the canonical brand tokens baked into translation strings to
 * this deployment's domain/name:
 *   `earnlumens.org` -> getPlatformDomain()  (domains, emails, links)
 *   `EarnLumens`     -> getPlatformName()    (display brand, uppercased)
 * The two tokens never overlap textually (one is all-lowercase, the other
 * CamelCase), so the order is irrelevant. On earnlumens.org the only visible
 * effect is the brand becoming uppercase, per the branding directive.
 */
export function normalizeBrandText (value: string): string {
  return value
    .split('earnlumens.org').join(getPlatformDomain())
    .split('EarnLumens').join(getPlatformName())
}

// ==================== Stellar network helpers ====================

let cachedHorizonUrl: string | null = null

/**
 * Returns the Stellar Horizon URL for the current environment.
 * - local / tunnelDev → testnet (horizon-testnet.stellar.org)
 * - production → mainnet (horizon.stellar.org)
 *
 * Supports VITE_STELLAR_HORIZON_URL override.
 */
export function getStellarHorizonUrl (): string {
  if (cachedHorizonUrl === null) {
    const envOverride = import.meta.env.VITE_STELLAR_HORIZON_URL
    cachedHorizonUrl = typeof envOverride === 'string' && envOverride.trim() !== ''
      ? normalizeBaseUrl(envOverride)
      : STELLAR_HORIZON_URLS[detectEnvironment()]
  }
  return cachedHorizonUrl
}

let cachedNetworkPassphrase: string | null = null

/**
 * Returns the Stellar network passphrase for the current environment.
 * - local / tunnelDev → Test SDF Network ; September 2015
 * - production → Public Global Stellar Network ; September 2015
 *
 * Supports VITE_STELLAR_NETWORK_PASSPHRASE override.
 */
export function getStellarNetworkPassphrase (): string {
  if (cachedNetworkPassphrase === null) {
    const envOverride = import.meta.env.VITE_STELLAR_NETWORK_PASSPHRASE
    cachedNetworkPassphrase = typeof envOverride === 'string' && envOverride.trim() !== ''
      ? envOverride.trim()
      : STELLAR_NETWORK_PASSPHRASES[detectEnvironment()]
  }
  return cachedNetworkPassphrase
}

/**
 * Returns the Stellar Expert network slug for the current environment.
 * - local / tunnelDev → 'testnet'
 * - production → 'public'
 */
export function getStellarExpertNetwork (): string {
  return detectEnvironment() === 'production' ? 'public' : 'testnet'
}

/**
 * Builds a Stellar Expert transaction URL for the current network.
 */
export function getStellarExpertTxUrl (transactionHash: string): string {
  return `https://stellar.expert/explorer/${getStellarExpertNetwork()}/tx/${transactionHash}`
}
