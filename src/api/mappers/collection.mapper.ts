/**
 * Mapper for collection DTOs → UI models.
 * Converts R2 keys to full CDN URLs.
 */

import type {
  CollectionDetailDto,
  CollectionDetailModel,
  CollectionDto,
  CollectionEntryItemDto,
  CollectionEntryItemModel,
  CollectionItemModel,
  CollectionPageDto,
  CollectionPageModel,
} from '../types/collection.types'

import { getCdnBaseUrl } from '@/config/env'

function r2KeyToCdnUrl (r2Key?: string): string | undefined {
  if (!r2Key) {
    return undefined
  }
  return `${getCdnBaseUrl()}/${r2Key}`
}

export function mapCollectionDtoToModel (dto: CollectionDto): CollectionItemModel {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    collectionType: dto.collectionType,
    coverUrl: r2KeyToCdnUrl(dto.coverR2Key),
    status: dto.status,
    visibility: dto.visibility,
    authorName: dto.authorUsername,
    authorAvatarUrl: dto.authorAvatarUrl,
    publishedAt: dto.publishedAt ?? '',
    isPaid: dto.isPaid,
    priceXlm: dto.priceXlm,
    priceUsd: dto.priceUsd,
    priceCurrency: dto.priceCurrency,
    itemCount: dto.itemCount,
    locked: dto.locked,
    unlocked: dto.unlocked,
    contentLanguage: dto.contentLanguage,
  }
}

export function mapCollectionPageDtoToModel (dto: CollectionPageDto): CollectionPageModel {
  return {
    items: dto.content.map(item => mapCollectionDtoToModel(item)),
    page: dto.page,
    size: dto.size,
    totalElements: dto.totalElements,
    totalPages: dto.totalPages,
  }
}

export function mapCollectionEntryItemDtoToModel (dto: CollectionEntryItemDto): CollectionEntryItemModel {
  return {
    entryId: dto.entryId,
    position: dto.position,
    type: dto.type,
    title: dto.title,
    description: dto.description,
    authorName: dto.authorUsername,
    thumbnailUrl: r2KeyToCdnUrl(dto.thumbnailR2Key),
    durationSec: dto.durationSec,
    isPaid: dto.isPaid,
    priceXlm: dto.priceXlm,
    locked: dto.locked,
    unlocked: dto.unlocked,
  }
}

export function mapCollectionDetailDtoToModel (dto: CollectionDetailDto): CollectionDetailModel {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    collectionType: dto.collectionType,
    coverUrl: r2KeyToCdnUrl(dto.coverR2Key),
    status: dto.status,
    visibility: dto.visibility,
    authorName: dto.authorUsername,
    authorAvatarUrl: dto.authorAvatarUrl,
    publishedAt: dto.publishedAt ?? '',
    isPaid: dto.isPaid,
    priceXlm: dto.priceXlm,
    priceUsd: dto.priceUsd,
    priceCurrency: dto.priceCurrency,
    itemCount: dto.itemCount,
    locked: dto.locked,
    unlocked: dto.unlocked,
    isOwner: dto.isOwner,
    contentLanguage: dto.contentLanguage,
    items: dto.items.map(item => mapCollectionEntryItemDtoToModel(item)),
  }
}
