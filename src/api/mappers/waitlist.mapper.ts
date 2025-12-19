import type { MessageResponseDto, MessageResponseModel, WaitlistStatsDto, WaitlistStatsModel } from '../types/waitlist.types'

export function mapWaitlistStatsDtoToModel (dto: WaitlistStatsDto): WaitlistStatsModel {
  const byDate: Record<string, number> = dto?.stats && typeof dto.stats === 'object' ? dto.stats : {}

  const labels = Object.keys(byDate).toSorted() // ISO date strings sort lexicographically
  const values = labels.map(d => Number(byDate[d] ?? 0))
  const total = values.at(-1) ?? 0

  return {
    labels,
    values,
    total,
    byDate,
  }
}

export function mapMessageResponseDtoToModel (dto: MessageResponseDto): MessageResponseModel {
  return {
    message: typeof dto?.message === 'string' ? dto.message : '',
  }
}
