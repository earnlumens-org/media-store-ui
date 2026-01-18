import type {
  CollectionDto,
  CollectionModel,
  EntryDto,
  EntryModel,
  FeedItemDto,
  FeedItemModel,
  FeedPageDto,
  FeedPageModel,
} from '../types/entryMock.types'

import type { ProfileBadge } from '@/lib/profileBadge'

function mapProfileBadge (badge?: string): ProfileBadge | undefined {
  if (badge === 'u1' || badge === 'u2') {
    return badge
  }
  return undefined
}

export function mapEntryDtoToModel (dto: EntryDto): EntryModel {
  return {
    id: dto.id,
    type: dto.type,
    title: dto.title,
    authorName: dto.authorName,
    authorAvatarUrl: dto.authorAvatarUrl,
    profileBadge: mapProfileBadge(dto.profileBadge),
    publishedAt: dto.publishedAt,
    thumbnailUrl: dto.thumbnailUrl,
    durationSec: dto.durationSec,
    locked: dto.locked,
  }
}

export function mapCollectionDtoToModel (dto: CollectionDto): CollectionModel {
  return {
    id: dto.id,
    collectionType: dto.collectionType,
    title: dto.title,
    authorName: dto.authorName,
    authorAvatarUrl: dto.authorAvatarUrl,
    profileBadge: mapProfileBadge(dto.profileBadge),
    publishedAt: dto.publishedAt,
    coverUrl: dto.coverUrl,
    itemsCount: dto.itemsCount,
    totalDurationSec: dto.totalDurationSec,
    locked: dto.locked,
  }
}

export function mapFeedItemDtoToModel (dto: FeedItemDto): FeedItemModel {
  return dto.kind === 'entry'
    ? { kind: 'entry', entry: mapEntryDtoToModel(dto) }
    : { kind: 'collection', collection: mapCollectionDtoToModel(dto) }
}

export function mapFeedPageDtoToModel (dto: FeedPageDto): FeedPageModel {
  return {
    items: dto.content.map(item => mapFeedItemDtoToModel(item)),
    page: dto.page,
    size: dto.size,
    totalElements: dto.totalElements,
    totalPages: dto.totalPages,
  }
}
