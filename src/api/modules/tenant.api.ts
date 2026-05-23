/**
 * Visitor / tenant context probe.
 *
 * Hits the unauthenticated `/public/tenant/visitor` endpoint to figure out
 * what hostname the user is on:
 *
 *   • `platform` — the platform's default tenant (apex, reserved subdomain).
 *   • `tenant`   — a real, active tenant subdomain.
 *   • `notFound` — a syntactically valid `<sub>.earnlumens.org` with no
 *                  active tenant document. The SPA must render a 404 page
 *                  instead of silently rendering the default tenant.
 *
 * This is the very first network call the SPA makes, so it intentionally
 * avoids the axios pipeline (no auth interceptors, no retry on 404, no
 * global notifications).
 */
import { apiUrl } from '@/config/env'

export type VisitorKind = 'platform' | 'tenant' | 'notFound'

/**
 * Optional per-tenant hero banner block. Only emitted by the server when
 * the owner has flipped the master switch on in admin-ui, so the SPA can
 * treat `banner === undefined` as "do not render". The fields are plain
 * strings today; automatic per-locale translations will land later.
 */
export interface TenantBanner {
  enabled: true
  imageR2Key?: string | null
  eyebrow?: string | null
  headline?: string | null
  subheadline?: string | null
  ctaLabel?: string | null
  ctaUrl?: string | null
  imageAlt?: string | null
}

export interface VisitorContext {
  kind: VisitorKind
  /** Present when `kind === 'tenant'` or `kind === 'notFound'`. */
  subdomain?: string
  /** Optional storefront app-bar label override. Null/undefined means "use the hardcoded default". */
  brandText?: string | null
  /** When true the storefront renders no text label next to the logo (logo-only mode). */
  brandTextHidden?: boolean
  /** Optional R2 object key for the storefront logo. Null/undefined means "use the hardcoded SVG". */
  logoR2Key?: string | null
  /** Optional dark-theme logo R2 key. Falls back to logoR2Key when null. */
  logoR2KeyDark?: string | null
  /** Optional hero banner. Absent when the owner has not enabled it. */
  banner?: TenantBanner | null
  /**
   * Per-tenant default Vuetify theme key for visitors who land in light mode.
   * Null/undefined means "use the platform DEFAULT_LIGHT_THEME baked into
   * vuetify.ts". Always a key whose theme has {@code dark: false}.
   */
  defaultLightTheme?: string | null
  /** Same as {@link defaultLightTheme} but for dark mode. Always a {@code dark: true} key. */
  defaultDarkTheme?: string | null
  /**
   * Per-tenant uploads master switch. The server only emits this field
   * when it has been explicitly disabled — a missing/undefined value
   * means "uploads are on". Used by the storefront to hide upload entry
   * points before the user even attempts to call /api/uploads/init.
   */
  uploadsEnabled?: boolean | null
}

export async function fetchVisitorContext (): Promise<VisitorContext> {
  const response = await fetch(apiUrl('/public/tenant/visitor'), {
    method: 'GET',
    credentials: 'omit',
    headers: { Accept: 'application/json' },
  })

  if (response.status === 404) {
    const body = await response.json().catch(() => null) as { subdomain?: string } | null
    return { kind: 'notFound', subdomain: body?.subdomain }
  }

  if (!response.ok) {
    // Network / 5xx — fall back to platform so the SPA still renders.
    // We do NOT want a transient backend hiccup to brand every tenant as
    // "not found".
    throw new Error(`visitor probe failed: HTTP ${response.status}`)
  }

  const body = await response.json() as {
    kind?: string
    subdomain?: string
    brandText?: string | null
    brandTextHidden?: boolean
    logoR2Key?: string | null
    logoR2KeyDark?: string | null
    banner?: Record<string, unknown> | null
    defaultLightTheme?: string | null
    defaultDarkTheme?: string | null
    uploadsEnabled?: boolean | null
  }
  // When brandTextHidden is true the server intentionally sends an empty
  // string — keep it as-is (don't coerce to null) so the AppBar can render
  // the logo-only layout instead of falling back to the hardcoded brand.
  const brandTextHidden = body.brandTextHidden === true
  const brandText = brandTextHidden
    ? ''
    : (typeof body.brandText === 'string' && body.brandText.length > 0 ? body.brandText : null)
  const logoR2Key = typeof body.logoR2Key === 'string' && body.logoR2Key.length > 0 ? body.logoR2Key : null
  const logoR2KeyDark = typeof body.logoR2KeyDark === 'string' && body.logoR2KeyDark.length > 0 ? body.logoR2KeyDark : null
  const banner = parseBanner(body.banner)
  const defaultLightTheme = typeof body.defaultLightTheme === 'string' && body.defaultLightTheme.length > 0 ? body.defaultLightTheme : null
  const defaultDarkTheme = typeof body.defaultDarkTheme === 'string' && body.defaultDarkTheme.length > 0 ? body.defaultDarkTheme : null
  // Treat any non-false value (including undefined) as "uploads enabled" so
  // the storefront opens up by default; the server only emits this field
  // when the owner has explicitly flipped the kill switch off.
  const uploadsEnabled = body.uploadsEnabled === false ? false : true
  if (body.kind === 'tenant' && typeof body.subdomain === 'string') {
    return { kind: 'tenant', subdomain: body.subdomain, brandText, brandTextHidden, logoR2Key, logoR2KeyDark, banner, defaultLightTheme, defaultDarkTheme, uploadsEnabled }
  }
  return { kind: 'platform', brandText, brandTextHidden, logoR2Key, logoR2KeyDark, banner, defaultLightTheme, defaultDarkTheme, uploadsEnabled }
}

function parseBanner (raw: Record<string, unknown> | null | undefined): TenantBanner | null {
  if (!raw || raw.enabled !== true) {
    return null
  }
  const pickString = (key: string): string | null => {
    const v = raw[key]
    return typeof v === 'string' && v.length > 0 ? v : null
  }
  return {
    enabled: true,
    imageR2Key: pickString('imageR2Key'),
    eyebrow: pickString('eyebrow'),
    headline: pickString('headline'),
    subheadline: pickString('subheadline'),
    ctaLabel: pickString('ctaLabel'),
    ctaUrl: pickString('ctaUrl'),
    imageAlt: pickString('imageAlt'),
  }
}

export interface TenantGuidelineNotes {
  tenantId: string
  /** English-only publishing notes set by the tenant admin. Null when unset. */
  notes: string | null
}

/**
 * Fetches the current tenant's optional publishing notes for the public
 * /guidelines page. Returns `{ notes: null }` (never throws) on any failure
 * so the page can still render the platform-wide rules.
 */
export async function fetchTenantGuidelineNotes (): Promise<TenantGuidelineNotes> {
  try {
    const response = await fetch(apiUrl('/public/guidelines/tenant-notes'), {
      method: 'GET',
      credentials: 'omit',
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) {
      return { tenantId: '', notes: null }
    }
    const body = await response.json() as { tenantId?: string, notes?: string | null }
    return {
      tenantId: typeof body.tenantId === 'string' ? body.tenantId : '',
      notes: typeof body.notes === 'string' && body.notes.length > 0 ? body.notes : null,
    }
  } catch {
    return { tenantId: '', notes: null }
  }
}
