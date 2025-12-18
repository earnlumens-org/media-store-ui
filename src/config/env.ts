function normalizeBaseUrl (value: string): string {
  const trimmed = value.trim()
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed
}

export function getApiBaseUrl (): string {
  const raw = import.meta.env.VITE_API_BASE_URL
  if (typeof raw !== 'string' || raw.trim() === '') {
    throw new Error('Missing VITE_API_BASE_URL (set it in .env or hosting env vars)')
  }

  return normalizeBaseUrl(raw)
}

export function apiUrl (path: string): string {
  const baseUrl = getApiBaseUrl()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return new URL(normalizedPath, baseUrl).toString()
}
