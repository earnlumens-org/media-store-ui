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

    <!-- Content tabs -->
    <v-row class="mt-8" justify="center">
      <v-col cols="12" lg="8" md="10">
        <v-tabs
          v-model="activeTab"
          centered
          color="primary"
        >
          <v-tab value="all">
            <v-icon start>mdi-view-grid</v-icon>
            {{ $t('Profile.tabs.all') }}
          </v-tab>
          <v-tab value="video">
            <v-icon start>mdi-video</v-icon>
            {{ $t('Profile.tabs.video') }}
          </v-tab>
          <v-tab value="audio">
            <v-icon start>mdi-music</v-icon>
            {{ $t('Profile.tabs.audio') }}
          </v-tab>
          <v-tab value="image">
            <v-icon start>mdi-image</v-icon>
            {{ $t('Profile.tabs.image') }}
          </v-tab>
          <v-tab value="article">
            <v-icon start>mdi-text-box</v-icon>
            {{ $t('Profile.tabs.article') }}
          </v-tab>
          <v-tab value="file">
            <v-icon start>mdi-file</v-icon>
            {{ $t('Profile.tabs.file') }}
          </v-tab>
        </v-tabs>

        <!-- Entry grid -->
        <div class="mt-4">
          <!-- Loading -->
          <v-row v-if="entriesLoading" dense>
            <v-col
              v-for="n in 6"
              :key="`skeleton-${n}`"
              cols="12"
              md="4"
              sm="6"
            >
              <EntryCardSkeleton />
            </v-col>
          </v-row>

          <!-- Error -->
          <v-alert
            v-else-if="entriesError"
            class="ma-4"
            closable
            text="Failed to load entries. Please try again."
            type="error"
            @click:close="fetchEntries"
          />

          <!-- Empty state -->
          <div
            v-else-if="entries.length === 0"
            class="text-center py-12 text-medium-emphasis"
          >
            <v-icon class="mb-4" size="64">mdi-image-off</v-icon>
            <p>{{ activeTab === 'all' ? $t('Profile.noEntries') : $t('Profile.noEntriesFiltered', { type: $t(`Profile.tabs.${activeTab}`) }) }}</p>
          </div>

          <!-- Entry cards -->
          <v-row v-else dense>
            <v-col
              v-for="item in entries"
              :key="item.id"
              cols="12"
              md="4"
              sm="6"
            >
              <EntryCard
                :entry="toEntryCardProps(item)"
                :show-author="false"
              />
            </v-col>
          </v-row>

          <!-- Load more -->
          <div
            v-if="hasMorePages && entries.length > 0"
            class="text-center py-4"
          >
            <v-btn
              :loading="loadingMore"
              variant="outlined"
              @click="loadMore"
            >
              Load more
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import type { PublicEntryModel } from '@/api/api'
  import type { UserProfile } from '@/api/modules/user.api'
  import type { Entry } from '@/components/entry/EntryCard.vue'

  import { computed, onMounted, ref, watch } from 'vue'
  import { useRoute } from 'vue-router'

  import { api } from '@/api/api'
  import { useAuthStore } from '@/stores/auth'

  const route = useRoute()
  const authStore = useAuthStore()

  const user = ref<UserProfile | null>(null)
  const loading = ref(true)
  const activeTab = ref('all')

  // Entry state
  const entries = ref<PublicEntryModel[]>([])
  const entriesLoading = ref(false)
  const entriesError = ref(false)
  const loadingMore = ref(false)
  const currentPage = ref(0)
  const totalPages = ref(0)
  const PAGE_SIZE = 24

  const hasMorePages = computed(() => currentPage.value < totalPages.value - 1)

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

  /**
   * Maps a PublicEntryModel to the Entry interface expected by EntryCard.
   */
  function toEntryCardProps (item: PublicEntryModel): Entry {
    return {
      id: item.id,
      type: item.type === 'file' ? 'entry' : item.type,
      title: item.title,
      authorName: item.authorName,
      authorAvatarUrl: item.authorAvatarUrl,
      publishedAt: item.publishedAt,
      thumbnailUrl: item.thumbnailUrl,
      durationSec: item.durationSec,
      locked: item.isPaid,
    }
  }

  async function fetchEntries () {
    if (!requestedUsername.value) return
    entriesLoading.value = true
    entriesError.value = false
    entries.value = []

    try {
      const typeFilter = activeTab.value === 'all' ? undefined : activeTab.value as 'video' | 'audio' | 'image' | 'entry' | 'file'
      const response = await api.entries.getByUser(requestedUsername.value, {
        type: typeFilter,
        page: 0,
        size: PAGE_SIZE,
      })
      entries.value = response.items
      currentPage.value = response.page
      totalPages.value = response.totalPages
    } catch (error_) {
      console.error('[ProfilePage] Failed to fetch entries:', error_)
      entriesError.value = true
    } finally {
      entriesLoading.value = false
    }
  }

  async function loadMore () {
    loadingMore.value = true
    try {
      const typeFilter = activeTab.value === 'all' ? undefined : activeTab.value as 'video' | 'audio' | 'image' | 'entry' | 'file'
      const response = await api.entries.getByUser(requestedUsername.value, {
        type: typeFilter,
        page: currentPage.value + 1,
        size: PAGE_SIZE,
      })
      entries.value.push(...response.items)
      currentPage.value = response.page
      totalPages.value = response.totalPages
    } catch (error_) {
      console.error('[ProfilePage] Failed to load more:', error_)
    } finally {
      loadingMore.value = false
    }
  }

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

  // Fetch entries when tab changes
  watch(activeTab, () => {
    fetchEntries()
  })

  // Fetch user and entries when username changes
  watch(requestedUsername, () => {
    fetchUser()
    fetchEntries()
  })

  onMounted(() => {
    fetchUser()
    fetchEntries()
  })
</script>

<route lang="json">
{
  "path": "/:username"
}
</route>
