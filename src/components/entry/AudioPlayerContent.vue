<!--
  Audio Player Content (Internal component)

  Shared content between bottom sheet and dialog variants.
  Contains the actual player UI and controls.
-->
<template>
  <!-- Header -->
  <v-toolbar color="transparent" density="compact">
    <v-btn
      aria-label="Close"
      icon="mdi-chevron-down"
      variant="text"
      @click="$emit('close')"
    />

    <v-toolbar-title class="text-body-1">
      <template v-if="entry">{{ entry.title }}</template>
      <v-skeleton-loader v-else type="text" width="150" />
    </v-toolbar-title>

    <template #append>
      <v-btn
        v-if="entry && !entry.locked"
        aria-label="Open details"
        icon="mdi-open-in-new"
        variant="text"
        @click="$emit('open-details')"
      />
    </template>
  </v-toolbar>

  <v-divider />

  <!-- Loading State -->
  <template v-if="loading">
    <v-card-text class="text-center pa-6">
      <v-skeleton-loader class="mx-auto rounded-lg" height="200" type="image" width="200" />
      <v-skeleton-loader class="mt-4 mx-auto" type="heading" width="180" />
      <v-skeleton-loader class="mt-2 mx-auto" type="text" width="120" />
      <div class="d-flex justify-center ga-4 mt-6">
        <v-skeleton-loader type="avatar" />
        <v-skeleton-loader type="avatar" />
        <v-skeleton-loader type="avatar" />
      </div>
    </v-card-text>
  </template>

  <!-- Error State -->
  <template v-else-if="error">
    <v-card-text class="text-center pa-6">
      <v-icon color="error" size="64">mdi-alert-circle-outline</v-icon>
      <p class="text-body-1 mt-4">{{ errorMessage }}</p>
      <v-btn
        class="mt-4"
        color="primary"
        prepend-icon="mdi-refresh"
        variant="flat"
        @click="$emit('close')"
      >
        Close
      </v-btn>
    </v-card-text>
  </template>

  <!-- Locked Content State -->
  <template v-else-if="entry?.locked">
    <v-card-text class="text-center pa-6">
      <!-- Artwork with lock overlay -->
      <v-sheet
        class="mx-auto rounded-xl d-flex align-center justify-center position-relative overflow-hidden"
        color="red-lighten-4"
        height="200"
        width="200"
      >
        <v-img
          v-if="entry.thumbnailUrl"
          class="w-100 h-100 position-absolute opacity-40"
          cover
          :src="entry.thumbnailUrl"
        />
        <v-icon color="grey-darken-2" size="80">mdi-lock</v-icon>
      </v-sheet>

      <h3 class="text-h6 mt-4">{{ entry.title }}</h3>
      <p class="text-body-2 text-medium-emphasis">{{ entry.authorName }}</p>

      <v-alert
        class="mt-4 text-left"
        density="compact"
        type="info"
        variant="tonal"
      >
        This audio is premium content. Unlock it to start listening.
      </v-alert>

      <v-btn
        block
        class="mt-4"
        color="primary"
        prepend-icon="mdi-lock-open-variant"
        size="large"
        variant="flat"
        @click="$emit('navigate-preview')"
      >
        Unlock Content
      </v-btn>
    </v-card-text>
  </template>

  <!-- Success State - Player -->
  <template v-else-if="entry">
    <v-card-text class="pa-4">
      <!-- Artwork -->
      <v-sheet
        class="mx-auto rounded-xl overflow-hidden"
        elevation="4"
        height="200"
        width="200"
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
              <v-icon color="grey-darken-2" size="64">mdi-music</v-icon>
            </v-sheet>
          </template>
        </v-img>
        <v-sheet
          v-else
          class="h-100 d-flex align-center justify-center"
          color="red-lighten-4"
        >
          <v-icon color="grey-darken-2" size="64">mdi-music</v-icon>
        </v-sheet>
      </v-sheet>

      <!-- Title & Author -->
      <div class="text-center mt-4">
        <h3 class="text-h6 font-weight-bold">{{ entry.title }}</h3>
        <p class="text-body-2 text-medium-emphasis">{{ entry.authorName }}</p>
      </div>

      <!-- Progress Slider -->
      <div class="mt-4">
        <v-slider
          v-model="currentTime"
          color="primary"
          hide-details
          :max="duration"
          :min="0"
          thumb-size="12"
          track-size="4"
        />
        <div class="d-flex justify-space-between text-caption text-medium-emphasis mt-1">
          <span>{{ formatTime(currentTime) }}</span>
          <span>{{ formatTime(duration) }}</span>
        </div>
      </div>

      <!-- Main Controls -->
      <div class="d-flex align-center justify-center ga-2 mt-2">
        <!-- Skip Back 15s -->
        <v-btn
          aria-label="Skip back 15 seconds"
          icon="mdi-rewind-15"
          size="small"
          variant="text"
          @click="skipBack"
        />

        <!-- Previous (only with queue) -->
        <v-btn
          v-if="hasQueue"
          aria-label="Previous track"
          :disabled="!canGoPrev"
          icon="mdi-skip-previous"
          variant="text"
          @click="$emit('prev')"
        />

        <!-- Play/Pause -->
        <v-btn
          :aria-label="isPlaying ? 'Pause' : 'Play'"
          color="primary"
          :icon="isPlaying ? 'mdi-pause' : 'mdi-play'"
          size="x-large"
          variant="flat"
          @click="togglePlay"
        />

        <!-- Next (only with queue) -->
        <v-btn
          v-if="hasQueue"
          aria-label="Next track"
          :disabled="!canGoNext"
          icon="mdi-skip-next"
          variant="text"
          @click="$emit('next')"
        />

        <!-- Skip Forward 15s -->
        <v-btn
          aria-label="Skip forward 15 seconds"
          icon="mdi-fast-forward-15"
          size="small"
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

        <!-- Share -->
        <v-btn
          :aria-label="$t('Common.share')"
          icon="mdi-share-variant"
          size="small"
          variant="text"
          @click="onShare"
        />

        <!-- Save/Bookmark -->
        <v-btn
          :aria-label="isSaved ? $t('Common.removeFromSaved') : $t('Common.save')"
          :color="isSaved ? 'primary' : undefined"
          :icon="isSaved ? 'mdi-bookmark' : 'mdi-bookmark-outline'"
          size="small"
          variant="text"
          @click="isSaved = !isSaved"
        />
      </div>
    </v-card-text>
  </template>
