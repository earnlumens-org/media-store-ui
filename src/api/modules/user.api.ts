/**
 * User API module - authenticated user endpoints
 */

import { apiRequest } from '@/api/apiRequest'

export interface UserProfile {
  username: string
  displayName: string
  profileImageUrl: string
  followersCount: number
  oauthProvider?: string
}

/**
 * Decode user profile from JWT access token claims
 * This avoids an extra API call since the token already contains user data
 */
export function parseUserFromToken (accessToken: string): UserProfile | null {
  try {
    const parts = accessToken.split('.')
    if (parts.length < 2 || !parts[1]) {
      return null
    }
    const payload = JSON.parse(atob(parts[1]))

    return {
      username: payload.username ?? '',
      displayName: payload.name ?? '',
      profileImageUrl: payload.profile_image_url ?? '',
      followersCount: payload.followers_count ?? 0,
      oauthProvider: payload.oauth_provider ?? '',
    }
  } catch {
    console.warn('[parseUserFromToken] Failed to decode JWT')
    return null
  }
}

/**
 * Get the current authenticated user's profile
 * Requires valid Bearer token
 */
export async function getCurrentUser (): Promise<UserProfile> {
  return apiRequest<UserProfile>('/api/user/me')
}

/**
 * Get a user by username (public endpoint)
 */
export async function getUserByUsername (username: string): Promise<UserProfile> {
  return apiRequest<UserProfile>(`/api/user/by-username/${encodeURIComponent(username)}`, {
    skipAuth: true,
  })
}

/**
 * Check if a username exists (public endpoint)
 */
export async function checkUsernameExists (username: string): Promise<{ username: string, exists: boolean }> {
  return apiRequest<{ username: string, exists: boolean }>(
    `/api/user/exists/${encodeURIComponent(username)}`,
    { skipAuth: true },
  )
}
