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

  import { createSession } from '@/api/modules/auth.api'
  import { initTokenWorker, setToken } from '@/services/tokenWorkerClient'
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

  async function redirectToPreLoginUrl (): Promise<void> {
    const preLoginUrl = getAndClearPreLoginUrl()
    await router.replace(preLoginUrl ?? '/')
  }

  function isValidUuid (value: string): boolean {
    return UUID_REGEX.test(value)
  }

  async function handleUuidCallback (uuid: string): Promise<void> {
    try {
      // Initialize worker if not ready
      await initTokenWorker()

      // Exchange UUID for tokens
      const { accessToken } = await createSession(uuid)

      // Send token to worker (never stored in main thread)
      await setToken(accessToken)

      // Mark as logged in
      appStore.setLoggedIn(true)
    } catch (error) {
      console.error('Session creation failed:', error)
      appStore.setLoginError(error instanceof Error ? error.message : 'login_failed')
    }

    await redirectToPreLoginUrl()
  }

  async function handleCallbackOnce (): Promise<void> {
    appStore.setIsAppLocked(true)

    const watchdog = window.setTimeout(() => {
      appStore.setLoginError('timeout')
      appStore.setIsAppLocked(false)

      const preLoginUrl = getAndClearPreLoginUrl()
      window.location.assign(preLoginUrl ?? '/')
    }, 20_000)

    try {
      const error = getQueryParamFromSearch('error')
      if (error) {
        appStore.setLoginError(error)
        await redirectToPreLoginUrl()
        return
      }

      const uuid = getQueryParamFromSearch('UUID')
      if (uuid) {
        if (!isValidUuid(uuid)) {
          await redirectToPreLoginUrl()
          return
        }

        await handleUuidCallback(uuid)
        return
      }

      await redirectToPreLoginUrl()
    } finally {
      window.clearTimeout(watchdog)
      appStore.setIsAppLocked(false)
    }
  }

  void handleCallbackOnce()
</script>

<route lang="yaml">
path: /oauth2/callback
name: AuthXCallback
</route>