</template>

<script setup lang="ts">
  import type { EntryModel } from '@/api/api'

  import { computed, ref } from 'vue'

  interface Props {
    entry: EntryModel | null
    loading: boolean
    error: boolean
    errorMessage: string
    queueIds?: string[]
    currentIndex?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    queueIds: () => [],
    currentIndex: 0,
  })

  defineEmits<{
    'close': []
    'open-details': []
    'navigate-preview': []
    'prev': []
    'next': []
  }>()

  // Player state
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const playbackSpeed = ref(1)
  const isSaved = ref(false)

  // Playback speed options
  const playbackSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 2]

  // Duration from entry
  const duration = computed(() => props.entry?.durationSec ?? 0)

  // Queue state
  const hasQueue = computed(() => props.queueIds.length > 1)
  const canGoPrev = computed(() => props.currentIndex > 0)
  const canGoNext = computed(() => props.currentIndex < props.queueIds.length - 1)

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

  // Controls
  function togglePlay () {
    isPlaying.value = !isPlaying.value
    // TODO: Connect to actual audio element
  }

  function skipBack () {
    currentTime.value = Math.max(0, currentTime.value - 15)
  }

  function skipForward () {
    currentTime.value = Math.min(duration.value, currentTime.value + 15)
  }

  function onShare () {
    if (props.entry && navigator.share) {
      navigator.share({
        title: props.entry.title,
        url: `${window.location.origin}/listen/${props.entry.id}`,
      })
    } else if (props.entry) {
      navigator.clipboard.writeText(`${window.location.origin}/listen/${props.entry.id}`)
    }
  }
</script>
