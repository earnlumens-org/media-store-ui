<!--
  Collection Detail Page

  RESPONSIVE LAYOUT:
  - Mobile (< 960px): Single column with hero, controls, vertical item list
  - Desktop (>= 960px): Hero banner + content area with controls and dense list

  LOCKED CONTENT HANDLING:
  - If collection.locked === true, immediately redirect to /preview/:id
  - Individual locked items navigate to /preview/:id (never open modal)

  ITEM CLICK BEHAVIOR:
  - video -> router.push(/watch/:id)
  - audio -> open AudioPlayerDialog
  - image -> open ImageLightbox
  - entry (short ≤600) -> open EntryPreviewDialog
  - entry (long >600) -> router.push(/read/:id)
  - locked item -> router.push(/preview/:id)

  STATES:
  - Loading: Skeleton for hero + list placeholders
  - Error: Alert with retry/back
  - Not Found: Empty state with navigation
  - Success: Full collection view
-->
<template>
  <div>
    <!-- LOADING STATE -->
    <template v-if="loading">
      <!-- Hero Skeleton -->
      <v-sheet color="surface-variant" height="280">
        <v-container class="h-100 d-flex flex-column justify-end pa-4 pa-md-6">
          <v-skeleton-loader class="mb-2" type="heading" width="300" />
          <v-skeleton-loader type="text" width="150" />
          <div class="d-flex ga-2 mt-4">
            <v-skeleton-loader type="button" width="120" />
            <v-skeleton-loader type="button" width="100" />
          </div>
        </v-container>
      </v-sheet>

      <!-- Content Skeleton -->
      <v-container class="pa-4">
        <div class="d-flex ga-2 mb-4">
          <v-skeleton-loader type="chip" />
          <v-skeleton-loader type="chip" />
          <v-skeleton-loader type="chip" />
        </div>
        <v-skeleton-loader
          v-for="n in 6"
          :key="n"
          class="mb-2"
          type="list-item-avatar-two-line"
        />
      </v-container>
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
              <v-alert-title>Failed to load collection</v-alert-title>
              {{ errorMessage }}
            </v-alert>
            <div class="d-flex ga-2 justify-center">
              <v-btn
                color="primary"
                prepend-icon="mdi-refresh"
                variant="flat"
                @click="fetchCollection"
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
            <v-icon color="grey" size="120">mdi-folder-off-outline</v-icon>
            <h2 class="text-h5 mt-4 mb-2">Collection not found</h2>
            <p class="text-body-2 text-medium-emphasis mb-6">
              The collection you're looking for doesn't exist or has been removed.
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
    <template v-else-if="collection">
      <!-- Hero Section -->
      <v-sheet
        class="position-relative"
        :color="collection.coverUrl ? undefined : 'primary-darken-1'"
        :min-height="isMobile ? 280 : 300"
      >
        <!-- Cover Image -->
        <v-img
          v-if="collection.coverUrl"
          class="position-absolute w-100 h-100"
          cover
          :src="collection.coverUrl"
        >
          <template #placeholder>
            <v-sheet class="h-100 w-100" color="grey-darken-3" />
          </template>
        </v-img>

        <!-- Gradient Overlay -->
        <v-sheet
          class="position-absolute w-100 h-100"
          color="rgba(0, 0, 0, 0.6)"
        />

        <!-- Hero Content -->
        <v-container class="position-relative h-100 d-flex flex-column pa-4 pa-md-6 pb-6">
          <!-- Back Button (Mobile) -->
          <div class="d-md-none mb-auto">
            <v-btn
              aria-label="Go back"
              color="white"
              icon="mdi-arrow-left"
              variant="text"
              @click="goBack"
            />
          </div>

          <!-- Collection Info -->
          <div class="mt-auto">
            <!-- Back Button (Desktop) -->
            <v-btn
              aria-label="Go back"
              class="d-none d-md-inline-flex mb-2"
              color="white"
              prepend-icon="mdi-arrow-left"
              variant="text"
              @click="goBack"
            >
              Back
            </v-btn>

            <!-- Type Badge -->
            <v-chip
              class="mb-2"
              color="white"
              size="small"
              variant="tonal"
            >
              <v-icon size="14" start>mdi-folder-multiple</v-icon>
              {{ collection.collectionType || 'Collection' }}
            </v-chip>

            <!-- Title -->
            <h1 class="text-h4 text-md-h3 font-weight-bold text-white mb-1">
              {{ collection.title }}
            </h1>

            <!-- Author -->
            <div class="d-flex align-center mb-3">
              <v-avatar
                class="me-2"
                :image="collection.authorAvatarUrl"
                size="28"
              >
                <v-icon v-if="!collection.authorAvatarUrl" size="16">mdi-account</v-icon>
              </v-avatar>
              <span class="text-body-2 text-white">{{ collection.authorName }}</span>
            </div>

            <!-- Stats Row -->
            <div class="d-flex flex-wrap align-center ga-3 text-body-2 text-white text-medium-emphasis mb-4">
              <span v-if="collection.itemsCount">
                <v-icon class="me-1" size="16">mdi-format-list-bulleted</v-icon>
                {{ collection.itemsCount }} items
              </span>
              <span v-if="collection.totalDurationSec">
                <v-icon class="me-1" size="16">mdi-clock-outline</v-icon>
                {{ formatDuration(collection.totalDurationSec) }}
              </span>
              <span>
                <v-icon class="me-1" size="16">mdi-calendar</v-icon>
                {{ formatDate(collection.publishedAt) }}
              </span>
            </div>

            <!-- Actions -->
            <div class="d-flex flex-wrap ga-2">
              <v-btn
                color="primary"
                :prepend-icon="hasProgress ? 'mdi-play' : 'mdi-play-circle'"
                size="large"
                variant="flat"
                @click="startCollection"
              >
                {{ hasProgress ? 'Continue' : 'Start' }}
              </v-btn>
              <v-btn
                :aria-label="isSaved ? 'Remove from saved' : 'Save'"
                :color="isSaved ? 'primary' : 'white'"
                :icon="isSaved ? 'mdi-bookmark' : 'mdi-bookmark-outline'"
                variant="tonal"
                @click="toggleSave"
              />
              <v-btn
                aria-label="Share"
                color="white"
                icon="mdi-share-variant"
                variant="tonal"
                @click="onShare"
              />
            </div>
          </div>
        </v-container>
      </v-sheet>

      <!-- Tabs -->
      <v-tabs
        v-model="activeTab"
        bg-color="surface"
        color="primary"
        grow
      >
        <v-tab value="items">
          <v-icon start>mdi-format-list-bulleted</v-icon>
          Items
        </v-tab>
        <v-tab value="about">
          <v-icon start>mdi-information-outline</v-icon>
          About
        </v-tab>
      </v-tabs>

      <v-divider />

      <!-- Tab Content -->
      <v-tabs-window v-model="activeTab">
        <!-- Items Tab -->
        <v-tabs-window-item value="items">
          <v-container class="pa-4">
            <!-- Controls Row -->
            <div class="d-flex flex-wrap align-center ga-2 mb-4">
              <!-- Type Filter Chips -->
              <v-chip-group
                v-model="selectedType"
                class="flex-grow-1"
                mandatory
                selected-class="text-primary"
              >
                <v-chip
                  filter
                  size="small"
                  value="all"
                  variant="tonal"
                >
                  All
                </v-chip>
                <v-chip
                  v-for="type in uniqueTypes"
                  :key="type"
                  filter
                  size="small"
                  :value="type"
                  variant="tonal"
                >
                  <v-icon size="14" start>{{ getTypeIcon(type) }}</v-icon>
                  {{ capitalizeFirst(type) }}
                </v-chip>
              </v-chip-group>

              <!-- Search -->
              <v-text-field
                v-model="searchQuery"
                class="flex-grow-0"
                clearable
                density="compact"
                hide-details
                :max-width="isMobile ? '100%' : 250"
                placeholder="Search items..."
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
              />

              <!-- Sort Menu -->
              <v-menu>
                <template #activator="{ props: menuProps }">
                  <v-btn
                    v-bind="menuProps"
                    icon="mdi-sort"
                    variant="tonal"
                  />
                </template>
                <v-list density="compact">
                  <v-list-item
                    :active="sortBy === 'default'"
                    title="Default order"
                    @click="sortBy = 'default'"
                  />
                  <v-list-item
                    :active="sortBy === 'recent'"
                    title="Most recent"
                    @click="sortBy = 'recent'"
                  />
                  <v-list-item
                    :active="sortBy === 'title'"
                    title="Title A-Z"
                    @click="sortBy = 'title'"
                  />
                </v-list>
              </v-menu>
            </div>

            <!-- Items Loading -->
            <template v-if="itemsLoading">
              <v-skeleton-loader
                v-for="n in 6"
                :key="n"
                class="mb-2"
                type="list-item-avatar-two-line"
              />
            </template>

            <!-- Items Empty State -->
            <v-sheet
              v-else-if="filteredItems.length === 0"
              class="text-center pa-8"
              color="surface-variant"
              rounded="lg"
            >
              <v-icon color="grey" size="64">mdi-folder-open-outline</v-icon>
              <p class="text-body-1 mt-4">
                {{ searchQuery || selectedType !== 'all' ? 'No items match your filters' : 'This collection is empty' }}
              </p>
              <v-btn
                v-if="searchQuery || selectedType !== 'all'"
                class="mt-4"
                variant="text"
                @click="clearFilters"
              >
                Clear filters
              </v-btn>
            </v-sheet>

            <!-- Items List -->
            <v-list v-else class="pa-0 bg-transparent">
              <v-list-item
                v-for="(item, index) in filteredItems"
                :key="item.id"
                class="px-0 rounded-lg mb-1"
                @click="openItem(item)"
              >
                <template #prepend>
                  <!-- Index Number (Desktop) -->
                  <span class="d-none d-sm-flex text-body-2 text-medium-emphasis me-4" style="min-width: 24px;">
                    {{ index + 1 }}
                  </span>

                  <!-- Thumbnail -->
                  <v-avatar
                    class="rounded-lg me-3"
                    :color="getThumbnailColor(item.type)"
                    :image="item.thumbnailUrl"
                    :size="isMobile ? 56 : 64"
                  >
                    <v-icon v-if="!item.thumbnailUrl" :color="getTypeIconColor(item.type)">
                      {{ getTypeIcon(item.type) }}
                    </v-icon>
                  </v-avatar>
                </template>

                <!-- Content -->
                <v-list-item-title class="text-body-1 font-weight-medium">
                  {{ item.title }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  <v-icon class="me-1" size="12">{{ getTypeIcon(item.type) }}</v-icon>
                  {{ capitalizeFirst(item.type) }}
                  <span v-if="item.durationSec" class="ms-2">
                    · {{ formatItemDuration(item.durationSec) }}
                  </span>
                </v-list-item-subtitle>

                <template #append>
                  <!-- Lock Indicator -->
                  <v-icon v-if="item.locked" class="me-2" color="warning" size="20">
                    mdi-lock
                  </v-icon>

                  <!-- Play/Open Icon -->
                  <v-icon color="grey" size="20">
                    {{ getActionIcon(item) }}
                  </v-icon>
                </template>
              </v-list-item>
            </v-list>
          </v-container>
        </v-tabs-window-item>

        <!-- About Tab -->
        <v-tabs-window-item value="about">
          <v-container class="pa-4">
            <v-row>
              <v-col
                cols="12"
                lg="8"
                md="10"
              >
                <!-- Description -->
                <h2 class="text-h6 font-weight-bold mb-3">About this collection</h2>
                <p class="text-body-1 mb-6">
                  {{ collectionDescription }}
                </p>

                <!-- Author Card -->
                <v-card class="mb-4" variant="tonal">
                  <v-card-text class="d-flex align-center">
                    <v-avatar
                      class="me-4"
                      :image="collection.authorAvatarUrl"
                      size="56"
                    >
                      <v-icon v-if="!collection.authorAvatarUrl" size="28">mdi-account</v-icon>
                    </v-avatar>
                    <div class="flex-grow-1">
                      <h3 class="text-body-1 font-weight-medium">{{ collection.authorName }}</h3>
                      <p class="text-body-2 text-medium-emphasis">Creator</p>
                    </div>
                    <v-btn
                      color="primary"
                      rounded="pill"
                      variant="flat"
                    >
                      Follow
                    </v-btn>
                  </v-card-text>
                </v-card>

                <!-- Stats -->
                <v-card variant="outlined">
                  <v-list density="compact">
                    <v-list-item v-if="collection.itemsCount">
                      <template #prepend>
                        <v-icon>mdi-format-list-bulleted</v-icon>
                      </template>
                      <v-list-item-title>{{ collection.itemsCount }} items</v-list-item-title>
                    </v-list-item>
                    <v-list-item v-if="collection.totalDurationSec">
                      <template #prepend>
                        <v-icon>mdi-clock-outline</v-icon>
                      </template>
                      <v-list-item-title>{{ formatDuration(collection.totalDurationSec) }} total</v-list-item-title>
                    </v-list-item>
                    <v-list-item>
                      <template #prepend>
                        <v-icon>mdi-calendar</v-icon>
                      </template>
                      <v-list-item-title>Published {{ formatDate(collection.publishedAt) }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-card>
              </v-col>
            </v-row>
          </v-container>
        </v-tabs-window-item>
      </v-tabs-window>

      <!-- Audio Player Dialog -->
      <AudioPlayerDialog
        v-model="audioDialogOpen"
        :entry-id="selectedItemId"
      />

      <!-- Image Lightbox -->
      <ImageLightbox
        v-model="imageLightboxOpen"
        :entry-id="selectedItemId"
      />

      <!-- Entry Preview Dialog -->
      <EntryPreviewDialog
        v-model="entryDialogOpen"
        :entry-id="selectedItemId"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
  import type { CollectionModel, EntryModel } from '@/api/api'

  import { computed, onMounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'

  import { api } from '@/api/api'
  import AudioPlayerDialog from '@/components/entry/AudioPlayerDialog.vue'
  import EntryPreviewDialog from '@/components/entry/EntryPreviewDialog.vue'
  import ImageLightbox from '@/components/entry/ImageLightbox.vue'
  import { useAppStore } from '@/stores/app'

  const route = useRoute()
  const router = useRouter()
  const appStore = useAppStore()

  // Responsive check
  const isMobile = computed(() => appStore.mobileView)

  // Route param
  const collectionId = computed(() => {
    const params = route.params as { id?: string }
    return params.id ?? ''
  })

  // Collection State
  const collection = ref<CollectionModel | null>(null)
  const loading = ref(true)
  const error = ref(false)
  const notFound = ref(false)
  const errorMessage = ref('')

  // Items State
  const items = ref<EntryModel[]>([])
  const itemsLoading = ref(false)

  // UI State
  const activeTab = ref('items')
  const selectedType = ref('all')
  const searchQuery = ref('')
  const sortBy = ref<'default' | 'recent' | 'title'>('default')
  const isSaved = ref(false)
  const hasProgress = ref(false) // Would come from user progress API

  // Modal State
  const audioDialogOpen = ref(false)
  const imageLightboxOpen = ref(false)
  const entryDialogOpen = ref(false)
  const selectedItemId = ref('')

  // Mock description
  const collectionDescription = 'This collection brings together a curated selection of content designed to help you learn and explore new topics. Each item has been carefully selected to provide value and insight. Whether you\'re looking to expand your knowledge or simply enjoy quality content, this collection has something for everyone.'

  // Computed: Get unique types from items
  const uniqueTypes = computed(() => {
    const types = new Set(items.value.map(item => item.type))
    return Array.from(types)
  })

  // Computed: Filtered items based on type, search, and sort
  const filteredItems = computed(() => {
    let result = [...items.value]

    // Filter by type
    if (selectedType.value !== 'all') {
      result = result.filter(item => item.type === selectedType.value)
    }

    // Filter by search
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(item =>
        item.title.toLowerCase().includes(query)
        || item.authorName.toLowerCase().includes(query),
      )
    }

    // Sort
    if (sortBy.value === 'recent') {
      result.sort((a, b) => {
        const dateA = new Date(a.publishedAt).getTime()
        const dateB = new Date(b.publishedAt).getTime()
        return dateB - dateA
      })
    } else if (sortBy.value === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title))
    }

    return result
  })

  // Helpers
  function getTypeIcon (type: string): string {
    const icons: Record<string, string> = {
      video: 'mdi-play-circle',
      audio: 'mdi-music',
      image: 'mdi-image',
      entry: 'mdi-file-document',
    }
    return icons[type] || 'mdi-file'
  }

  function getTypeIconColor (type: string): string {
    const colors: Record<string, string> = {
      video: 'red',
      audio: 'purple',
      image: 'blue',
      entry: 'green',
    }
    return colors[type] || 'grey'
  }

  function getThumbnailColor (type: string): string {
    const colors: Record<string, string> = {
      video: 'red-lighten-4',
      audio: 'purple-lighten-4',
      image: 'blue-lighten-4',
      entry: 'green-lighten-4',
    }
    return colors[type] || 'grey-lighten-3'
  }

  function getActionIcon (item: EntryModel): string {
    if (item.locked) return 'mdi-lock'
    if (item.type === 'video') return 'mdi-play'
    if (item.type === 'audio') return 'mdi-play'
    if (item.type === 'image') return 'mdi-eye'
    return 'mdi-book-open-variant'
  }

  function capitalizeFirst (str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  function formatDuration (seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes} min`
  }

  function formatItemDuration (seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  function formatDate (date: string | Date): string {
    const d = date instanceof Date ? date : new Date(date)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  function clearFilters () {
    selectedType.value = 'all'
    searchQuery.value = ''
  }

  // Item click handler
  function openItem (item: EntryModel) {
    // Locked items always go to preview
    if (item.locked) {
      router.push(`/preview/${item.id}`)
      return
    }

    selectedItemId.value = item.id

    switch (item.type) {
      case 'video': {
        router.push(`/watch/${item.id}`)
        break
      }
      case 'audio': {
        audioDialogOpen.value = true
        break
      }
      case 'image': {
        imageLightboxOpen.value = true
        break
      }
      case 'entry': {
        // Short/Long threshold: ≤600 chars = modal, >600 = page
        // Since we don't have content length, default to modal for quick preview
        // In production, check item.content?.length
        entryDialogOpen.value = true
        break
      }
      default: {
        router.push(`/read/${item.id}`)
      }
    }
  }

  // Actions
  function startCollection () {
    // Start with first item
    const firstItem = filteredItems.value[0]
    if (firstItem) {
      openItem(firstItem)
    }
  }

  function toggleSave () {
    isSaved.value = !isSaved.value
  }

  function onShare () {
    if (navigator.share) {
      navigator.share({
        title: collection.value?.title,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
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

  // Fetch collection data
  async function fetchCollection () {
    loading.value = true
    error.value = false
    notFound.value = false
    errorMessage.value = ''

    try {
      const data = await api.mock.getCollectionById(collectionId.value)

      // LOCKED COLLECTION REDIRECT
      if (data.locked) {
        router.replace(`/preview/${collectionId.value}`)
        return
      }

      collection.value = data

      // Fetch items after collection loads
      fetchItems()
    } catch (error_: unknown) {
      console.error('[CollectionPage] Failed to fetch collection:', error_)

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

  // Fetch collection items (simulated with entries API)
  async function fetchItems () {
    itemsLoading.value = true

    try {
      // Since there's no collection items endpoint, use entries as mock items
      const response = await api.mock.getEntries({ size: 12 })

      items.value = response.items
        .filter(item => item.kind === 'entry')
        .map(item => (item as { kind: 'entry', entry: EntryModel }).entry)
    } catch (error_: unknown) {
      console.error('[CollectionPage] Failed to fetch items:', error_)
      // Don't set error state for items, just show empty
      items.value = []
    } finally {
      itemsLoading.value = false
    }
  }

  // Watch for route changes
  watch(collectionId, () => {
    if (collectionId.value) {
      fetchCollection()
    }
  })

  // Initial load
  onMounted(() => {
    fetchCollection()
  })
</script>

<route lang="json">
{
  "path": "/collection/:id"
}
</route>
