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
    authorName: dto.authorName,
    authorAvatarUrl: dto.authorAvatarUrl,
    publishedAt: dto.publishedAt ?? '',
    thumbnailUrl: r2KeyToCdnUrl(dto.thumbnailR2Key),
    previewUrl: r2KeyToCdnUrl(dto.previewR2Key),
    durationSec: dto.durationSec,
    isPaid: dto.isPaid,
    priceXlm: dto.priceXlm,
    tags: dto.tags ?? [],
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
