export interface WaitlistStatsDto {
  stats: Record<string, number>
}

export interface MessageResponseDto {
  message: string
}

export interface WaitlistSubscribeRequestDto {
  email: string
  feedback?: string
  captchaResponse: string
}

export interface WaitlistStatsModel {
  labels: string[]
  values: number[]
  total: number
  byDate: Record<string, number>
}

export interface MessageResponseModel {
  message: string
}
