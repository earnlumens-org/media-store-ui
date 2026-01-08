import { createSession, logout, refreshAccessToken } from './modules/auth.api'
import { checkUsernameExists, getCurrentUser, getUserByUsername } from './modules/user.api'
import { getWaitlistStats, subscribeWaitlist } from './modules/waitlist.api'

export const api = {
  auth: {
    createSession,
    refresh: refreshAccessToken,
    logout,
  },
  user: {
    me: getCurrentUser,
    getByUsername: getUserByUsername,
    checkExists: checkUsernameExists,
  },
  waitlist: {
    getStats: getWaitlistStats,
    subscribe: subscribeWaitlist,
  },
} as const

export { ApiError, apiRequest } from './apiRequest'
export { createSession, logout, refreshAccessToken } from './modules/auth.api'
export { checkUsernameExists, getCurrentUser, getUserByUsername, parseUserFromToken } from './modules/user.api'
export { getWaitlistStats } from './modules/waitlist.api'

export type {
  MessageResponseDto,
  MessageResponseModel,
  WaitlistStatsDto,
  WaitlistStatsModel,
  WaitlistSubscribeRequestDto,
} from './types/waitlist.types'
