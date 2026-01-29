<!--
  Entry Preview Content (Internal component)

  Shared content between bottom sheet and dialog variants.
  Contains the actual entry content and controls.
-->
<template>
  <!-- Header -->
  <v-toolbar color="transparent" density="compact">
    <v-btn
      aria-label="Close"
      icon="mdi-close"
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
        aria-label="Open full page"
        icon="mdi-open-in-new"
        variant="text"
        @click="$emit('open-full-page')"
      />
    </template>
  </v-toolbar>

  <v-divider />

  <!-- Loading State -->
  <template v-if="loading">
    <v-card-text class="pa-4">
      <v-skeleton-loader class="mb-4" type="heading" />
      <v-skeleton-loader type="paragraph" />
      <v-skeleton-loader class="mt-2" type="paragraph" />
      <div class="d-flex align-center mt-6">
        <v-skeleton-loader class="me-3" type="avatar" />
        <v-skeleton-loader type="text" width="120" />
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
        prepend-icon="mdi-close"
        variant="flat"
        @click="$emit('close')"
      >
        Close
      </v-btn>
    </v-card-text>
  </template>

  <!-- Locked Content State -->
  <template v-else-if="entry?.locked">
    <v-card-text class="pa-4">
      <!-- Preview with lock overlay -->
      <v-sheet
        class="rounded-lg pa-4 position-relative overflow-hidden"
        color="surface-variant"
      >
        <!-- Blurred preview text -->
        <div class="text-body-1 text-medium-emphasis" style="filter: blur(4px); user-select: none;">
          {{ previewText }}
        </div>

        <!-- Lock overlay -->
        <v-overlay
          class="d-flex flex-column align-center justify-center rounded-lg"
          contained
          :model-value="true"
          persistent
          scrim="rgba(0, 0, 0, 0.7)"
        >
          <v-icon color="white" size="48">mdi-lock</v-icon>
          <p class="text-body-2 text-white mt-2 text-center px-4">
            This content is premium
          </p>
        </v-overlay>
      </v-sheet>

      <v-alert
        class="mt-4"
        density="compact"
        type="info"
        variant="tonal"
      >
        Unlock this entry to read the full content.
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

  <!-- Success State - Full Content -->
  <template v-else-if="entry">
    <v-card-text class="pa-4">
      <!-- Title -->
      <h1 class="text-h5 font-weight-bold mb-2">
        {{ entry.title }}
      </h1>

      <!-- Date -->
      <p class="text-body-2 text-medium-emphasis mb-4">
        {{ formatDate(entry.publishedAt) }}
      </p>

      <!-- Content -->
      <v-sheet class="rounded-lg pa-4" color="surface-variant">
        <div class="text-body-1" v-html="formattedContent" />
      </v-sheet>

      <!-- Thumbnail/Media (if exists) -->
      <v-img
        v-if="entry.thumbnailUrl"
        class="rounded-lg mt-4"
        cover
        height="200"
        :src="entry.thumbnailUrl"
      />

      <v-divider class="my-4" />

      <!-- Author Block -->
      <div class="d-flex align-center">
        <v-avatar
          class="me-3"
          color="grey-lighten-2"
          :image="entry.authorAvatarUrl"
          size="40"
        >
          <v-icon v-if="!entry.authorAvatarUrl">mdi-account</v-icon>
        </v-avatar>
        <div class="flex-grow-1">
          <span class="text-body-1 font-weight-medium">{{ entry.authorName }}</span>
        </div>
        <v-btn
          :aria-label="$t('Common.share')"
          icon="mdi-share-variant"
          size="small"
          variant="text"
          @click="onShare"
        />
        <v-btn
          :aria-label="isSaved ? $t('Common.removeFromSaved') : $t('Common.save')"
          :color="isSaved ? 'primary' : undefined"
          :icon="isSaved ? 'mdi-bookmark' : 'mdi-bookmark-outline'"
          size="small"
          variant="text"
          @click="toggleSave"
        />
      </div>

      <!-- Open Full Page Button -->
      <v-btn
        block
        class="mt-4"
        color="primary"
        prepend-icon="mdi-book-open-page-variant"
        variant="tonal"
        @click="$emit('open-full-page')"
      >
        Read on full page
      </v-btn>
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
  }

  const props = defineProps<Props>()

  defineEmits<{
    'close': []
    'open-full-page': []
    'navigate-preview': []
  }>()

  // UI State
  const isSaved = ref(false)

  // Mock content (since Entry model doesn't have content field yet)
  const mockContent = `This is a sample entry content that demonstrates how the quick read modal displays text-based entries.

The content is rendered with proper paragraph spacing and line breaks preserved. This makes it easy to read short posts, announcements, or articles directly in the modal without navigating to a full page.

For longer content (over 600 characters), users are encouraged to open the full reading page for a better experience with more space and additional features.`

  // Preview text for locked content
  const previewText = computed(() => {
    return 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris...'
  })

  // Format content with line breaks preserved
  const formattedContent = computed(() => {
    // Use mock content since Entry model doesn't have content field
    return mockContent.replace(/\n/g, '<br>')
  })

  function formatDate (date: string | Date): string {
    const d = date instanceof Date ? date : new Date(date)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  function toggleSave () {
    isSaved.value = !isSaved.value
  }

  function onShare () {
    if (navigator.share && props.entry) {
      navigator.share({
        title: props.entry.title,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }
</script>
