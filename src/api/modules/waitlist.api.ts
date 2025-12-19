import type {
  MessageResponseDto,
  MessageResponseModel,
  WaitlistStatsDto,
  WaitlistStatsModel,
  WaitlistSubscribeRequestDto,
} from '../types/waitlist.types'
import axiosClient from '../axios/axiosClient'
import { mapMessageResponseDtoToModel, mapWaitlistStatsDtoToModel } from '../mappers/waitlist.mapper'

export async function getWaitlistStats (): Promise<WaitlistStatsModel> {
  const response = await axiosClient.get<WaitlistStatsDto>('/api/waitlist/stats')
  return mapWaitlistStatsDtoToModel(response.data)
}

export async function subscribeWaitlist (payload: WaitlistSubscribeRequestDto): Promise<MessageResponseModel> {
  const response = await axiosClient.post<MessageResponseDto>('/api/waitlist/subscribe', payload)
  return mapMessageResponseDtoToModel(response.data)
}
