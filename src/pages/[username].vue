<template>
  <!-- Loading state -->
  <v-container v-if="loading" class="fill-height">
    <v-row align="center" justify="center">
      <v-col class="text-center" cols="12">
        <v-progress-circular color="primary" indeterminate size="64" />
        <p class="mt-4 text-medium-emphasis">{{ $t('Profile.loading') }}</p>
      </v-col>
    </v-row>
  </v-container>

  <!-- User not found -->
  <v-container v-else-if="!user" class="py-8">
    <v-row justify="center">
      <v-col cols="12" lg="6" md="8">
        <div class="text-center py-12">
          <v-avatar class="mb-6 bg-grey-lighten-2" size="120">
            <v-icon color="grey" size="64">mdi-account-off</v-icon>
          </v-avatar>
          <h1 class="text-h4 mb-2">{{ $t('Profile.notFound') }}</h1>
          <p class="text-body-1 text-medium-emphasis mb-6">
            {{ $t('Profile.notFoundDescription', { username: requestedUsername }) }}
          </p>
          <v-btn color="primary" to="/" variant="tonal">
            <v-icon start>mdi-home</v-icon>
            {{ $t('Profile.goHome') }}
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>

  <!-- User profile -->
  <v-container v-else class="py-6 py-md-10">
    <!-- Profile header -->
    <v-row align="center" justify="center">
      <v-col cols="12" lg="8" md="10">
        <div class="d-flex flex-column flex-sm-row align-center align-sm-start ga-4 ga-sm-6">
          <!-- Avatar -->
          <v-avatar class="flex-shrink-0" size="120">
            <v-img
              v-if="user.profileImageUrl"
              :alt="user.displayName"
              :src="user.profileImageUrl"
            />
            <v-icon v-else color="grey" size="64">mdi-account</v-icon>
          </v-avatar>

          <!-- Info -->
          <div class="text-center text-sm-start flex-grow-1">
            <h1 class="text-h5 text-sm-h4 font-weight-bold mb-1">
              @{{ user.username }}
            </h1>
            <p class="text-body-1 text-medium-emphasis mb-2">
              {{ user.displayName }}
            </p>
            <p class="text-body-2 text-medium-emphasis mb-4">
              {{ user.followersCount?.toLocaleString() ?? 0 }} {{ $t('Profile.followers') }} | 0 {{ $t('Profile.likes') }}
            </p>

            <!-- Action buttons -->
            <div class="d-flex flex-wrap justify-center justify-sm-start ga-2">
              <v-btn
                color="primary"
                :disabled="isOwnProfile"
                rounded="pill"
                variant="flat"
              >
                {{ $t('Profile.follow') }}
              </v-btn>
              <v-btn
                :disabled="isOwnProfile"
                rounded="pill"
                variant="outlined"
              >
                {{ $t('Profile.message') }}
              </v-btn>
            </div>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Content tabs (placeholder for future entries) -->
    <v-row class="mt-8" justify="center">
      <v-col cols="12" lg="8" md="10">
        <v-tabs v-model="activeTab" centered color="primary">
          <v-tab value="entries">
            <v-icon start>mdi-view-grid</v-icon>
            {{ $t('Profile.entries') }}
          </v-tab>
          <v-tab value="posts">
            <v-icon start>mdi-text-box</v-icon>
            {{ $t('Profile.posts') }}
          </v-tab>
        </v-tabs>

        <v-tabs-window v-model="activeTab">
          <v-tabs-window-item value="entries">
            <div class="text-center py-12 text-medium-emphasis">
              <v-icon class="mb-4" size="64">mdi-image-off</v-icon>
              <p>{{ $t('Profile.noEntries') }}</p>
            </div>
          </v-tabs-window-item>

          <v-tabs-window-item value="posts">
            <div class="text-center py-12 text-medium-emphasis">
              <v-icon class="mb-4" size="64">mdi-text-box-remove</v-icon>
              <p>{{ $t('Profile.noPosts') }}</p>
            </div>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import type { UserProfile } from '@/api/modules/user.api'

  import { computed, onMounted, ref, watch } from 'vue'
  import { useRoute } from 'vue-router'

  import { api } from '@/api/api'
  import { useAuthStore } from '@/stores/auth'

  const route = useRoute()
  const authStore = useAuthStore()

  const user = ref<UserProfile | null>(null)
  const loading = ref(true)
  const activeTab = ref('entries')

  // Get username from route param
  const requestedUsername = computed(() => {
    const params = route.params as Record<string, string | string[]>
    const param = params.username
    return (Array.isArray(param) ? param[0] : param)?.toLowerCase() ?? ''
  })

  // Check if viewing own profile
  const isOwnProfile = computed(() => {
    return authStore.user?.username?.toLowerCase() === requestedUsername.value
  })

  async function fetchUser () {
    if (!requestedUsername.value) {
      loading.value = false
      return
    }

    loading.value = true
    user.value = null

    try {
      user.value = await api.user.getByUsername(requestedUsername.value)
    } catch {
      // User not found - user.value remains null
      user.value = null
    } finally {
      loading.value = false
    }
  }

  // Fetch user when username changes
  watch(requestedUsername, () => {
    fetchUser()
  })

  onMounted(() => {
    fetchUser()
  })
</script>

<route lang="json">
{
  "path": "/:username"
}
</route>
