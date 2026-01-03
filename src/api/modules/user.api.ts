/**
 * User API module - authenticated user endpoints
 */

import { apiRequest } from '@/api/apiRequest'

export interface UserProfile {
  id: string
  username: string
  displayName: string
  profileImageUrl: string
  followersCount: number
  friendsCount?: number
  description?: string
  location?: string
  verified?: boolean
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
