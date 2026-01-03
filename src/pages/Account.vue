<template>
  <v-container class="py-8">
    <v-row justify="center">
      <v-col cols="12" lg="6" md="8">
        <v-card>
          <v-card-title class="text-h5">
            <v-icon start>mdi-account</v-icon>
            Account
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

              <v-divider class="mb-4" />

              <v-list density="compact">
                <v-list-item>
                  <template #prepend>
                    <v-icon>mdi-identifier</v-icon>
                  </template>
                  <v-list-item-title>User ID</v-list-item-title>
                  <v-list-item-subtitle class="text-truncate">{{ user.id }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template #prepend>
                    <v-icon>mdi-account-group</v-icon>
                  </template>
                  <v-list-item-title>Followers</v-list-item-title>
                  <v-list-item-subtitle>{{ user.followersCount?.toLocaleString() ?? 'N/A' }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="user.friendsCount !== undefined">
                  <template #prepend>
                    <v-icon>mdi-account-multiple</v-icon>
                  </template>
                  <v-list-item-title>Following</v-list-item-title>
                  <v-list-item-subtitle>{{ user.friendsCount.toLocaleString() }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="user.location">
                  <template #prepend>
                    <v-icon>mdi-map-marker</v-icon>
                  </template>
                  <v-list-item-title>Location</v-list-item-title>
                  <v-list-item-subtitle>{{ user.location }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="user.description">
                  <template #prepend>
                    <v-icon>mdi-text</v-icon>
                  </template>
                  <v-list-item-title>Bio</v-list-item-title>
                  <v-list-item-subtitle class="text-wrap">{{ user.description }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>

              <v-chip v-if="user.verified" class="mt-4" color="info" size="small">
                <v-icon size="small" start>mdi-check-decagram</v-icon>
                Verified
              </v-chip>
            </div>

            <!-- No user -->
            <div v-else class="text-center py-8 text-medium-emphasis">
              No user data loaded
            </div>
          </v-card-text>

          <v-card-actions>
            <v-btn color="primary" :loading="loading" variant="tonal" @click="fetchUser">
              <v-icon start>mdi-refresh</v-icon>
              Refresh
            </v-btn>
            <v-spacer />
            <v-btn color="error" variant="text" @click="handleLogout">
              <v-icon start>mdi-logout</v-icon>
              Logout
            </v-btn>
          </v-card-actions>
        </v-card>

        <!-- Debug info -->
        <v-expansion-panels class="mt-4">
          <v-expansion-panel title="Debug: Raw API Response">
            <v-expansion-panel-text>
              <pre class="text-caption">{{ JSON.stringify(user, null, 2) }}</pre>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import type { UserProfile } from '@/api/modules/user.api'
  import { onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { api, ApiError } from '@/api/api'
  import { logout } from '@/api/modules/auth.api'
  import { clearToken } from '@/services/tokenWorkerClient'
  import { useAuthStore } from '@/stores/auth'

  const router = useRouter()
  const authStore = useAuthStore()

  const user = ref<UserProfile | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

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
    try {
      await logout()
    } catch {
      // Ignore logout errors
    }
    await clearToken()
    authStore.clearAuth()
    router.push('/')
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
