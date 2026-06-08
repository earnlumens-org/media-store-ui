/**
 * API module for the public search endpoints
 * (mounted under /public/search in media-store-api).
 *
 * The viewer's access token is forwarded when available so authenticated
 * users bypass the anonymous search budget (the backend only meters
 * anonymous traffic). The SEARCH rate-limit tier still applies to everyone.
 */

import type {
  SearchRequestParams,
  SearchResultsDto,
  SearchResultsModel,
  SearchSuggestionsDto,
} from '../types/search.types'

import { getToken } from '@/services/tokenWorkerClient'

import axiosClient from '../axios/axiosClient'
import { mapSearchResultsDtoToModel } from '../mappers/search.mapper'

const BASE_PATH = '/public/search'

async function authHeaders (): Promise<Record<string, string>> {
  const headers: Record<string, string> = {}
  try {
    const result = await getToken()
    if (result?.accessToken) {
      headers['Authorization'] = `Bearer ${result.accessToken}`
    }
  } catch {
    // continue without token — anonymous viewer
  }
  return headers
}

/**
 * Unified search: channels (first page only) + paginated content.
 * Returns {@code requiresLogin: true} when an anonymous visitor has run
 * out of free searches.
 */
export async function search (params: SearchRequestParams, signal?: AbortSignal): Promise<SearchResultsModel> {
  const headers = await authHeaders()
  const response = await axiosClient.get<SearchResultsDto>(BASE_PATH, { params, headers, signal })
  return mapSearchResultsDtoToModel(response.data)
}

/**
 * Lightweight autocomplete completions for the search box.
 */
export async function getSuggestions (q: string, signal?: AbortSignal): Promise<string[]> {
  const response = await axiosClient.get<SearchSuggestionsDto>(`${BASE_PATH}/suggestions`, {
    params: { q },
    signal,
  })
  return response.data?.suggestions ?? []
}
