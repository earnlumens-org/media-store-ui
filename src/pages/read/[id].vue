<!--
  Read Detail Page (Entry/Post)

  RESPONSIVE LAYOUT:
  - Mobile (< 960px): Single column with toolbar, content stacked vertically
  - Desktop (>= 960px): Centered reading column with optional right sidebar

  LOCKED CONTENT HANDLING:
  - If entry.locked === true, immediately redirect to /preview/:id
  - This ensures paid content is never accidentally shown on the read page

  SHORT/LONG THRESHOLD:
  - This page is the destination for LONG entries (> 600 characters)
  - For SHORT entries, use EntryPreviewDialog modal instead

  STATES:
  - Loading: Skeleton placeholders for all sections
  - Error: Alert with retry button
  - Not Found: Empty state with navigation options
  - Success: Full reading view
-->
<template>
  <div>
    <!-- MOBILE: Top Toolbar (visible on xs/sm only) -->
    <v-toolbar
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

      <v-toolbar-title v-if="entry" class="text-body-1">
        {{ entry.title }}
      </v-toolbar-title>
      <v-toolbar-title v-else>
        <v-skeleton-loader type="text" width="200" />
      </v-toolbar-title>

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
            <v-list-item prepend-icon="mdi-bookmark-outline" title="Save" />
            <v-list-item prepend-icon="mdi-flag" title="Report" />
          </v-list>
        </v-menu>
      </template>
    </v-toolbar>

    <!-- LOADING STATE -->
    <template v-if="loading">
      <v-row class="ma-0" justify="center" no-gutters>
        <!-- Main Reading Column -->
        <v-col
          cols="12"
          lg="7"
          md="8"
          xl="6"
        >
          <v-container class="pa-4 pa-md-6">
            <!-- Title Skeleton -->
            <v-skeleton-loader class="mb-2" type="heading" />
            <v-skeleton-loader class="mb-4" type="text" width="150" />

            <!-- Author Skeleton -->
            <div class="d-flex align-center mb-6">
              <v-skeleton-loader class="me-3" type="avatar" />
              <div>
                <v-skeleton-loader type="text" width="120" />
                <v-skeleton-loader class="mt-1" type="text" width="80" />
              </div>
            </div>

            <!-- Content Skeleton -->
            <v-skeleton-loader type="paragraph" />
            <v-skeleton-loader class="mt-4" type="paragraph" />
            <v-skeleton-loader class="mt-4" type="paragraph" />
          </v-container>
        </v-col>

        <!-- Right Sidebar (Desktop only) -->
        <v-col
          class="d-none d-lg-block"
          cols="12"
          lg="3"
          xl="3"
        >
          <v-container class="pa-4">
            <v-skeleton-loader class="mb-4" type="card" />
            <v-skeleton-loader type="list-item-two-line" />
            <v-skeleton-loader type="list-item-two-line" />
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
              <v-alert-title>Failed to load entry</v-alert-title>
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
            <v-icon color="grey" size="120">mdi-file-document-remove-outline</v-icon>
            <h2 class="text-h5 mt-4 mb-2">Entry not found</h2>
            <p class="text-body-2 text-medium-emphasis mb-6">
              The entry you're looking for doesn't exist or has been removed.
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
      <v-row class="ma-0" justify="center" no-gutters>
        <!-- Main Reading Column -->
        <v-col
          cols="12"
          lg="7"
          md="8"
          xl="6"
        >
          <v-container class="pa-4 pa-md-6">
            <!-- Desktop: Back button + Actions -->
            <div class="d-none d-md-flex align-center mb-4">
              <v-btn
                aria-label="Go back"
                class="me-2"
                density="comfortable"
                icon="mdi-arrow-left"
                variant="text"
                @click="goBack"
              />
              <v-spacer />
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
                  <v-list-item prepend-icon="mdi-bookmark-outline" title="Save" />
                  <v-list-item prepend-icon="mdi-flag" title="Report" />
                </v-list>
              </v-menu>
            </div>

            <!-- Title -->
            <h1 class="text-h4 text-md-h3 font-weight-bold mb-2">
              {{ entry.title }}
            </h1>

            <!-- Date -->
            <p class="text-body-2 text-medium-emphasis mb-4">
              {{ formatDate(entry.publishedAt) }}
            </p>

            <!-- Author Block -->
            <v-sheet class="d-flex align-center pa-3 rounded-lg mb-6" color="surface-variant">
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
                <span class="text-body-2 text-medium-emphasis">Writer</span>
              </div>
              <v-btn
                color="primary"
                rounded="pill"
                variant="flat"
              >
                Follow
              </v-btn>
            </v-sheet>

            <!-- Featured Image (if exists) -->
            <v-img
              v-if="entry.thumbnailUrl"
              class="rounded-lg mb-6"
              cover
              :height="isMobile ? 200 : 350"
              :src="entry.thumbnailUrl"
            >
              <template #placeholder>
                <v-sheet
                  class="h-100 d-flex align-center justify-center"
                  color="grey-lighten-3"
                >
                  <v-progress-circular indeterminate />
                </v-sheet>
              </template>
            </v-img>

            <!-- Content -->
            <article class="mb-6">
              <div
                class="text-body-1"
                v-html="formattedContent"
              />
            </article>

            <!-- Tags -->
            <div v-if="tags.length > 0" class="d-flex flex-wrap ga-2 mb-6">
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

            <!-- Actions -->
            <v-divider class="mb-4" />
            <div class="d-flex flex-wrap ga-2 mb-6">
              <v-btn
                :aria-label="isLiked ? 'Unlike' : 'Like'"
                :color="isLiked ? 'primary' : undefined"
                :prepend-icon="isLiked ? 'mdi-heart' : 'mdi-heart-outline'"
                rounded="pill"
                variant="tonal"
                @click="toggleLike"
              >
                {{ formatCount(likes) }}
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
                aria-label="Share"
                class="d-md-none"
                prepend-icon="mdi-share-variant"
                rounded="pill"
                variant="tonal"
                @click="onShare"
              >
                Share
              </v-btn>
            </div>

            <!-- Mobile: Related Entries -->
            <div class="d-lg-none">
              <h2 class="text-subtitle-1 font-weight-bold mb-4">
                More to read
              </h2>
              <ReadRecommendationsList :exclude-id="entryId" />
            </div>
          </v-container>
        </v-col>

        <!-- Right Sidebar (Desktop only) -->
        <v-col
          class="d-none d-lg-block"
          cols="12"
          lg="3"
          xl="3"
        >
          <v-container class="pa-4 position-sticky" style="top: 80px;">
            <!-- Author Card -->
            <v-card class="mb-4" variant="tonal">
              <v-card-text class="text-center">
                <v-avatar
                  class="mb-3"
                  color="grey-lighten-2"
                  :image="entry.authorAvatarUrl"
                  size="64"
                >
                  <v-icon v-if="!entry.authorAvatarUrl" size="32">mdi-account</v-icon>
                </v-avatar>
                <h3 class="text-body-1 font-weight-medium">{{ entry.authorName }}</h3>
                <p class="text-body-2 text-medium-emphasis">Writer &amp; Creator</p>
                <v-btn
                  block
                  class="mt-3"
                  color="primary"
                  rounded="pill"
                  variant="flat"
                >
                  Follow
                </v-btn>
              </v-card-text>
            </v-card>

            <!-- Related Entries -->
            <h2 class="text-subtitle-1 font-weight-bold mb-4">
              More to read
            </h2>
            <ReadRecommendationsList :exclude-id="entryId" />
          </v-container>
        </v-col>
      </v-row>
    </template>
  </div>
