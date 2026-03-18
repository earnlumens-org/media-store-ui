import { cdnMediaUrl } from '@/config/env'

/**
 * Server-side entitlement verification for paid content.
 *
 * Sends a HEAD request to the authenticated CDN path.
 * Returns true if the user has a valid entitlement, false otherwise.
 * This is the defence-in-depth check that catches tampered localStorage.
 */
export async function verifyEntitlement (entryId: string): Promise<boolean> {
  try {
    const resp = await fetch(cdnMediaUrl(entryId), {
      method: 'HEAD',
      credentials: 'include',
    })
    return resp.ok
  } catch {
    return false
  }
}
