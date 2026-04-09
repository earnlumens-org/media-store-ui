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

              <v-divider class="mb-4" />

              <!-- ── Verification Badge ────────────────────── -->
              <div class="mb-4">
                <p class="text-subtitle-2 font-weight-bold text-medium-emphasis mb-3">
                  {{ $t('Account.badgeSection') }}
                </p>

                <!-- Loading badge info -->
                <div v-if="badgeLoading" class="text-center py-4">
                  <v-progress-circular color="primary" indeterminate size="24" width="2" />
                </div>

                <!-- Has active badge -->
                <v-card
                  v-else-if="activeBadge"
                  class="badge-card"
                  color="transparent"
                  rounded="lg"
                  variant="tonal"
                >
                  <v-card-text class="d-flex align-center pa-4">
                    <div class="badge-icon-ring me-4 flex-shrink-0">
                      <v-img
                        v-if="activeBadgeSrc"
                        height="32"
                        :src="activeBadgeSrc"
                        width="32"
                      />
                      <v-icon v-else color="primary" size="32">mdi-check-decagram</v-icon>
                    </div>

                    <div class="flex-grow-1">
                      <p class="text-body-1 font-weight-medium mb-1">
                        {{ $t('Account.badgeActive') }}
                      </p>

                      <div class="text-body-2 text-medium-emphasis">
                        <div v-if="activeBadge.startedAt">
                          {{ $t('Account.badgeSince') }}: {{ formatDate(activeBadge.startedAt) }}
                        </div>
                        <div>
                          {{ $t('Account.badgeExpires') }}:
                          {{ activeBadge.expiresAt ? formatDate(activeBadge.expiresAt) : $t('Account.badgeNoExpiration') }}
                        </div>
                      </div>
                    </div>
                  </v-card-text>
                </v-card>

                <!-- No badge -->
                <v-card
                  v-else
                  class="badge-card"
                  rounded="lg"
                  variant="outlined"
                >
                  <v-card-text class="text-center pa-5">
                    <v-icon class="mb-2" color="medium-emphasis" size="40">mdi-shield-check-outline</v-icon>
                    <p class="text-body-1 font-weight-medium mb-1">
                      {{ $t('Account.badgeNone') }}
                    </p>
                    <p class="text-body-2 text-medium-emphasis mb-4">
                      {{ $t('Account.badgeNoneHint') }}
                    </p>
                    <v-btn
                      class="text-none font-weight-bold"
                      color="primary"
                      rounded="lg"
                      size="large"
                      @click="showVerification = true"
                    >
                      <v-icon class="me-2">mdi-check-decagram</v-icon>
                      {{ $t('Account.badgeGetAccess') }}
                    </v-btn>
                  </v-card-text>
                </v-card>
              </div>

              <VerificationDialog v-model="showVerification" />
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
  import type { BadgeAssignment } from '@/api/modules/badge.api'
  import type { UserProfile } from '@/api/modules/user.api'
  import { onMounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { api, ApiError } from '@/api/api'
  import { logout } from '@/api/modules/auth.api'
  import VerificationDialog from '@/components/home/VerificationDialog.vue'
  import { getProfileBadgeSrc } from '@/lib/profileBadge'
  import { broadcastAuthEvent } from '@/services/authBroadcast'
  import { clearToken } from '@/services/tokenWorkerClient'
  import { useAppStore } from '@/stores/app'
  import { PURCHASES_STORAGE_KEY } from '@/stores/purchases'

  const appStore = useAppStore()

  const { t, locale } = useI18n()

  const user = ref<UserProfile | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const snackbar = ref(false)
  const snackbarText = ref('')

  const showVerification = ref(false)
  const badgeLoading = ref(false)
  const activeBadge = ref<BadgeAssignment | null>(null)
  const activeBadgeSrc = ref<string | undefined>(undefined)

  function formatDate (iso: string): string {
    try {
      return new Date(iso).toLocaleDateString(locale.value, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return iso.slice(0, 10)
    }
  }

  async function fetchBadges () {
    badgeLoading.value = true
    try {
      const res = await api.badges.me()
      if (res.activeBadge && res.assignments.length) {
        const active = res.assignments.find(a => a.status === 'ACTIVE') ?? res.assignments[0]
        activeBadge.value = active
        activeBadgeSrc.value = getProfileBadgeSrc(res.activeBadge as any)
      }
    } catch {
      // Badge fetch failed — section will show "no badge"
    } finally {
      badgeLoading.value = false
    }
  }

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
    if (appStore.isAppLocked) return
    appStore.setIsAppLocked(true)

    try {
      await logout()
    } catch {
      // Ignore logout errors
    }

    await clearToken()
    localStorage.removeItem(PURCHASES_STORAGE_KEY)
    broadcastAuthEvent('LOGOUT')
    window.location.assign('/')
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
    fetchBadges()
  })

  watch(() => appStore.refreshKey, () => {
    window.scrollTo(0, 0)
    fetchUser()
    fetchBadges()
  })
</script>

<route lang="json">
{
  "path": "/account",
  "meta": { "requiresAuth": true }
}
</route>

<style scoped>
.badge-icon-ring {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(29, 155, 240, 0.1);
  border: 2px solid rgba(29, 155, 240, 0.25);
}
</style>
