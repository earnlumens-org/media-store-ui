<!--
  Read Detail Page (Resource)

  RESPONSIVE LAYOUT:
  - Mobile (< 960px): Single column with toolbar, content stacked vertically
  - Desktop (>= 960px): Centered reading column with optional right sidebar

  LOCKED CONTENT HANDLING:
  - If entry.locked === true, immediately redirect to /preview/:id
  - This ensures paid content is never accidentally shown on the read page

  CONTENT RENDERING:
  - description: Short metadata description (shown below title)
  - resourceContent: Full article body text (main reading area)
  - asset: Attached file with download button, served via CDN /media/:entryId

  STATES:
  - Loading: Skeleton placeholders for all sections
  - Error: Alert with retry button
  - Not Found: Empty state with navigation options
  - Success: Full reading view with optional attachment download
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
        :aria-label="$t('Common.goBack')"
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
            <v-list-item prepend-icon="mdi-bookmark-outline" :title="$t('Common.saveToCollection')" />
            <v-list-item prepend-icon="mdi-flag" :title="$t('Common.report')" @click="reportDialog = true" />
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
              <v-alert-title>{{ $t('Common.failedToLoadEntry') }}</v-alert-title>
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
            <v-icon color="grey" size="120">mdi-file-document-remove-outline</v-icon>
            <h2 class="text-h5 mt-4 mb-2">{{ $t('Common.entryNotFound') }}</h2>
            <p class="text-body-2 text-medium-emphasis mb-6">
              {{ $t('Common.entryNotFoundDescription') }}
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
                :aria-label="$t('Common.goBack')"
                class="me-2"
                density="comfortable"
                icon="mdi-arrow-left"
                variant="text"
                @click="goBack"
              />
              <v-spacer />
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
                  <v-list-item prepend-icon="mdi-bookmark-outline" :title="$t('Common.saveToCollection')" />
                  <v-list-item prepend-icon="mdi-flag" :title="$t('Common.report')" @click="reportDialog = true" />
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
            <v-sheet class="d-flex align-center pa-3 rounded-lg mb-6" color="surface">
              <router-link class="me-3 flex-shrink-0" :to="`/${entry.authorName}`">
                <v-avatar size="48">
                  <v-img
                    v-if="avatarUrl"
                    cover
                    :src="avatarUrl"
                    @error="avatarBroken = true"
                  />
                  <v-icon v-else>mdi-account</v-icon>
                </v-avatar>
              </router-link>
              <div class="flex-grow-1" style="min-width: 0">
                <div class="d-flex align-center">
                  <router-link class="text-body-1 font-weight-medium text-truncate text-decoration-none" style="color: inherit" :to="`/${entry.authorName}`">{{ entry.authorName }}</router-link>
                  <v-avatar
                    v-if="entryBadgeSrc"
                    class="ms-1 flex-shrink-0"
                    color="transparent"
                    size="18"
                  >
                    <v-img :src="entryBadgeSrc" />
                  </v-avatar>
                </div>
                <span class="text-body-2 text-medium-emphasis">{{ $t('Common.creator') }}</span>
              </div>
              <CxSubscribeButton
                v-if="entry.authorId"
                class="flex-shrink-0 ms-2"
                :size="$vuetify.display.smAndDown ? 'small' : 'default'"
                :target-user-id="entry.authorId"
              />
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

            <!-- Description (short metadata blurb) -->
            <p
              v-if="entry.description"
              class="text-body-1 text-medium-emphasis mb-6"
            >
              {{ entry.description }}
            </p>

            <!-- ═══ ATTACHMENT DOWNLOAD CARD ═══ -->
            <v-card
              v-if="entry.asset"
              class="mb-6 attachment-card"
              variant="outlined"
            >
              <div class="d-flex align-center pa-4">
                <v-avatar
                  class="me-4 flex-shrink-0"
                  color="primary"
                  rounded="lg"
                  size="48"
                >
                  <v-icon color="on-primary" size="24">{{ fileIcon }}</v-icon>
                </v-avatar>
                <div class="flex-grow-1 min-width-0">
                  <div class="text-body-1 font-weight-medium text-truncate">
                    {{ entry.asset.fileName }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ formatFileSize(entry.asset.fileSizeBytes) }}
                    <span class="mx-1">&middot;</span>
                    {{ friendlyContentType(entry.asset.contentType) }}
                  </div>
                </div>
                <v-btn
                  class="ms-3 flex-shrink-0"
                  color="primary"
                  :href="downloadUrl"
                  prepend-icon="mdi-download"
                  rounded="pill"
                  target="_blank"
                  variant="elevated"
                >
                  {{ $t('Common.download') }}
                </v-btn>
              </div>
            </v-card>

            <!-- ═══ ARTICLE BODY (resourceContent) ═══ -->
            <article v-if="hasResourceContent" class="mb-6">
              <v-divider v-if="entry.asset" class="mb-6" />
              <div
                class="text-body-1 resource-body"
                v-html="formattedContent"
              />
            </article>

            <!-- Empty state: no content at all -->
            <v-alert
              v-if="!hasResourceContent && !entry.asset"
              class="mb-6"
              icon="mdi-text-box-outline"
              type="info"
              variant="tonal"
            >
              {{ $t('Common.entryNotFoundDescription') }}
            </v-alert>

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
              <CxFavoriteButton
                :item-id="entryId"
                item-type="ENTRY"
                variant="tonal"
              />
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
            </div>

            <!-- Mobile: Related Entries -->
            <div class="d-lg-none">
              <h2 class="text-subtitle-1 font-weight-bold mb-4">
                {{ $t('Common.moreToRead') }}
              </h2>
              <ReadRecommendationsList :author-name="entry.authorName" :exclude-id="entryId" />
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
            <v-card class="mb-4" color="surface" variant="flat">
              <v-card-text class="text-center">
                <router-link :to="`/${entry.authorName}`">
                  <v-avatar
                    class="mb-3"
                    size="64"
                  >
                    <v-img
                      v-if="avatarUrl"
                      cover
                      :src="avatarUrl"
                      @error="avatarBroken = true"
                    />
                    <v-icon v-else size="32">mdi-account</v-icon>
                  </v-avatar>
                </router-link>
                <div class="d-flex align-center">
                  <router-link class="text-body-1 font-weight-medium text-truncate text-decoration-none" style="color: inherit" :to="`/${entry.authorName}`">{{ entry.authorName }}</router-link>
                  <v-avatar
                    v-if="entryBadgeSrc"
                    class="ms-1 flex-shrink-0"
                    color="transparent"
                    size="18"
                  >
                    <v-img :src="entryBadgeSrc" />
                  </v-avatar>
                </div>
                <p class="text-body-2 text-medium-emphasis">{{ $t('Common.creator') }}</p>
                <CxSubscribeButton
                  v-if="entry.authorId"
                  class="mt-3"
                  :target-user-id="entry.authorId"
                  variant="block"
                />
              </v-card-text>
            </v-card>

            <!-- Related Entries -->
            <h2 class="text-subtitle-1 font-weight-bold mb-4">
              {{ $t('Common.moreToRead') }}
            </h2>
            <ReadRecommendationsList :author-name="entry.authorName" :exclude-id="entryId" />
          </v-container>
        </v-col>
      </v-row>
    </template>
  </div>

  <ReportDialog v-model="reportDialog" :entry-id="entryId" />
