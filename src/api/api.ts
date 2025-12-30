import { createSession, logout, refreshAccessToken } from './modules/auth.api'
import { getWaitlistStats, subscribeWaitlist } from './modules/waitlist.api'

export const api = {
  auth: {
    createSession,
    refresh: refreshAccessToken,
    logout,
  },
  waitlist: {
    getStats: getWaitlistStats,
    subscribe: subscribeWaitlist,
  },
} as const

export { createSession, logout, refreshAccessToken } from './modules/auth.api'
export { getWaitlistStats } from './modules/waitlist.api'

export type {
  MessageResponseDto,
  MessageResponseModel,
  WaitlistStatsDto,
  WaitlistStatsModel,
  WaitlistSubscribeRequestDto,
} from './types/waitlist.types'
