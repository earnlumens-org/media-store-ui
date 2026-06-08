/**
 * Mapper for public search DTOs → UI models.
 * Content pages reuse the feed mapper (R2 → CDN URL conversion lives there).
 */

import type {
  SearchChannelDto,
  SearchChannelModel,
  SearchResultsDto,
  SearchResultsModel,
} from '../types/search.types'
import type { ProfileBadge } from '@/lib/profileBadge'

import { mapFeedPageDtoToModel } from './feed.mapper'

function mapProfileBadge (badge?: string): ProfileBadge | undefined {
  if (badge === 'u1' || badge === 'u2') {
    return badge
  }
  return undefined
}

function mapChannelDtoToModel (dto: SearchChannelDto): SearchChannelModel {
  return {
    username: dto.username,
    // Denormalized author avatars are stored as ready-to-use URLs (same as
    // the feed item author avatars), so they are passed through unchanged.
    avatarUrl: dto.avatarUrl,
    profileBadge: mapProfileBadge(dto.badge),
    contentCount: dto.contentCount,
  }
}

export function mapSearchResultsDtoToModel (dto: SearchResultsDto): SearchResultsModel {
  return {
    channels: (dto.channels ?? []).map(channel => mapChannelDtoToModel(channel)),
    content: mapFeedPageDtoToModel(dto.content),
    requiresLogin: Boolean(dto.requiresLogin),
  }
}
