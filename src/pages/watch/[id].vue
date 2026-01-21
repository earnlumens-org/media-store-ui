<!--
  Video Detail Page (Watch)

  RESPONSIVE LAYOUT:
  - Mobile (< 960px): Single column with app bar, player, metadata stacked vertically
  - Desktop (>= 960px): Two-column layout with player+metadata on left (8 cols), recommendations on right (4 cols)

  LOCKED CONTENT HANDLING:
  - If entry.locked === true, immediately redirect to /preview/{id}
  - This ensures paid content is never accidentally shown on the watch page
  - The preview page will handle the paywall/checkout flow

  STATES:
  - Loading: Skeleton placeholders for all sections
  - Error: Alert with retry button
  - Not Found: Empty state with navigation options
  - Success: Full video detail view
-->
<template>
  <v-container class="pa-0" fluid>
    <!-- MOBILE: Top App Bar (visible on xs/sm only) -->
    <v-app-bar
      class="d-md-none"
      color="surface"
      density="compact"
      flat
    >
      <v-btn
        aria-label="Go back"
        icon="mdi-arrow-left"
        variant="text"
        @click="goBack"
      />

      <v-app-bar-title v-if="entry" class="text-body-1">
        {{ entry.title }}
      </v-app-bar-title>
      <v-app-bar-title v-else>
        <v-skeleton-loader type="text" width="200" />
      </v-app-bar-title>

      <template #append>
        <v-btn
          aria-label="Share"
          icon="mdi-share-variant"
          variant="text"
          @click="onShare"
        />
        <v-menu>
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              aria-label="More options"
              icon="mdi-dots-vertical"
              variant="text"
            />
          </template>
          <v-list density="compact">
            <v-list-item prepend-icon="mdi-flag" title="Report" />
            <v-list-item prepend-icon="mdi-playlist-plus" title="Add to playlist" />
          </v-list>
        </v-menu>
      </template>
    </v-app-bar>

    <!-- LOADING STATE -->
    <template v-if="loading">
      <v-row class="ma-0" no-gutters>
        <!-- Left Column / Main Content -->
        <v-col
          cols="12"
          lg="8"
          md="8"
          xl="9"
        >
          <v-container class="pa-0 pa-md-4" fluid>
            <!-- Player Skeleton -->
            <v-skeleton-loader class="rounded-0 rounded-md-lg" type="image" />

            <!-- Title Skeleton -->
            <v-sheet class="pa-4">
              <v-skeleton-loader type="heading" />

              <!-- Author Row Skeleton -->
              <div class="d-flex align-center mt-4">
                <v-skeleton-loader class="me-4" type="avatar" />
                <div class="flex-grow-1">
                  <v-skeleton-loader type="text" width="150" />
                  <v-skeleton-loader class="mt-1" type="text" width="100" />
                </div>
                <v-skeleton-loader type="button" width="100" />
              </div>

              <!-- Actions Skeleton -->
              <div class="d-flex ga-2 mt-4">
                <v-skeleton-loader type="chip" />
                <v-skeleton-loader type="chip" />
                <v-skeleton-loader type="chip" />
              </div>

              <!-- Description Skeleton -->
              <v-skeleton-loader class="mt-4" type="paragraph" />
            </v-sheet>
          </v-container>
        </v-col>

        <!-- Right Column / Recommendations (Desktop only) -->
        <v-col
          class="d-none d-md-block"
          cols="12"
          lg="4"
          md="4"
          xl="3"
        >
          <v-container class="pa-4" fluid>
            <v-skeleton-loader class="mb-4" type="text" width="150" />
            <v-skeleton-loader
              v-for="n in 5"
              :key="n"
              class="mb-2"
              type="list-item-avatar-two-line"
            />
          </v-container>
        </v-col>
      </v-row>
    </template>

    <!-- ERROR STATE -->
    <template v-else-if="error">
      <v-container class="fill-height">
        <v-row align="center" justify="center">
          <v-col
            cols="12"
            lg="4"
            md="6"
            sm="8"
          >
            <v-alert
              class="mb-4"
              prominent
              type="error"
              variant="tonal"
            >
              <v-alert-title>Failed to load video</v-alert-title>
              {{ errorMessage }}
            </v-alert>
            <div class="d-flex ga-2 justify-center">
              <v-btn
                color="primary"
                prepend-icon="mdi-refresh"
                variant="flat"
                @click="fetchEntry"
              >
                Retry
              </v-btn>
              <v-btn
                prepend-icon="mdi-home"
                variant="outlined"
                @click="goHome"
              >
                Go Home
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </template>

    <!-- NOT FOUND STATE -->
    <template v-else-if="notFound">
      <v-container class="fill-height">
        <v-row align="center" justify="center">
          <v-col
            class="text-center"
            cols="12"
            lg="4"
            md="6"
            sm="8"
          >
            <v-icon color="grey" size="120">mdi-video-off-outline</v-icon>
            <h2 class="text-h5 mt-4 mb-2">Video not found</h2>
            <p class="text-body-2 text-medium-emphasis mb-6">
              The video you're looking for doesn't exist or has been removed.
            </p>
            <div class="d-flex ga-2 justify-center">
              <v-btn
                color="primary"
                prepend-icon="mdi-arrow-left"
                variant="flat"
                @click="goBack"
              >
                Go Back
              </v-btn>
              <v-btn
                prepend-icon="mdi-home"
                variant="outlined"
                @click="goHome"
              >
                Go Home
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </template>

    <!-- SUCCESS STATE -->
    <template v-else-if="entry">
      <v-row class="ma-0" no-gutters>
        <!-- Left Column / Main Content -->
        <v-col
          cols="12"
          lg="8"
          md="8"
          xl="9"
        >
          <v-container class="pa-0 pa-md-4" fluid>
            <!-- Video Player Area -->
            <v-responsive :aspect-ratio="16 / 9" class="bg-black rounded-0 rounded-md-lg overflow-hidden">
              <div class="d-flex align-center justify-center h-100 position-relative">
                <!-- Thumbnail with play overlay (placeholder for actual player) -->
                <v-img
                  v-if="entry.thumbnailUrl"
                  class="w-100 h-100 position-absolute"
                  cover
                  :src="entry.thumbnailUrl"
                />
                <v-sheet
                  v-else
                  class="w-100 h-100 position-absolute d-flex align-center justify-center"
                  color="grey-darken-3"
                >
                  <v-icon color="grey" size="80">mdi-video-outline</v-icon>
                </v-sheet>

                <!-- Play button overlay -->
                <v-btn
                  aria-label="Play video"
                  class="elevation-4"
                  color="white"
                  icon="mdi-play"
                  size="x-large"
                  variant="flat"
                />
              </div>
            </v-responsive>

            <!-- Video Metadata -->
            <v-sheet class="pa-4" color="transparent">
              <!-- Title (Desktop: includes back button) -->
              <div class="d-none d-md-flex align-center mb-2">
                <v-btn
                  aria-label="Go back"
                  class="me-2"
                  density="comfortable"
                  icon="mdi-arrow-left"
                  variant="text"
                  @click="goBack"
                />
                <h1 class="text-h5 font-weight-bold flex-grow-1">
                  {{ entry.title }}
                </h1>
                <v-btn
                  aria-label="Share"
                  icon="mdi-share-variant"
                  variant="text"
                  @click="onShare"
                />
                <v-menu>
                  <template #activator="{ props: menuProps }">
                    <v-btn
                      v-bind="menuProps"
                      aria-label="More options"
                      icon="mdi-dots-vertical"
                      variant="text"
                    />
                  </template>
                  <v-list density="compact">
                    <v-list-item prepend-icon="mdi-flag" title="Report" />
                    <v-list-item prepend-icon="mdi-playlist-plus" title="Add to playlist" />
                  </v-list>
                </v-menu>
              </div>

              <!-- Title (Mobile only) -->
              <h1 class="text-h6 font-weight-bold d-md-none">
                {{ entry.title }}
              </h1>

              <!-- Views & Date -->
              <div class="text-body-2 text-medium-emphasis mt-1">
                <span>{{ formatViewCount(12500) }} views</span>
                <span class="mx-1">•</span>
                <span>{{ formatDate(entry.publishedAt) }}</span>
              </div>

              <!-- Author Row -->
              <v-sheet class="d-flex align-center mt-4 pa-3 rounded-lg" color="surface-variant">
                <v-avatar
                  class="me-3"
                  color="grey-lighten-2"
                  :image="entry.authorAvatarUrl"
                  size="48"
                >
                  <v-icon v-if="!entry.authorAvatarUrl">mdi-account</v-icon>
                </v-avatar>
                <div class="flex-grow-1">
                  <div class="d-flex align-center">
                    <span class="text-body-1 font-weight-medium">{{ entry.authorName }}</span>
                    <v-icon class="ms-1" color="primary" size="18">mdi-check-decagram</v-icon>
                  </div>
                  <span class="text-body-2 text-medium-emphasis">1.2K subscribers</span>
                </div>
                <v-btn
                  color="primary"
                  rounded="pill"
                  variant="flat"
                >
                  Subscribe
                </v-btn>
              </v-sheet>

              <!-- Action Buttons -->
              <div class="d-flex flex-wrap ga-2 mt-4">
                <v-btn
                  :aria-label="isLiked ? 'Unlike' : 'Like'"
                  :color="isLiked ? 'primary' : undefined"
                  :prepend-icon="isLiked ? 'mdi-thumb-up' : 'mdi-thumb-up-outline'"
                  rounded="pill"
                  variant="tonal"
                  @click="toggleLike"
                >
                  {{ formatCount(likes) }}
                </v-btn>
                <v-btn
                  aria-label="Dislike"
                  prepend-icon="mdi-thumb-down-outline"
                  rounded="pill"
                  variant="tonal"
                >
                  Dislike
                </v-btn>
                <v-btn
                  aria-label="Share"
                  class="d-md-none"
                  prepend-icon="mdi-share-variant"
                  rounded="pill"
                  variant="tonal"
                  @click="onShare"
                >
                  Share
                </v-btn>
                <v-btn
                  :aria-label="isSaved ? 'Remove from saved' : 'Save'"
                  :color="isSaved ? 'primary' : undefined"
                  :prepend-icon="isSaved ? 'mdi-bookmark' : 'mdi-bookmark-outline'"
                  rounded="pill"
                  variant="tonal"
                  @click="toggleSave"
                >
                  {{ isSaved ? 'Saved' : 'Save' }}
                </v-btn>
                <v-btn
                  aria-label="Tip creator"
                  prepend-icon="mdi-hand-coin-outline"
                  rounded="pill"
                  variant="tonal"
                >
                  Tip
                </v-btn>
              </div>

              <!-- Description -->
              <v-card class="mt-4" color="surface-variant" variant="flat">
                <v-card-text>
                  <div
                    :class="{ 'text-truncate-multiline': !descriptionExpanded }"
                  >
                    {{ description }}
                  </div>
                  <v-btn
                    v-if="description.length > 200"
                    class="mt-2 px-0"
                    density="comfortable"
                    variant="text"
                    @click="descriptionExpanded = !descriptionExpanded"
                  >
                    {{ descriptionExpanded ? 'Show less' : 'Read more' }}
                  </v-btn>
                </v-card-text>
              </v-card>

              <!-- Tags -->
              <div v-if="tags.length > 0" class="d-flex flex-wrap ga-2 mt-4">
                <v-chip
                  v-for="tag in tags"
                  :key="tag"
                  color="primary"
                  label
                  size="small"
                  variant="tonal"
                >
                  #{{ tag }}
                </v-chip>
              </div>

              <!-- Mobile: Recommendations Section -->
              <div class="d-md-none mt-6">
                <h2 class="text-subtitle-1 font-weight-bold mb-3">Up next</h2>
                <RecommendationsList :current-id="entryId" />
              </div>
            </v-sheet>
          </v-container>
        </v-col>

        <!-- Right Column / Recommendations (Desktop only) -->
        <v-col
          class="d-none d-md-block"
          cols="12"
          lg="4"
          md="4"
          xl="3"
        >
          <v-container class="pa-4 pt-md-6" fluid>
            <h2 class="text-subtitle-1 font-weight-bold mb-3">Up next</h2>
            <RecommendationsList :current-id="entryId" />
          </v-container>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script setup lang="ts">
  import type { EntryModel } from '@/api/api'

  import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'

  import { api } from '@/api/api'

  // Lazy-load recommendations component (internal to this page)
  const RecommendationsList = defineAsyncComponent(() =>
    import('./RecommendationsList.vue'),
  )

  const route = useRoute()
  const router = useRouter()

  // Route param - cast to handle typed router union
  const entryId = computed(() => {
    const params = route.params as { id?: string }
    return params.id ?? ''
  })

  // State
  const entry = ref<EntryModel | null>(null)
  const loading = ref(true)
  const error = ref(false)
  const errorMessage = ref('')
  const notFound = ref(false)

  // UI State
  const isLiked = ref(false)
  const isSaved = ref(false)
  const likes = ref(1234)
  const descriptionExpanded = ref(false)

  // Mock data (will come from API later)
  const description = computed(() =>
    entry.value
      ? `This is a sample description for "${entry.value.title}". Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.`
      : '',
  )

  const tags = computed(() =>
    entry.value ? ['tutorial', 'creative', 'earnlumens'] : [],
  )

  // Fetch entry data
  async function fetchEntry () {
    loading.value = true
    error.value = false
    notFound.value = false
    errorMessage.value = ''

    try {
      const data = await api.mock.getEntryById(entryId.value)

      // LOCKED CONTENT REDIRECT
      // If the entry is locked, redirect to preview page immediately
      if (data.locked) {
        router.replace(`/preview/${entryId.value}`)
        return
      }

      // Validate entry type is video
      if (data.type !== 'video') {
        // Redirect to appropriate page based on type
        const typeRoutes: Record<string, string> = {
          audio: '/listen',
          image: '/view',
          entry: '/read',
        }
        const targetRoute = typeRoutes[data.type] || '/read'
        router.replace(`${targetRoute}/${entryId.value}`)
        return
      }

      entry.value = data
    } catch (error_: unknown) {
      console.error('[WatchPage] Failed to fetch entry:', error_)

      if (error_ && typeof error_ === 'object' && 'status' in error_ && (error_ as { status: number }).status === 404) {
        notFound.value = true
      } else {
        error.value = true
        errorMessage.value = error_ instanceof Error ? error_.message : 'An unexpected error occurred'
      }
    } finally {
      loading.value = false
    }
  }

  // Navigation
  function goBack () {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  function goHome () {
    router.push('/')
  }

  // Actions
  function toggleLike () {
    isLiked.value = !isLiked.value
    likes.value += isLiked.value ? 1 : -1
  }

  function toggleSave () {
    isSaved.value = !isSaved.value
  }

  function onShare () {
    if (navigator.share) {
      navigator.share({
        title: entry.value?.title,
        url: window.location.href,
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
    }
  }

  // Formatters
  const ONE_MILLION = 10 ** 6
  const ONE_THOUSAND = 1000

  function formatViewCount (count: number): string {
    if (count >= ONE_MILLION) {
      return `${(count / ONE_MILLION).toFixed(1)}M`
    }
    if (count >= ONE_THOUSAND) {
      return `${(count / ONE_THOUSAND).toFixed(1)}K`
    }
    return count.toString()
  }

  function formatCount (count: number): string {
    if (count >= ONE_THOUSAND) {
      return `${(count / ONE_THOUSAND).toFixed(1)}K`
    }
    return count.toString()
  }

  function formatDate (date: string | Date): string {
    const d = date instanceof Date ? date : new Date(date)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Watch for route changes (same page, different ID)
  watch(entryId, () => {
    if (entryId.value) {
      fetchEntry()
    }
  })

  // Initial load
  onMounted(() => {
    fetchEntry()
  })
</script>

<route lang="json">
{
  "path": "/watch/:id"
}
</route>
