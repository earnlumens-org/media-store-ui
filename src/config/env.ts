/**
 * Environment configuration for API base URL resolution.
 *
 * Priority:
 * 1. VITE_API_BASE_URL env var (if set, overrides everything)
 * 2. Runtime hostname detection:
 *    - localhost / 127.0.0.1      -> http://localhost:8080
 *    - app-dev.earnlumens.org     -> https://api-dev.earnlumens.org
 *    - earnlumens.org (prod)      -> https://api.earnlumens.org
 */

/** API base URLs per environment */
const API_URLS = {
  local: 'http://localhost:8080',
  tunnelDev: 'https://api-dev.earnlumens.org',
  production: 'https://api.earnlumens.org',
} as const

/** CDN base URLs per environment */
const CDN_URLS = {
  local: 'https://cdn-dev.earnlumens.org',
  tunnelDev: 'https://cdn-dev.earnlumens.org',
  production: 'https://cdn.earnlumens.org',
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

  if (hostname === 'app-dev.earnlumens.org') {
    return 'tunnelDev'
  }

  // earnlumens.org or www.earnlumens.org -> production
  if (hostname === 'earnlumens.org' || hostname.endsWith('.earnlumens.org')) {
    return 'production'
  }

  // Fallback for unknown hostnames (e.g., preview deploys) -> production API
  return 'production'
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
  const baseUrl = API_URLS[env]

  // Dev-only logging to verify correct resolution
  if (import.meta.env.DEV) {
    const hostname = typeof globalThis !== 'undefined' && 'location' in globalThis
      ? (globalThis as { location: { hostname: string } }).location.hostname
      : 'unknown'
    console.info(`[env] API base URL resolved: ${baseUrl} (env: ${env}, hostname: ${hostname})`)
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
 */
export function getCdnBaseUrl (): string {
  if (cachedCdnBaseUrl === null) {
    const envOverride = import.meta.env.VITE_CDN_BASE_URL
    cachedCdnBaseUrl = typeof envOverride === 'string' && envOverride.trim() !== ''
      ? normalizeBaseUrl(envOverride)
      : CDN_URLS[detectEnvironment()]
  }
  return cachedCdnBaseUrl
}

/**
 * Builds a CDN URL for a PUBLIC asset (thumbnail, preview).
 * The r2Key already includes the "public/" prefix as stored in R2.
 *
 * @example cdnPublicUrl('public/thumbs/abc.jpg')
 *          // => 'https://cdn.earnlumens.org/public/thumbs/abc.jpg'
 */
export function cdnPublicUrl (r2Key: string): string {
  const key = r2Key.startsWith('/') ? r2Key.slice(1) : r2Key
  return `${getCdnBaseUrl()}/${key}`
}

/**
 * Builds a CDN URL for a PRIVATE media entry.
 * Auth is handled via refresh-cookie session by the CDN Worker.
 *
 * @example cdnMediaUrl('entry-uuid-123')
 *          // => 'https://cdn.earnlumens.org/media/entry-uuid-123'
 */
export function cdnMediaUrl (entryId: string): string {
  return `${getCdnBaseUrl()}/media/${entryId}`
}

/**
 * Builds the CDN URL for an entry's HLS master playlist (authenticated).
 *
 * @example cdnHlsUrl('665a1b2c3d4e5f6a7b8c9d0e')
 *          // => 'https://cdn.earnlumens.org/media/665a.../hls/master.m3u8'
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
