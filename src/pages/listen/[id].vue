<!--
  Audio Detail Page (Listen)

  RESPONSIVE LAYOUT:
  - Mobile (< 960px): Single column with app bar, player, metadata stacked vertically
  - Desktop (>= 960px): Two-column layout with player+metadata on left, recommendations on right

  LOCKED CONTENT HANDLING:
  - If entry.locked === true, immediately redirect to /preview/:id
  - This ensures paid content is never accidentally shown on the listen page

  STATES:
  - Loading: Skeleton placeholders for all sections
  - Error: Alert with retry button
  - Not Found: Empty state with navigation options
  - Success: Full audio detail view with inline player
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
          <v-container class="pa-4" fluid>
            <!-- Player Skeleton -->
            <div class="d-flex flex-column align-center">
              <v-skeleton-loader class="rounded-xl" height="240" type="image" width="240" />
              <v-skeleton-loader class="mt-4" type="heading" width="200" />
              <v-skeleton-loader class="mt-2" type="text" width="120" />
              <v-skeleton-loader class="mt-4" type="text" width="100%" />
              <div class="d-flex ga-4 mt-4">
                <v-skeleton-loader type="avatar" />
                <v-skeleton-loader type="avatar" />
                <v-skeleton-loader type="avatar" />
              </div>
            </div>

            <!-- Author Row Skeleton -->
            <div class="d-flex align-center mt-6">
              <v-skeleton-loader class="me-4" type="avatar" />
              <div class="flex-grow-1">
                <v-skeleton-loader type="text" width="150" />
                <v-skeleton-loader class="mt-1" type="text" width="100" />
              </div>
              <v-skeleton-loader type="button" width="100" />
            </div>

            <!-- Description Skeleton -->
            <v-skeleton-loader class="mt-4" type="paragraph" />
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
              <v-alert-title>Failed to load audio</v-alert-title>
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
            <v-icon color="grey" size="120">mdi-music-off</v-icon>
            <h2 class="text-h5 mt-4 mb-2">Audio not found</h2>
            <p class="text-body-2 text-medium-emphasis mb-6">
              The audio you're looking for doesn't exist or has been removed.
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
          <v-container class="pa-4" fluid>
            <!-- Desktop: Back button row -->
            <div class="d-none d-md-flex align-center mb-4">
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

            <!-- Inline Player -->
            <v-card class="pa-6" color="surface-variant" variant="flat">
              <!-- Artwork -->
              <v-sheet
                class="mx-auto rounded-xl overflow-hidden"
                elevation="8"
                height="240"
                width="240"
              >
                <v-img
                  v-if="entry.thumbnailUrl"
                  class="h-100"
                  cover
                  :src="entry.thumbnailUrl"
                >
                  <template #placeholder>
                    <v-sheet
                      class="h-100 d-flex align-center justify-center"
                      color="red-lighten-4"
                    >
                      <v-icon color="grey-darken-2" size="80">mdi-music</v-icon>
                    </v-sheet>
                  </template>
                </v-img>
                <v-sheet
                  v-else
                  class="h-100 d-flex align-center justify-center"
                  color="red-lighten-4"
                >
                  <v-icon color="grey-darken-2" size="80">mdi-music</v-icon>
                </v-sheet>
              </v-sheet>

              <!-- Title & Author (Mobile only) -->
              <div class="text-center mt-4 d-md-none">
                <h1 class="text-h6 font-weight-bold">{{ entry.title }}</h1>
                <p class="text-body-2 text-medium-emphasis">{{ entry.authorName }}</p>
              </div>

              <!-- Progress Slider -->
              <div class="mt-6 mx-auto" :style="{ maxWidth: '400px' }">
                <v-slider
                  v-model="currentTime"
                  color="primary"
                  hide-details
                  :max="duration"
                  :min="0"
                  thumb-size="14"
                  track-size="6"
                />
                <div class="d-flex justify-space-between text-caption text-medium-emphasis mt-1">
                  <span>{{ formatTime(currentTime) }}</span>
                  <span>{{ formatTime(duration) }}</span>
                </div>
              </div>

              <!-- Main Controls -->
              <div class="d-flex align-center justify-center ga-2 mt-4">
                <v-btn
                  aria-label="Skip back 15 seconds"
                  icon="mdi-rewind-15"
                  variant="text"
                  @click="skipBack"
                />

                <v-btn
                  :aria-label="isPlaying ? 'Pause' : 'Play'"
                  color="primary"
                  :icon="isPlaying ? 'mdi-pause' : 'mdi-play'"
                  size="x-large"
                  variant="flat"
                  @click="togglePlay"
                />

                <v-btn
                  aria-label="Skip forward 15 seconds"
                  icon="mdi-fast-forward-15"
                  variant="text"
                  @click="skipForward"
                />
              </div>

              <!-- Secondary Controls -->
              <div class="d-flex align-center justify-center ga-1 mt-4">
                <!-- Playback Speed -->
                <v-menu>
                  <template #activator="{ props: menuProps }">
                    <v-btn
                      v-bind="menuProps"
                      size="small"
                      variant="text"
                    >
                      {{ playbackSpeed }}x
                    </v-btn>
                  </template>
                  <v-list density="compact">
                    <v-list-item
                      v-for="speed in playbackSpeeds"
                      :key="speed"
                      :active="playbackSpeed === speed"
                      @click="playbackSpeed = speed"
                    >
                      <v-list-item-title>{{ speed }}x</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>

                <v-divider class="mx-2" vertical />

                <!-- Share (mobile) -->
                <v-btn
                  aria-label="Share"
                  class="d-md-none"
                  icon="mdi-share-variant"
                  size="small"
                  variant="text"
                  @click="onShare"
                />

                <!-- Save/Bookmark -->
                <v-btn
                  :aria-label="isSaved ? 'Remove from saved' : 'Save'"
                  :color="isSaved ? 'primary' : undefined"
                  :icon="isSaved ? 'mdi-bookmark' : 'mdi-bookmark-outline'"
                  size="small"
                  variant="text"
                  @click="isSaved = !isSaved"
                />
              </div>
            </v-card>

            <!-- Author Row -->
            <v-sheet class="d-flex align-center mt-6 pa-3 rounded-lg" color="surface-variant">
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
                </div>
                <span class="text-body-2 text-medium-emphasis">Creator</span>
              </div>
              <v-btn
                color="primary"
                rounded="pill"
                variant="flat"
              >
                Follow
              </v-btn>
            </v-sheet>

            <!-- Description -->
            <v-card class="mt-4" color="surface-variant" variant="flat">
              <v-card-text>
                <div class="text-body-2 text-medium-emphasis mb-2">
                  Published {{ formatDate(entry.publishedAt) }}
                </div>
                <div :class="{ 'text-truncate-multiline': !descriptionExpanded }">
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
              <h2 class="text-subtitle-1 font-weight-bold mb-3">More audio</h2>
              <AudioRecommendationsList :current-id="entryId" />
            </div>
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
            <h2 class="text-subtitle-1 font-weight-bold mb-3">More audio</h2>
            <AudioRecommendationsList :current-id="entryId" />
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

  // Lazy-load recommendations component
  const AudioRecommendationsList = defineAsyncComponent(() =>
    import('./AudioRecommendationsList.vue'),
  )

  const route = useRoute()
  const router = useRouter()

  // Route param
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

  // Player state
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const playbackSpeed = ref(1)
  const isSaved = ref(false)
  const descriptionExpanded = ref(false)

  // Playback speed options
  const playbackSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 2]

  // Duration from entry
  const duration = computed(() => entry.value?.durationSec ?? 0)

  // Mock data (will come from API later)
  const description = computed(() =>
    entry.value
      ? `This is a sample description for "${entry.value.title}". Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.`
      : '',
  )

  const tags = computed(() =>
    entry.value ? ['podcast', 'audio', 'earnlumens'] : [],
  )

  // Fetch entry data
  async function fetchEntry () {
    loading.value = true
    error.value = false
    notFound.value = false
    errorMessage.value = ''

    try {
      // Force type 'audio' for this page (mock API supports type override)
      const data = await api.mock.getEntryById(entryId.value, 'audio')

      // LOCKED CONTENT REDIRECT
      if (data.locked) {
        router.replace(`/preview/${entryId.value}`)
        return
      }

      // Validate entry type is audio
      if (data.type !== 'audio') {
        const typeRoutes: Record<string, string> = {
          video: '/watch',
          image: '/view',
          entry: '/read',
        }
        const targetRoute = typeRoutes[data.type] || '/read'
        router.replace(`${targetRoute}/${entryId.value}`)
        return
      }

      entry.value = data
    } catch (error_: unknown) {
      console.error('[ListenPage] Failed to fetch entry:', error_)

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

  // Format time as MM:SS or HH:MM:SS
  function formatTime (seconds: number): string {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  function formatDate (date: string | Date): string {
    const d = date instanceof Date ? date : new Date(date)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
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

  // Controls
  function togglePlay () {
    isPlaying.value = !isPlaying.value
  }

  function skipBack () {
    currentTime.value = Math.max(0, currentTime.value - 15)
  }

  function skipForward () {
    currentTime.value = Math.min(duration.value, currentTime.value + 15)
  }

  function onShare () {
    if (navigator.share) {
      navigator.share({
        title: entry.value?.title,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  // Watch for route changes
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
  "path": "/listen/:id"
}
</route>
