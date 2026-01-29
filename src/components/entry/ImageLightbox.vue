<!--
  Image Lightbox Component

  RESPONSIVE BEHAVIOR:
  - Mobile + Desktop: Fullscreen v-dialog with proper back/close behavior
  - Supports gallery navigation with optional galleryIds + currentIndex props

  LOCKED CONTENT:
  - If entry.locked === true, shows blurred placeholder with lock icon and CTA
  - CTA navigates to /preview/:id

  GALLERY NAVIGATION:
  - Optional galleryIds + currentIndex props for multi-image navigation
  - Desktop: Arrow buttons on sides
  - Mobile: Arrow buttons (swipe optional, not implemented here)
-->
<template>
  <v-dialog
    v-model="isOpen"
    content-class="bg-black"
    fullscreen
    :scrim="false"
    transition="dialog-bottom-transition"
  >
    <v-card class="d-flex flex-column h-100" color="black" rounded="0">
      <!-- Top App Bar -->
      <v-app-bar color="transparent" density="compact" flat>
        <v-btn
          aria-label="Close"
          color="white"
          icon="mdi-close"
          variant="text"
          @click="close"
        />

        <v-app-bar-title v-if="entry" class="text-body-1 text-white">
          <span class="text-truncate">{{ entry.title }}</span>
        </v-app-bar-title>
        <v-app-bar-title v-else-if="loading">
          <v-skeleton-loader color="grey-darken-3" type="text" width="200" />
        </v-app-bar-title>

        <template #append>
          <!-- Author avatar (if available) -->
          <template v-if="entry && !loading && !error">
            <v-avatar
              v-if="entry.authorAvatarUrl"
              class="me-2"
              :image="entry.authorAvatarUrl"
              size="32"
            />
            <span class="text-body-2 text-white text-medium-emphasis me-2 d-none d-sm-inline">
              {{ entry.authorName }}
            </span>

            <!-- Share button -->
            <v-btn
              :aria-label="$t('Common.share')"
              color="white"
              icon="mdi-share-variant"
              variant="text"
              @click="onShare"
            />

            <!-- More options menu -->
            <v-menu>
              <template #activator="{ props: menuProps }">
                <v-btn
                  v-bind="menuProps"
                  :aria-label="$t('Common.moreOptions')"
                  color="white"
                  icon="mdi-dots-vertical"
                  variant="text"
                />
              </template>
              <v-list density="compact">
                <v-list-item
                  prepend-icon="mdi-open-in-new"
                  :title="$t('Common.viewDetails')"
                  @click="openDetails"
                />
                <v-list-item prepend-icon="mdi-download" :title="$t('Common.download')" />
                <v-list-item prepend-icon="mdi-flag" :title="$t('Common.report')" />
              </v-list>
            </v-menu>
          </template>
        </template>
      </v-app-bar>

      <!-- Main Content Area -->
      <v-card-text class="flex-grow-1 pa-0 d-flex align-center justify-center position-relative">
        <!-- Loading State -->
        <template v-if="loading">
          <v-progress-circular color="white" indeterminate size="64" />
        </template>

        <!-- Error State -->
        <template v-else-if="error">
          <v-sheet
            class="text-center pa-6 rounded-lg"
            color="grey-darken-4"
            max-width="400"
          >
            <v-icon color="error" size="64">mdi-alert-circle-outline</v-icon>
            <p class="text-body-1 text-white mt-4">{{ errorMessage }}</p>
            <div class="d-flex ga-2 justify-center mt-4">
              <v-btn
                color="primary"
                prepend-icon="mdi-refresh"
                variant="flat"
                @click="fetchEntry"
              >
                Retry
              </v-btn>
              <v-btn
                color="white"
                variant="outlined"
                @click="close"
              >
                Close
              </v-btn>
            </div>
          </v-sheet>
        </template>

        <!-- Locked Content State -->
        <template v-else-if="entry?.locked">
          <v-sheet
            class="text-center pa-6 pa-md-10 rounded-xl position-relative overflow-hidden"
            color="grey-darken-4"
            max-width="500"
          >
            <!-- Blurred background placeholder -->
            <v-img
              v-if="entry.thumbnailUrl"
              class="position-absolute w-100 h-100"
              cover
              :src="entry.thumbnailUrl"
              style="top: 0; left: 0; filter: blur(20px); opacity: 0.3;"
            />

            <!-- Content overlay -->
            <div class="position-relative">
              <v-icon color="white" size="80">mdi-lock</v-icon>

              <h2 class="text-h5 text-white mt-4">{{ entry.title }}</h2>
              <p class="text-body-2 text-medium-emphasis text-grey-lighten-1 mt-2">
                by {{ entry.authorName }}
              </p>

              <v-alert
                class="mt-6 text-left"
                density="compact"
                type="info"
                variant="tonal"
              >
                This image is premium content. Preview and unlock to view the full resolution.
              </v-alert>

              <v-btn
                block
                class="mt-6"
                color="primary"
                prepend-icon="mdi-eye"
                size="large"
                variant="flat"
                @click="navigateToPreview"
              >
                Preview &amp; Buy
              </v-btn>
            </div>
          </v-sheet>
        </template>

        <!-- Success State - Full Image -->
        <template v-else-if="entry">
          <!-- Navigation: Previous (Desktop) -->
          <v-btn
            v-if="hasGallery && canGoPrev"
            aria-label="Previous image"
            class="position-absolute"
            color="white"
            icon="mdi-chevron-left"
            size="large"
            style="left: 16px; z-index: 1;"
            variant="tonal"
            @click="goPrev"
          />

          <!-- Image Container -->
          <v-img
            class="ma-4"
            contain
            :max-height="imageMaxHeight"
            max-width="100%"
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
                <v-icon color="grey" size="64">mdi-image-broken</v-icon>
                <span class="text-body-2 text-grey mt-2">Failed to load image</span>
              </v-sheet>
            </template>
          </v-img>

          <!-- Navigation: Next (Desktop) -->
          <v-btn
            v-if="hasGallery && canGoNext"
            aria-label="Next image"
            class="position-absolute"
            color="white"
            icon="mdi-chevron-right"
            size="large"
            style="right: 16px; z-index: 1;"
            variant="tonal"
            @click="goNext"
          />
        </template>
      </v-card-text>

      <!-- Footer (optional metadata) -->
      <v-sheet
        v-if="entry && !loading && !error && !entry.locked"
        class="pa-4"
        color="rgba(0, 0, 0, 0.7)"
      >
        <div class="d-flex flex-wrap align-center justify-space-between ga-2">
          <!-- Description snippet -->
          <div class="flex-grow-1">
            <p
              v-if="description"
              class="text-body-2 text-white text-truncate"
              style="max-width: 600px;"
            >
              {{ description }}
            </p>
          </div>

          <!-- Tags -->
          <div v-if="tags.length > 0" class="d-flex ga-1 flex-wrap">
            <v-chip
              v-for="tag in tags.slice(0, 5)"
              :key="tag"
              color="white"
              size="small"
              variant="outlined"
            >
              {{ tag }}
            </v-chip>
          </div>

          <!-- Gallery indicator -->
          <div v-if="hasGallery" class="text-body-2 text-grey-lighten-1">
            {{ currentIndexDisplay }} / {{ galleryIds.length }}
          </div>
        </div>
      </v-sheet>

      <!-- Mobile Navigation Bar (when in gallery mode) -->
      <v-sheet
        v-if="hasGallery && entry && !loading && !error && !entry.locked"
        class="d-flex d-md-none justify-center ga-4 pa-3"
        color="black"
      >
        <v-btn
          :disabled="!canGoPrev"
          icon="mdi-chevron-left"
          size="large"
          variant="tonal"
          @click="goPrev"
        />
        <v-btn
          :disabled="!canGoNext"
          icon="mdi-chevron-right"
          size="large"
          variant="tonal"
          @click="goNext"
        />
      </v-sheet>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { EntryModel } from '@/api/api'

  import { computed, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'

  import { api } from '@/api/api'

  interface Props {
    modelValue: boolean
    entryId: string
    /** Optional gallery of entry IDs for multi-image navigation */
    galleryIds?: string[]
    /** Current index in the gallery */
    currentIndex?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    galleryIds: () => [],
    currentIndex: 0,
  })

  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'update:currentIndex': [value: number]
  }>()

  const router = useRouter()

  // Dialog state
  const isOpen = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value),
  })

  // Data state
  const entry = ref<EntryModel | null>(null)
  const loading = ref(false)
  const error = ref(false)
  const errorMessage = ref('')

  // Mock data (since Entry model may not have these)
  const description = 'A stunning photograph capturing the essence of the moment.'
  const tags = ['photography', 'art', 'digital']

  // Computed
  const hasGallery = computed(() => props.galleryIds.length > 1)
  const canGoPrev = computed(() => props.currentIndex > 0)
  const canGoNext = computed(() => props.currentIndex < props.galleryIds.length - 1)
  const currentIndexDisplay = computed(() => props.currentIndex + 1)
  const imageMaxHeight = computed(() => 'calc(100vh - 180px)')

  // Active entry ID (either from prop or from gallery)
  const activeEntryId = computed(() => {
    if (hasGallery.value && props.galleryIds[props.currentIndex]) {
      return props.galleryIds[props.currentIndex]
    }
    return props.entryId
  })

  // Fetch entry data
  async function fetchEntry () {
    const id = activeEntryId.value
    if (!id) return

    loading.value = true
    error.value = false
    errorMessage.value = ''

    try {
      // Force type 'image' for this component
      const data = await api.mock.getEntryById(id, 'image')
      entry.value = data
    } catch (error_: unknown) {
      console.error('[ImageLightbox] Failed to fetch entry:', error_)
      error.value = true
      errorMessage.value = error_ instanceof Error ? error_.message : 'Failed to load image'
    } finally {
      loading.value = false
    }
  }

  // Navigation
  function close () {
    isOpen.value = false
  }

  function openDetails () {
    if (entry.value) {
      close()
      router.push(`/view/${entry.value.id}`)
    }
  }

  function navigateToPreview () {
    if (entry.value) {
      close()
      router.push(`/preview/${entry.value.id}`)
    }
  }

  function goPrev () {
    if (canGoPrev.value) {
      emit('update:currentIndex', props.currentIndex - 1)
    }
  }

  function goNext () {
    if (canGoNext.value) {
      emit('update:currentIndex', props.currentIndex + 1)
    }
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

  // Keyboard navigation
  function handleKeydown (event: KeyboardEvent) {
    if (!isOpen.value) return

    switch (event.key) {
      case 'Escape': {
        close()
        break
      }
      case 'ArrowLeft': {
        if (hasGallery.value && canGoPrev.value) {
          goPrev()
        }
        break
      }
      case 'ArrowRight': {
        if (hasGallery.value && canGoNext.value) {
          goNext()
        }
        break
      }
    }
  }

  // Watch for dialog open/close
  watch(isOpen, newValue => {
    if (newValue) {
      fetchEntry()
      window.addEventListener('keydown', handleKeydown)
    } else {
      window.removeEventListener('keydown', handleKeydown)
    }
  })

  // Watch for entry ID changes (when navigating gallery)
  watch(activeEntryId, (newId, oldId) => {
    if (newId !== oldId && isOpen.value) {
      fetchEntry()
    }
  })
</script>
