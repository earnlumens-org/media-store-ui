/**
 * Unified Download action for an entry's full media, served through the
 * authenticated CDN path (/cdn/media/:entryId).
 *
 * Every view with a Download button (image view, read attachments, …) shares
 * this composable so permission handling and download mechanics are identical.
 *
 * Permissions are enforced server-side by media-store-api
 * (/api/media/entitlements/:entryId, called by the cdn-worker):
 *   - free entries    → anyone, including anonymous visitors
 *   - paid entries    → the author (owner always has access) or a buyer with
 *                       an ACTIVE entitlement backed by a COMPLETED order
 *                       (direct purchase or bundled collection purchase)
 *
 * Mechanics:
 *   1. HEAD probe with credentials — verifies the entitlement without
 *      buffering the file and yields the server's Content-Disposition
 *      filename (the cdn-worker exposes it via CORS).
 *   2. 401/403 → 'forbidden': the caller clears the stale local unlock and
 *      routes to the paywall preview (same recovery as page load).
 *   3. Same-origin CDN (prod / tunnel serve /cdn on the tenant origin):
 *      stream straight to disk via an <a download> anchor — no memory
 *      ceiling for large files, cookie sent automatically.
 *   4. Cross-origin CDN (local dev): fetch → blob → object-URL anchor,
 *      because the download attribute is ignored on cross-origin URLs.
 */

import { ref } from 'vue'

import { cdnMediaUrl } from '@/config/env'

export type EntryDownloadResult = 'ok' | 'forbidden' | 'unavailable' | 'error'

export interface EntryDownloadTarget {
  /** Entry id (Mongo ObjectId). */
  id: string
  /** Entry title — fallback for the download filename. */
  title?: string | null
  /** Preferred filename (e.g. the attachment's original fileName). */
  fileName?: string | null
}

/** Extension fallback when the server provides no usable filename. */
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'image/avif': '.avif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
  'audio/mpeg': '.mp3',
  'audio/mp4': '.m4a',
  'audio/aac': '.aac',
  'audio/ogg': '.ogg',
  'audio/wav': '.wav',
  'audio/flac': '.flac',
  'application/pdf': '.pdf',
  'application/zip': '.zip',
  'application/epub+zip': '.epub',
  'text/plain': '.txt',
  'text/csv': '.csv',
}

/** Extracts the filename from a Content-Disposition header (RFC 6266). */
function filenameFromContentDisposition (header: string | null): string | undefined {
  if (!header) {
    return undefined
  }
  // RFC 5987 extended form takes precedence: filename*=UTF-8''...
  const extended = header.match(/filename\*\s*=\s*(?:UTF-8|utf-8)''([^;]+)/)
  if (extended?.[1]) {
    try {
      return decodeURIComponent(extended[1].trim())
    } catch {
      // fall through to the plain form
    }
  }
  const plain = header.match(/filename\s*=\s*"((?:[^"\\]|\\.)*)"|filename\s*=\s*([^;]+)/)
  const raw = plain?.[1] ?? plain?.[2]
  return raw ? raw.replaceAll(String.raw`\"`, '"').trim() : undefined
}

/** Builds a safe filename from the entry title + MIME-derived extension. */
function fallbackFilename (target: EntryDownloadTarget, contentType: string | null): string {
  const safeTitle = (target.title || 'download')
    .replaceAll(/[^\w\-\s]/g, '')
    .trim()
    .replaceAll(/\s+/g, '_')
    .slice(0, 80) || 'download'
  const baseType = (contentType ?? '').split(';')[0]?.trim().toLowerCase() ?? ''
  return `${safeTitle}${MIME_TO_EXT[baseType] ?? ''}`
}

/** Triggers a browser download for the given href via an invisible anchor. */
function clickAnchor (href: string, filename: string): void {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.rel = 'noopener'
  document.body.append(a)
  a.click()
  a.remove()
}

export function useEntryDownload () {
  const downloading = ref(false)

  /**
   * Downloads the entry's full media file.
   *
   * @returns 'ok'          — download triggered
   *          'forbidden'   — 401/403 (entitlement lost / session expired);
   *                          caller should clear the local unlock and route
   *                          to the paywall preview
   *          'unavailable' — entitled but there is no file to download
   *                          (e.g. text-only RESOURCE entry)
   *          'error'       — network or unexpected server error
   */
  async function downloadEntry (target: EntryDownloadTarget): Promise<EntryDownloadResult> {
    if (downloading.value) {
      return 'error'
    }
    downloading.value = true
    try {
      const url = cdnMediaUrl(target.id)

      // 1. Entitlement probe (no body). Owner / free / purchased all resolve
      //    server-side; anything else surfaces as 401/403 here.
      const probe = await fetch(url, { method: 'HEAD', credentials: 'include' })
      if (probe.status === 401 || probe.status === 403) {
        return 'forbidden'
      }
      if (!probe.ok) {
        return 'error'
      }
      // Text-only RESOURCE entries answer 200 with no file behind them.
      if (!probe.headers.get('Content-Length')) {
        return 'unavailable'
      }

      const filename
        = filenameFromContentDisposition(probe.headers.get('Content-Disposition'))
          ?? target.fileName
          ?? fallbackFilename(target, probe.headers.get('Content-Type'))

      // 2. Same-origin (prod/tunnel): let the browser stream to disk.
      const sameOrigin = new URL(url, window.location.href).origin === window.location.origin
      if (sameOrigin) {
        clickAnchor(url, filename)
        return 'ok'
      }

      // 3. Cross-origin (local dev): the download attribute is ignored, so
      //    buffer to a blob and download the object URL instead.
      const resp = await fetch(url, { credentials: 'include' })
      if (resp.status === 401 || resp.status === 403) {
        return 'forbidden'
      }
      if (!resp.ok) {
        return 'error'
      }
      const blob = await resp.blob()
      const objectUrl = URL.createObjectURL(blob)
      try {
        clickAnchor(objectUrl, filename)
      } finally {
        URL.revokeObjectURL(objectUrl)
      }
      return 'ok'
    } catch (error) {
      console.error('[useEntryDownload] Download failed:', error)
      return 'error'
    } finally {
      downloading.value = false
    }
  }

  return { downloading, downloadEntry }
}