</template>

<script setup lang="ts">
  import type { EntryModel } from '@/api/api'

  import { computed, onMounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'

  import { api } from '@/api/api'
  import { useAppStore } from '@/stores/app'

  import ReadRecommendationsList from './ReadRecommendationsList.vue'

  const route = useRoute()
  const router = useRouter()
  const appStore = useAppStore()

  // Responsive check
  const isMobile = computed(() => appStore.mobileView)

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
  const isLiked = ref(false)
  const isSaved = ref(false)
  const likes = ref(127)

  // Mock content (since Entry model doesn't have content field yet)
  const mockContent = `This is a comprehensive guide to understanding modern web development practices and techniques. In this article, we'll explore the fundamental concepts that every developer should know.

<strong>Introduction</strong>

Web development has evolved significantly over the past decade. What once required simple HTML and CSS now demands a deep understanding of JavaScript frameworks, build tools, and deployment strategies.

<strong>The Foundation</strong>

Before diving into frameworks and libraries, it's essential to have a solid grasp of the core technologies:

• HTML5 for semantic structure
• CSS3 for styling and animations
• JavaScript ES6+ for interactivity

<strong>Modern Frameworks</strong>

Today's web applications are built using powerful frameworks that provide structure and efficiency. Vue.js, React, and Angular are among the most popular choices, each with its own strengths and use cases.

<strong>Best Practices</strong>

Following best practices ensures your code is maintainable, scalable, and performant:

1. Write clean, readable code
2. Use version control (Git)
3. Test your applications
4. Optimize for performance
5. Consider accessibility

<strong>Conclusion</strong>

Web development is a constantly evolving field. Stay curious, keep learning, and don't be afraid to experiment with new technologies. The best developers are those who never stop growing.

Thank you for reading! If you found this helpful, consider following for more content like this.`

  // Tags
  const tags = ['webdev', 'javascript', 'tutorial', 'programming']

  // Format content with line breaks preserved
  const formattedContent = computed(() => {
    return mockContent.replace(/\n\n/g, '</p><p class="mt-4">').replace(/\n/g, '<br>')
  })

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
      month: 'long',
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
      // Force type 'entry' for this page
      const data = await api.mock.getEntryById(entryId.value, 'entry')

      // LOCKED CONTENT REDIRECT
      if (data.locked) {
        router.replace(`/preview/${entryId.value}`)
        return
      }

      // Validate entry type is entry (text post)
      if (data.type !== 'entry') {
        const typeRoutes: Record<string, string> = {
          video: '/watch',
          audio: '/listen',
          image: '/view',
        }
        const targetRoute = typeRoutes[data.type] || '/read'
        router.replace(`${targetRoute}/${entryId.value}`)
        return
      }

      entry.value = data
    } catch (error_: unknown) {
      console.error('[ReadPage] Failed to fetch entry:', error_)

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
  "path": "/read/:id"
}
</route>
