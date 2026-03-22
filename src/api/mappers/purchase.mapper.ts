/**
 * Mapper for purchased entry DTOs → UI models.
 * Converts R2 keys to full CDN URLs (same logic as entry.mapper).
 */

import type {
  PurchasedCollectionDto,
  PurchasedCollectionModel,
  PurchasedCollectionPageDto,
  PurchasedCollectionPageModel,
  PurchasedEntryDto,
  PurchasedEntryModel,
  PurchasedEntryPageDto,
  PurchasedEntryPageModel,
} from '../types/purchase.types'

import { getCdnBaseUrl } from '@/config/env'

function r2KeyToCdnUrl (r2Key?: string): string | undefined {
  if (!r2Key) return undefined
  return `${getCdnBaseUrl()}/${r2Key}`
}

export function mapPurchasedEntryDtoToModel (dto: PurchasedEntryDto): PurchasedEntryModel {
  return {
    id: dto.id,
    type: dto.type,
    title: dto.title,
    description: dto.description,
    authorName: dto.authorName,
    authorAvatarUrl: dto.authorAvatarUrl,
    publishedAt: dto.publishedAt ?? '',
    thumbnailUrl: r2KeyToCdnUrl(dto.thumbnailR2Key),
    previewUrl: r2KeyToCdnUrl(dto.previewR2Key),
    durationSec: dto.durationSec,
    isPaid: dto.isPaid,
    priceXlm: dto.priceXlm,
    tags: dto.tags ?? [],
    purchasedAt: dto.purchasedAt ?? '',
  }
}

export function mapPurchasedEntryPageDtoToModel (dto: PurchasedEntryPageDto): PurchasedEntryPageModel {
  return {
    items: dto.content.map(mapPurchasedEntryDtoToModel),
    page: dto.page,
    size: dto.size,
    totalElements: dto.totalElements,
    totalPages: dto.totalPages,
  }
}

export function mapPurchasedCollectionDtoToModel (dto: PurchasedCollectionDto): PurchasedCollectionModel {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    collectionType: dto.collectionType,
    coverUrl: r2KeyToCdnUrl(dto.coverR2Key),
    authorName: dto.authorUsername,
    authorAvatarUrl: dto.authorAvatarUrl,
    publishedAt: dto.publishedAt ?? '',
    isPaid: dto.isPaid,
    priceXlm: dto.priceXlm,
    itemCount: dto.itemCount,
    purchasedAt: dto.purchasedAt ?? '',
  }
}

export function mapPurchasedCollectionPageDtoToModel (dto: PurchasedCollectionPageDto): PurchasedCollectionPageModel {
  return {
    items: dto.content.map(mapPurchasedCollectionDtoToModel),
    page: dto.page,
    size: dto.size,
    totalElements: dto.totalElements,
    totalPages: dto.totalPages,
  }
}
