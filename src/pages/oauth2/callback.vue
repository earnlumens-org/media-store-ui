<template>
  <v-overlay
    class="d-flex align-center justify-center"
    :model-value="loading"
    opacity="0.9"
    persistent
    scrim="black"
  >
    <v-progress-circular color="white" indeterminate size="64" />
  </v-overlay>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router'

  import { useAppStore } from '@/stores/app'

  const loading = true

  const router = useRouter()

  const appStore = useAppStore()

  const UUID_REGEX
    = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  const queryParams = new URLSearchParams(window.location.search)

  function getQueryParamFromSearch (name: string): string | null {
    const value = queryParams.get(name)
    return value && value.trim().length > 0 ? value : null
  }

  function getAndClearPreLoginUrl (): string | null {
    const preLoginUrl = localStorage.getItem('preLoginUrl')
    localStorage.removeItem('preLoginUrl')
    if (!preLoginUrl) return null
    return preLoginUrl.startsWith('/') ? preLoginUrl : null
  }

  function redirectToPreLoginUrl (): void {
    const preLoginUrl = getAndClearPreLoginUrl()
    router.replace(preLoginUrl ?? '/')
  }

  function isValidUuid (value: string): boolean {
    return UUID_REGEX.test(value)
  }

  async function handleUuidCallback (_uuid: string): Promise<void> {
    // agregar temporizador de 5 segundos para simular carga
    await new Promise(resolve => setTimeout(resolve, 5000))
    redirectToPreLoginUrl()
  }

  async function handleCallbackOnce (): Promise<void> {
    const error = getQueryParamFromSearch('error')
    if (error) {
      console.log('Login fallido:', error)
      appStore.setLoginError(error)
      redirectToPreLoginUrl()
      return
    }

    const uuid = getQueryParamFromSearch('UUID')
    if (uuid) {
      if (!isValidUuid(uuid)) {
        console.log('UUID inválido recibido en el callback:', uuid)
        redirectToPreLoginUrl()
        return
      }

      console.log('UUID recibido:', uuid)
      await handleUuidCallback(uuid)
      return
    }

    console.log('Callback recibido sin UUID ni error.')
    redirectToPreLoginUrl()
  }

  void handleCallbackOnce()
</script>

<route lang="yaml">
path: /oauth2/callback
name: AuthXCallback
</route>
