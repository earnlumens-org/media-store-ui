/**
 * Mapper for public entry DTOs → UI models.
 * Converts R2 keys to full CDN URLs.
 */

import type { PublicEntryDto, PublicEntryModel, PublicEntryPageDto, PublicEntryPageModel } from '../types/entry.types'

import { getCdnBaseUrl } from '@/config/env'

function r2KeyToCdnUrl (r2Key?: string): string | undefined {
  if (!r2Key) {
    return undefined
  }
  const cdnBase = getCdnBaseUrl()
  return `${cdnBase}/${r2Key}`
}

export function mapPublicEntryDtoToModel (dto: PublicEntryDto): PublicEntryModel {
  return {
    id: dto.id,
    type: dto.type,
    title: dto.title,
    description: dto.description,
    resourceContent: dto.resourceContent,
    authorId: dto.authorId,
    authorName: dto.authorName,
    authorAvatarUrl: dto.authorAvatarUrl,
    publishedAt: dto.publishedAt ?? '',
    thumbnailUrl: r2KeyToCdnUrl(dto.thumbnailR2Key),
    previewUrl: r2KeyToCdnUrl(dto.previewR2Key),
    durationSec: dto.durationSec,
    viewCount: dto.viewCount ?? 0,
    isPaid: dto.isPaid,
    priceXlm: dto.priceXlm,
    priceUsd: dto.priceUsd,
    priceCurrency: dto.priceCurrency,
    contentLanguage: dto.contentLanguage,
    tags: dto.tags ?? [],
    asset: dto.asset,
    hlsReady: dto.hlsReady ?? false,
  }
}

export function mapPublicEntryPageDtoToModel (dto: PublicEntryPageDto): PublicEntryPageModel {
  return {
    items: dto.content.map(item => mapPublicEntryDtoToModel(item)),
    page: dto.page,
    size: dto.size,
    totalElements: dto.totalElements,
    totalPages: dto.totalPages,
  }
}
