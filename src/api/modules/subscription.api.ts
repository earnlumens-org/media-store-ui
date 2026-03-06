/**
 * API module for user subscriptions.
 *
 * Endpoints:
 *   POST   /api/subscriptions/{targetUserId}         — subscribe
 *   DELETE /api/subscriptions/{targetUserId}          — unsubscribe
 *   GET    /api/subscriptions/check/{targetUserId}    — check if subscribed
 *   GET    /api/subscriptions/mine                    — my subscriptions (paginated)
 *   GET    /api/subscriptions/subscribers             — my subscribers (paginated, private)
 *   GET    /api/subscriptions/subscribers/count       — my subscriber count
 *   GET    /public/subscriptions/count/{username}     — public subscriber count
 *
 * Authenticated endpoints use apiRequest (Bearer token via worker).
 * Public endpoint uses skipAuth.
 */

import type {
  CheckSubscriptionResponse,
  SubscriberCountResponse,
  SubscribeResponse,
  SubscriptionPageDto,
  SubscriptionPageModel,
  UnsubscribeResponse,
} from '../types/subscription.types'

import { apiRequest } from '../apiRequest'
import { mapSubscriptionPageDtoToModel } from '../mappers/subscription.mapper'

const BASE_PATH = '/api/subscriptions'

/**
 * Subscribe the current user to a target user.
 * Idempotent: returns { subscribed: true, created: true|false }.
 */
export async function subscribe (targetUserId: string): Promise<SubscribeResponse> {
  return apiRequest<SubscribeResponse>(`${BASE_PATH}/${targetUserId}`, {
    method: 'POST',
  })
}

/**
 * Unsubscribe the current user from a target user.
 * Idempotent: returns { subscribed: false }.
 */
export async function unsubscribe (targetUserId: string): Promise<UnsubscribeResponse> {
  return apiRequest<UnsubscribeResponse>(`${BASE_PATH}/${targetUserId}`, {
    method: 'DELETE',
  })
}

/**
 * Check if the current user is subscribed to a target user.
 */
export async function checkSubscription (targetUserId: string): Promise<boolean> {
  const response = await apiRequest<CheckSubscriptionResponse>(`${BASE_PATH}/check/${targetUserId}`)
  return response.subscribed
}

/**
 * Fetch a paginated list of the current user's subscriptions (who I follow).
 */
export async function getMySubscriptions (
  params: { page?: number, size?: number } = {},
): Promise<SubscriptionPageModel> {
  const query = new URLSearchParams()
  if (params.page != null) {
    query.set('page', String(params.page))
  }
  if (params.size != null) {
    query.set('size', String(params.size))
  }

  const qs = query.toString()
  const url = qs ? `${BASE_PATH}/mine?${qs}` : `${BASE_PATH}/mine`

  const dto = await apiRequest<SubscriptionPageDto>(url)
  return mapSubscriptionPageDtoToModel(dto)
}

/**
 * Fetch a paginated list of the current user's subscribers (who follows me — private).
 */
export async function getMySubscribers (
  params: { page?: number, size?: number } = {},
): Promise<SubscriptionPageModel> {
  const query = new URLSearchParams()
  if (params.page != null) {
    query.set('page', String(params.page))
  }
  if (params.size != null) {
    query.set('size', String(params.size))
  }

  const qs = query.toString()
  const url = qs ? `${BASE_PATH}/subscribers?${qs}` : `${BASE_PATH}/subscribers`

  const dto = await apiRequest<SubscriptionPageDto>(url)
  return mapSubscriptionPageDtoToModel(dto)
}

/**
 * Get the current user's subscriber count (private).
 */
export async function getMySubscriberCount (): Promise<number> {
  const response = await apiRequest<SubscriberCountResponse>(`${BASE_PATH}/subscribers/count`)
  return response.count
}

/**
 * Get the public subscriber count for a user by username.
 */
export async function getPublicSubscriberCount (username: string): Promise<number> {
  const response = await apiRequest<SubscriberCountResponse>(
    `/public/subscriptions/count/${encodeURIComponent(username)}`,
    { skipAuth: true },
  )
  return response.count
}
