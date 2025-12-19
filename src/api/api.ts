import { getWaitlistStats, subscribeWaitlist } from './modules/waitlist.api'

export const api = {
  waitlist: {
    getStats: getWaitlistStats,
    subscribe: subscribeWaitlist,
  },
} as const

export { getWaitlistStats } from './modules/waitlist.api'

export type {
  MessageResponseDto,
  MessageResponseModel,
  WaitlistStatsDto,
  WaitlistStatsModel,
  WaitlistSubscribeRequestDto,
} from './types/waitlist.types'