</template>

<script setup lang="ts">
  import type { PublicEntryModel } from '@/api/types/entry.types'

  import { computed, onMounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'

  import { api } from '@/api/api'
  import CxFavoriteButton from '@/components/CxFavoriteButton.vue'
  import CxSubscribeButton from '@/components/CxSubscribeButton.vue'
  import ReportDialog from '@/components/report/ReportDialog.vue'
  import { useAppStore } from '@/stores/app'
  import { usePurchasesStore } from '@/stores/purchases'
  import { cdnMediaUrl } from '@/config/env'
  import { formatFileSize } from '@/api/types/upload.types'
  import { getProfileBadgeSrc } from '@/lib/profileBadge'

  import ReadRecommendationsList from './ReadRecommendationsList.vue'

  const route = useRoute()
  const router = useRouter()
  const purchasesStore = usePurchasesStore()
  const appStore = useAppStore()

  // Responsive check
  const isMobile = computed(() => appStore.mobileView)

  // Route param
  const entryId = computed(() => {
    const params = route.params as { id?: string }
    return params.id ?? ''
  })

  // State
  const entry = ref<PublicEntryModel | null>(null)
  const entryBadgeSrc = computed(() => getProfileBadgeSrc(entry.value?.profileBadge))
  const loading = ref(true)
  const error = ref(false)
  const notFound = ref(false)
  const errorMessage = ref('')

  // UI State
  const avatarBroken = ref(false)
  const reportDialog = ref(false)

  /** Avatar URL — cleared when the OAuth provider image fails to load */
  const avatarUrl = computed(() =>
    avatarBroken.value ? undefined : entry.value?.authorAvatarUrl,
  )

  // Real data from entry
  const tags = computed(() => entry.value?.tags ?? [])

  // Whether the entry has article text content
  const hasResourceContent = computed(() => {
    const raw = entry.value?.resourceContent ?? ''
    return raw.trim().length > 0
  })

  // Format resourceContent with line breaks preserved
  const formattedContent = computed(() => {
    const raw = entry.value?.resourceContent ?? ''
    // Escape HTML to prevent XSS, then convert line breaks
    const escaped = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    return escaped.replace(/\n\n/g, '</p><p class="mt-4">').replace(/\n/g, '<br>')
  })

  // Download URL for the attached file (via CDN worker with entitlement)
  const downloadUrl = computed(() => {
    if (!entry.value) return ''
    return cdnMediaUrl(entry.value.id)
  })

  // File icon based on content type
  const fileIcon = computed(() => {
    const ct = entry.value?.asset?.contentType ?? ''
    if (ct.startsWith('application/pdf')) return 'mdi-file-pdf-box'
    if (ct.startsWith('image/')) return 'mdi-file-image'
    if (ct.startsWith('video/')) return 'mdi-file-video'
    if (ct.startsWith('audio/')) return 'mdi-file-music'
    if (ct.includes('zip') || ct.includes('rar') || ct.includes('tar') || ct.includes('gzip')) return 'mdi-folder-zip'
    if (ct.includes('spreadsheet') || ct.includes('excel') || ct.includes('csv')) return 'mdi-file-table'
    if (ct.includes('presentation') || ct.includes('powerpoint')) return 'mdi-file-presentation-box'
    if (ct.includes('word') || ct.includes('document') || ct.includes('rtf')) return 'mdi-file-word'
    if (ct.startsWith('text/')) return 'mdi-file-document'
    return 'mdi-file'
  })

  // Human-readable content type label
  function friendlyContentType (contentType: string): string {
    const ct = contentType.toLowerCase()
    if (ct === 'application/pdf') return 'PDF'
    if (ct.includes('zip')) return 'ZIP'
    if (ct.includes('rar')) return 'RAR'
    if (ct.includes('spreadsheet') || ct.includes('excel')) return 'Excel'
    if (ct.includes('word') || ct.includes('msword')) return 'Word'
    if (ct.includes('powerpoint') || ct.includes('presentation')) return 'PowerPoint'
    if (ct.startsWith('image/')) return ct.replace('image/', '').toUpperCase()
    if (ct.startsWith('video/')) return ct.replace('video/', '').toUpperCase()
    if (ct.startsWith('audio/')) return ct.replace('audio/', '').toUpperCase()
    if (ct.startsWith('text/')) return ct.replace('text/', '').toUpperCase()
    // Extract subtype from MIME
    const parts = ct.split('/')
    return parts.length > 1 ? parts[1]!.toUpperCase() : ct.toUpperCase()
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
      const data = await api.entries.getById(entryId.value)

      // LOCKED CONTENT: verify entitlement server-side
      if (data.isPaid) {
        const { verifyEntitlement } = await import('@/lib/verifyEntitlement')
        const hasAccess = await verifyEntitlement(entryId.value)
        if (!hasAccess) {
          purchasesStore.removeUnlock(entryId.value)
          router.replace(`/preview/${entryId.value}`)
          return
        }
        // Ensure the store reflects the entitlement (e.g. collection purchase)
        if (!purchasesStore.isUnlocked(entryId.value)) {
          purchasesStore.markUnlocked(entryId.value, { type: data.type, title: data.title })
        }
      }

      // Validate entry type is resource (text/resource)
      if (data.type !== 'resource') {
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
      avatarBroken.value = false
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

<style scoped>
  .resource-body {
    line-height: 1.8;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .resource-body :deep(p) {
    margin-bottom: 0;
  }

  .attachment-card {
    transition: border-color 0.2s ease;
  }

  .attachment-card:hover {
    border-color: rgb(var(--v-theme-primary));
  }

  .min-width-0 {
    min-width: 0;
  }
</style>

<route lang="json">
{
  "path": "/read/:id"
}
</route>
