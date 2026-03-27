/**
 * Mapper for unified public feed DTOs → UI models.
 * Converts R2 keys to full CDN URLs.
 */

import type { PublicFeedItemDto, PublicFeedItemModel, PublicFeedPageDto, PublicFeedPageModel } from '../types/feed.types'

import { getCdnBaseUrl } from '@/config/env'

function r2KeyToCdnUrl (r2Key?: string): string | undefined {
  if (!r2Key) {
    return undefined
  }
  const cdnBase = getCdnBaseUrl()
  return `${cdnBase}/${r2Key}`
}

export function mapFeedItemDtoToModel (dto: PublicFeedItemDto): PublicFeedItemModel {
  return {
    id: dto.id,
    kind: dto.kind,
    type: dto.type,
    title: dto.title,
    description: dto.description,
    authorName: dto.authorUsername,
    authorAvatarUrl: dto.authorAvatarUrl,
    publishedAt: dto.publishedAt ?? '',
    thumbnailUrl: r2KeyToCdnUrl(dto.thumbnailR2Key),
    coverUrl: r2KeyToCdnUrl(dto.coverR2Key),
    durationSec: dto.durationSec,
    viewCount: dto.viewCount ?? 0,
    isPaid: dto.isPaid,
    priceXlm: dto.priceXlm,
    priceUsd: dto.priceUsd,
    priceCurrency: dto.priceCurrency,
    itemCount: dto.itemCount ?? 0,
    locked: dto.locked,
    unlocked: dto.unlocked,
  }
}

export function mapFeedPageDtoToModel (dto: PublicFeedPageDto): PublicFeedPageModel {
  return {
    items: dto.content.map(item => mapFeedItemDtoToModel(item)),
    page: dto.page,
    size: dto.size,
    totalElements: dto.totalElements,
    totalPages: dto.totalPages,
  }
}
