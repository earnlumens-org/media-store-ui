/**
 * Types for the subscriptions API endpoints.
 * Mirrors the backend SubscriptionService DTOs.
 */

// ── Response DTOs (from server) ───────────────────────────

export interface SubscribeResponse {
  subscribed: boolean
  created?: boolean
}

export interface UnsubscribeResponse {
  subscribed: boolean
}

export interface CheckSubscriptionResponse {
  subscribed: boolean
}

export interface SubscriberCountResponse {
  count: number
  username?: string
}

export interface SubscriptionUserDto {
  userId: string
  username: string
  displayName: string
  avatarUrl: string
  subscribedAt: string | null
}

export interface SubscriptionPageDto {
  items: SubscriptionUserDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

// ── Models (for UI) ───────────────────────────────────────

export interface SubscriptionUserModel {
  userId: string
  username: string
  displayName: string
  avatarUrl: string
  subscribedAt: string
}

export interface SubscriptionPageModel {
  items: SubscriptionUserModel[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}
