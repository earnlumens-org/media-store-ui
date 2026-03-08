<template>
  <v-container class="py-8">
    <v-row justify="center">
      <v-col cols="12" lg="6" md="8">
        <v-card>
          <v-card-title class="d-flex align-center text-h5">
            <v-icon start>mdi-account</v-icon>
            {{ $t('Account.account') }}
            <v-spacer />
            <v-menu location="bottom end">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  :aria-label="$t('Common.moreOptions')"
                  icon="mdi-dots-vertical"
                  size="small"
                  variant="text"
                />
              </template>
              <v-list density="compact" min-width="200">
                <v-list-item
                  v-if="user?.username"
                  :href="`https://x.com/${user.username}`"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <template #prepend>
                    <v-icon size="small">mdi-open-in-new</v-icon>
                  </template>
                  <v-list-item-title>{{ $t('Account.viewOnX') }}</v-list-item-title>
                </v-list-item>
                <v-list-item @click="copyProfileLink">
                  <template #prepend>
                    <v-icon size="small">mdi-link-variant</v-icon>
                  </template>
                  <v-list-item-title>{{ $t('Account.copyProfileLink') }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-card-title>

          <v-card-text>
            <!-- Loading state -->
            <div v-if="loading" class="text-center py-8">
              <v-progress-circular color="primary" indeterminate size="48" />
              <p class="mt-4 text-medium-emphasis">Loading user data...</p>
            </div>

            <!-- Error state -->
            <v-alert v-else-if="error" class="mb-4" type="error" variant="tonal">
              <strong>Error:</strong> {{ error }}
              <template #append>
                <v-btn size="small" variant="text" @click="fetchUser">
                  Retry
                </v-btn>
              </template>
            </v-alert>

            <!-- User data -->
            <div v-else-if="user">
              <div class="d-flex align-center mb-6">
                <v-avatar class="mr-4" size="80">
                  <v-img :alt="user.displayName" :src="user.profileImageUrl" />
                </v-avatar>
                <div>
                  <h2 class="text-h6">{{ user.displayName }}</h2>
                  <p class="text-medium-emphasis">@{{ user.username }}</p>
                </div>
              </div>

              <div class="d-flex align-center mb-4">
                <v-list class="flex-grow-1 pa-0" density="compact">
                  <v-list-item>
                    <template #prepend>
                      <v-icon>mdi-account-group</v-icon>
                    </template>
                    <v-list-item-title>{{ $t('Account.followers') }}</v-list-item-title>
                    <v-list-item-subtitle>{{ user.followersCount?.toLocaleString() ?? 'N/A' }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
                <v-btn class="text-uppercase" color="error" variant="text" @click="handleLogout">
                  <v-icon start>mdi-logout</v-icon>
                  {{ $t('Common.logout') }}
                </v-btn>
              </div>

              <p class="text-caption text-medium-emphasis mt-2 mb-4 text-center">
                {{ $t('Account.syncHint') }}
              </p>

              <v-divider class="mb-4" />

              <!-- ── Quick Actions ─────────────────────────── -->
              <div class="mb-4">
                <v-list class="pa-0" density="compact" nav>
                  <v-list-item
                    prepend-icon="mdi-movie-open-star-outline"
                    :to="'/creator-studio'"
                  >
                    <v-list-item-title class="font-weight-medium">
                      {{ $t('Account.creatorStudio') }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      {{ $t('Account.creatorStudioHint') }}
                    </v-list-item-subtitle>
                    <template #append>
                      <v-icon size="small">mdi-chevron-right</v-icon>
                    </template>
                  </v-list-item>

                  <v-divider class="my-2" />

                  <v-list-item
                    v-if="user?.username"
                    prepend-icon="mdi-account-eye-outline"
                    :to="'/' + user.username"
                  >
                    <v-list-item-title class="font-weight-medium">
                      {{ $t('Account.viewPublicProfile') }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      {{ $t('Account.viewPublicProfileHint') }}
                    </v-list-item-subtitle>
                    <template #append>
                      <v-icon size="small">mdi-chevron-right</v-icon>
                    </template>
                  </v-list-item>

                  <v-divider class="my-2" />

                  <v-list-item
                    prepend-icon="mdi-file-document-outline"
                    to="/terms"
                  >
                    <v-list-item-title class="font-weight-medium">
                      {{ $t('Account.termsAndConditions') }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      {{ $t('Account.termsAndConditionsHint') }}
                    </v-list-item-subtitle>
                    <template #append>
                      <v-icon size="small">mdi-chevron-right</v-icon>
                    </template>
                  </v-list-item>

                  <v-divider class="my-2" />

                  <v-list-item
                    prepend-icon="mdi-book-open-page-variant-outline"
                    to="/guidelines"
                  >
                    <v-list-item-title class="font-weight-medium">
                      {{ $t('Account.contentGuidelines') }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      {{ $t('Account.contentGuidelinesHint') }}
                    </v-list-item-subtitle>
                    <template #append>
                      <v-icon size="small">mdi-chevron-right</v-icon>
                    </template>
                  </v-list-item>
                </v-list>
              </div>
            </div>

            <!-- No user -->
            <div v-else class="text-center py-8 text-medium-emphasis">
              No user data loaded
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar" color="success" :timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
  import type { UserProfile } from '@/api/modules/user.api'
  import { onMounted, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'
  import { api, ApiError } from '@/api/api'
  import { logout } from '@/api/modules/auth.api'
  import { broadcastAuthEvent } from '@/services/authBroadcast'
  import { clearToken } from '@/services/tokenWorkerClient'
  import { useAppStore } from '@/stores/app'
  import { useAuthStore } from '@/stores/auth'
  import { useWalletStore } from '@/stores/wallet'

  const router = useRouter()
  const appStore = useAppStore()
  const authStore = useAuthStore()
  const walletStore = useWalletStore()

  const { t } = useI18n()

  const user = ref<UserProfile | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const snackbar = ref(false)
  const snackbarText = ref('')

  async function fetchUser () {
    loading.value = true
    error.value = null

    try {
      user.value = await api.user.me()
      console.log('[Account] User loaded:', user.value)
    } catch (error_) {
      console.error('[Account] Failed to load user:', error_)
      if (error_ instanceof ApiError) {
        error.value = `${error_.message} (HTTP ${error_.status})`
        if (error_.status === 401) {
          error.value = 'Session expired. Please login again.'
        }
      } else {
        error.value = error_ instanceof Error ? error_.message : 'Unknown error'
      }
    } finally {
      loading.value = false
    }
  }

  async function handleLogout () {
    // Prevent re-entrancy (double-click) and show global loading overlay
    if (appStore.isAppLocked) return

    appStore.setIsAppLocked(true)

    const watchdog = window.setTimeout(() => {
      appStore.setIsAppLocked(false)
    }, 20_000)

    try {
      try {
        await logout()
      } catch {
        // Ignore logout errors
      }

      await clearToken()
      authStore.clearAuth()
      await walletStore.disconnectAll()
      // Notify other tabs about logout
      broadcastAuthEvent('LOGOUT')
      await router.push('/')
    } finally {
      window.clearTimeout(watchdog)
      appStore.setIsAppLocked(false)
    }
  }

  async function copyProfileLink () {
    if (!user.value?.username) return
    const url = `${window.location.origin}/${user.value.username}`
    try {
      await navigator.clipboard.writeText(url)
      snackbarText.value = t('Account.profileLinkCopied')
      snackbar.value = true
    } catch {
      // Fallback: silently fail
    }
  }

  onMounted(() => {
    fetchUser()
  })
</script>

<route lang="json">
{
  "path": "/account",
  "meta": { "requiresAuth": true }
}
</route>
