/**
 * Mapper for favorite DTOs → UI models.
 * Converts R2 keys to full CDN URLs.
 */

import type {
  FavoriteItemDto,
  FavoriteItemModel,
  FavoritePageDto,
  FavoritePageModel,
} from '../types/favorite.types'

import { getCdnBaseUrl } from '@/config/env'

function r2KeyToCdnUrl (r2Key?: string): string | undefined {
  if (!r2Key) {
    return undefined
  }
  return `${getCdnBaseUrl()}/${r2Key}`
}

export function mapFavoriteItemDtoToModel (dto: FavoriteItemDto): FavoriteItemModel {
  return {
    id: dto.id,
    itemId: dto.itemId,
    itemType: dto.itemType,
    title: dto.title,
    authorName: dto.authorName,
    authorAvatarUrl: dto.authorAvatarUrl,
    publishedAt: dto.publishedAt ?? '',
    thumbnailUrl: r2KeyToCdnUrl(dto.thumbnailUrl),
    coverUrl: r2KeyToCdnUrl(dto.coverUrl),
    durationSec: dto.durationSec,
    collectionType: dto.collectionType,
    itemsCount: dto.itemsCount,
    locked: dto.locked,
    unlocked: dto.unlocked,
    addedAt: dto.addedAt ?? '',
  }
}

export function mapFavoritePageDtoToModel (dto: FavoritePageDto): FavoritePageModel {
  return {
    items: dto.content.map(item => mapFavoriteItemDtoToModel(item)),
    page: dto.page,
    size: dto.size,
    totalElements: dto.totalElements,
    totalPages: dto.totalPages,
  }
}
