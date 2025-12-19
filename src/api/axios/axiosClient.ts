import axios, { type AxiosInstance } from 'axios'

import { getApiBaseUrl } from '@/config/env'

import { installAxiosInterceptors } from './interceptors'

let singleton: AxiosInstance | null = null

export function getAxiosClient (): AxiosInstance {
  if (singleton) {
    return singleton
  }

  singleton = axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 15_000,
    withCredentials: false,
    headers: {
      Accept: 'application/json',
    },
  })

  installAxiosInterceptors(singleton)

  return singleton
}

export default getAxiosClient()
