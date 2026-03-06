/**
 * Mapper for subscription DTOs → UI models.
 */

import type { SubscriptionPageDto, SubscriptionPageModel, SubscriptionUserDto, SubscriptionUserModel } from '../types/subscription.types'

export function mapSubscriptionUserDtoToModel (dto: SubscriptionUserDto): SubscriptionUserModel {
  return {
    userId: dto.userId,
    username: dto.username,
    displayName: dto.displayName,
    avatarUrl: dto.avatarUrl,
    subscribedAt: dto.subscribedAt ?? '',
  }
}

export function mapSubscriptionPageDtoToModel (dto: SubscriptionPageDto): SubscriptionPageModel {
  return {
    items: dto.items.map(item => mapSubscriptionUserDtoToModel(item)),
    page: dto.page,
    size: dto.size,
    totalElements: dto.totalElements,
    totalPages: dto.totalPages,
  }
}
