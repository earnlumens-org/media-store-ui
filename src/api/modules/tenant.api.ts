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

export interface VisitorContext {
  kind: VisitorKind
  /** Present when `kind === 'tenant'` or `kind === 'notFound'`. */
  subdomain?: string
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

  const body = await response.json() as { kind?: string, subdomain?: string }
  if (body.kind === 'tenant' && typeof body.subdomain === 'string') {
    return { kind: 'tenant', subdomain: body.subdomain }
  }
  return { kind: 'platform' }
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
