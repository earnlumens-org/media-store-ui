<!--
  Image Detail Page (View)

  RESPONSIVE LAYOUT:
  - Mobile (< 960px): Single column with app bar, image, metadata stacked vertically
  - Desktop (>= 960px): Two-column layout with image+metadata on left, recommendations on right

  LOCKED CONTENT HANDLING:
  - If entry.locked === true, immediately redirect to /preview/:id
  - This ensures paid content is never accidentally shown on the view page

  STATES:
  - Loading: Skeleton placeholders for all sections
  - Error: Alert with retry button
  - Not Found: Empty state with navigation options
  - Success: Full image detail view
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
        :aria-label="$t('Common.goBack')"
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
          :aria-label="$t('Common.share')"
          icon="mdi-share-variant"
          variant="text"
          @click="onShare"
        />
        <v-menu>
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              :aria-label="$t('Common.moreOptions')"
              icon="mdi-dots-vertical"
              variant="text"
            />
          </template>
          <v-list density="compact">
            <v-list-item prepend-icon="mdi-download" :title="$t('Common.download')" />
            <v-list-item prepend-icon="mdi-flag" :title="$t('Common.report')" />
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
            <!-- Image Skeleton -->
            <v-skeleton-loader class="rounded-lg" height="400" type="image" />

            <!-- Title Skeleton -->
            <v-skeleton-loader class="mt-4" type="heading" />

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
              v-for="n in 4"
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
              <v-alert-title>{{ $t('Common.failedToLoadImage') }}</v-alert-title>
              {{ errorMessage }}
            </v-alert>
            <div class="d-flex ga-2 justify-center">
              <v-btn
                color="primary"
                prepend-icon="mdi-refresh"
                variant="flat"
                @click="fetchEntry"
              >
                {{ $t('Common.retry') }}
              </v-btn>
              <v-btn
                prepend-icon="mdi-home"
                variant="outlined"
                @click="goHome"
              >
                {{ $t('Common.goHome') }}
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
            <v-icon color="grey" size="120">mdi-image-off-outline</v-icon>
            <h2 class="text-h5 mt-4 mb-2">{{ $t('Common.imageNotFound') }}</h2>
            <p class="text-body-2 text-medium-emphasis mb-6">
              {{ $t('Common.imageNotFoundDescription') }}
            </p>
            <div class="d-flex ga-2 justify-center">
              <v-btn
                color="primary"
                prepend-icon="mdi-arrow-left"
                variant="flat"
                @click="goBack"
              >
                {{ $t('Common.goBack') }}
              </v-btn>
              <v-btn
                prepend-icon="mdi-home"
                variant="outlined"
                @click="goHome"
              >
                {{ $t('Common.goHome') }}
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
            <!-- Image Display -->
            <v-sheet
              class="rounded-0 rounded-md-lg overflow-hidden bg-black d-flex align-center justify-center"
              min-height="300"
            >
              <v-img
                v-if="entry.thumbnailUrl"
                contain
                :max-height="imageMaxHeight"
                :src="entry.thumbnailUrl"
              >
                <template #placeholder>
                  <v-sheet
                    class="h-100 w-100 d-flex align-center justify-center"
                    color="grey-darken-4"
                  >
                    <v-progress-circular color="white" indeterminate />
                  </v-sheet>
                </template>
                <template #error>
                  <v-sheet
                    class="h-100 w-100 d-flex flex-column align-center justify-center"
                    color="grey-darken-4"
                  >
                    <v-icon color="grey" size="80">mdi-image-broken</v-icon>
                    <span class="text-body-2 text-grey mt-2">{{ $t('Common.failedToLoadImage') }}</span>
                  </v-sheet>
                </template>
              </v-img>
              <v-sheet
                v-else
                class="h-100 w-100 d-flex align-center justify-center"
                color="grey-darken-3"
                height="400"
              >
                <v-icon color="grey" size="80">mdi-image-outline</v-icon>
              </v-sheet>
            </v-sheet>

            <!-- Image Metadata -->
            <v-sheet class="pa-4" color="transparent">
              <!-- Title (Desktop: includes back button) -->
              <div class="d-none d-md-flex align-center mb-2">
                <v-btn
                  :aria-label="$t('Common.goBack')"
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
                  :aria-label="$t('Common.share')"
                  icon="mdi-share-variant"
                  variant="text"
                  @click="onShare"
                />
                <v-menu>
                  <template #activator="{ props: menuProps }">
                    <v-btn
                      v-bind="menuProps"
                      :aria-label="$t('Common.moreOptions')"
                      icon="mdi-dots-vertical"
                      variant="text"
                    />
                  </template>
                  <v-list density="compact">
                    <v-list-item prepend-icon="mdi-download" :title="$t('Common.download')" />
                    <v-list-item prepend-icon="mdi-flag" :title="$t('Common.report')" />
                  </v-list>
                </v-menu>
              </div>

              <!-- Title (Mobile only) -->
              <h1 class="text-h6 font-weight-bold d-md-none">
                {{ entry.title }}
              </h1>

              <!-- Date -->
              <div class="text-body-2 text-medium-emphasis mt-1">
                <span>{{ formatDate(entry.publishedAt) }}</span>
              </div>

              <!-- Author Row -->
              <v-sheet class="d-flex align-center mt-4 pa-3 rounded-lg" color="surface">
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
                  <span class="text-body-2 text-medium-emphasis">{{ $t('Common.creator') }}</span>
                </div>
                <v-btn
                  color="primary"
                  rounded="pill"
                  variant="flat"
                >
                  {{ $t('Common.follow') }}
                </v-btn>
              </v-sheet>

              <!-- Action Buttons -->
              <div class="d-flex flex-wrap ga-2 mt-4">
                <v-btn
                  :aria-label="isLiked ? $t('Common.unlike') : $t('Common.like')"
                  :color="isLiked ? 'primary' : undefined"
                  :prepend-icon="isLiked ? 'mdi-heart' : 'mdi-heart-outline'"
                  rounded="pill"
                  variant="tonal"
                  @click="toggleLike"
                >
                  {{ formatCount(likes) }}
                </v-btn>
                <v-btn
                  :aria-label="$t('Common.share')"
                  class="d-md-none"
                  prepend-icon="mdi-share-variant"
                  rounded="pill"
                  variant="tonal"
                  @click="onShare"
                >
                  {{ $t('Common.share') }}
                </v-btn>
                <v-btn
                  :aria-label="isSaved ? $t('Common.removeFromCollection') : $t('Common.saveToCollection')"
                  :color="isSaved ? 'primary' : undefined"
                  :prepend-icon="isSaved ? 'mdi-bookmark' : 'mdi-bookmark-outline'"
                  rounded="pill"
                  variant="tonal"
                  @click="toggleSave"
                >
                  {{ isSaved ? $t('Common.saved') : $t('Common.save') }}
                </v-btn>
                <v-btn
                  :aria-label="$t('Common.download')"
                  prepend-icon="mdi-download"
                  rounded="pill"
                  variant="tonal"
                >
                  {{ $t('Common.download') }}
                </v-btn>
              </div>

              <!-- Description -->
              <v-card class="mt-4" color="surface" variant="flat">
                <v-card-text>
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
                    {{ descriptionExpanded ? $t('Common.showLess') : $t('Common.readMore') }}
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
                <h2 class="text-subtitle-1 font-weight-bold mb-4">
                  {{ $t('Common.moreFromCreator') }}
                </h2>
                <ImageRecommendationsList :exclude-id="entryId" />
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
          <v-container class="pa-4" fluid>
            <h2 class="text-subtitle-1 font-weight-bold mb-4">
              {{ $t('Common.moreFromCreator') }}
            </h2>
            <ImageRecommendationsList :exclude-id="entryId" />
          </v-container>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script setup lang="ts">
  import type { EntryModel } from '@/api/api'

  import { computed, onMounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'

  import { api } from '@/api/api'

  import ImageRecommendationsList from './ImageRecommendationsList.vue'

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
  const notFound = ref(false)
  const errorMessage = ref('')

  // UI State
  const descriptionExpanded = ref(false)
  const isLiked = ref(false)
  const isSaved = ref(false)
  const likes = ref(342)

  // Mock data (since Entry model may not have these)
  const description = 'A stunning photograph capturing the essence of light and shadow. This image showcases the beauty of natural landscapes and the artistry of professional photography. The composition draws the viewer into the scene, creating an immersive visual experience that transcends the ordinary.'
  const tags = ['photography', 'landscape', 'nature', 'art', 'digital']

  // Computed
  const imageMaxHeight = computed(() => '70vh')

  // Format count with K suffix
  const ONE_THOUSAND = 1000

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

  // Fetch entry data
  async function fetchEntry () {
    loading.value = true
    error.value = false
    notFound.value = false
    errorMessage.value = ''

    try {
      // Force type 'image' for this page
      const data = await api.mock.getEntryById(entryId.value, 'image')

      // LOCKED CONTENT REDIRECT
      if (data.locked) {
        router.replace(`/preview/${entryId.value}`)
        return
      }

      // Validate entry type is image
      if (data.type !== 'image') {
        const typeRoutes: Record<string, string> = {
          video: '/watch',
          audio: '/listen',
          entry: '/read',
        }
        const targetRoute = typeRoutes[data.type] || '/read'
        router.replace(`${targetRoute}/${entryId.value}`)
        return
      }

      entry.value = data
    } catch (error_: unknown) {
      console.error('[ViewPage] Failed to fetch entry:', error_)

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
  "path": "/view/:id"
}
</route>
