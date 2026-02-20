<template>
  <router-link class="position-relative d-block text-decoration-none" style="color: inherit" :to="`/collection/${collection.id}`">
    <MediaFrame
      fallback-color="amber-lighten-4"
      :fallback-icon="typeIcon"
      fallback-icon-color="grey-darken-4"
      :grayscale="Boolean(collection.locked)"
      :src="collection.coverUrl"
    >
      <template #overlay>
        <v-chip
          :append-icon="typeIcon"
          class="position-absolute top-0 right-0 ma-2 text-white"
          color="rgba(0, 0, 0, 0.65)"
          density="comfortable"
          rounded="xl"
          variant="flat"
        >
          <span class="font-weight-bold">{{ label }}</span>
        </v-chip>

        <v-chip
          v-if="collection.itemsCount"
          class="position-absolute top-0 left-0 ma-2 text-white"
          color="rgba(0, 0, 0, 0.65)"
          density="comfortable"
          rounded="xl"
          variant="flat"
        >
          <span class="font-weight-bold">{{ collection.itemsCount }} items</span>
        </v-chip>
      </template>
    </MediaFrame>

    <v-overlay
      class="d-flex align-center justify-center rounded-lg"
      :close-on-back="false"
      contained
      :model-value="collection.locked"
      persistent
      scrim="rgba(0, 0, 0, 0.55)"
    >
      <v-btn
        color="white"
        prepend-icon="mdi-lock"
        rounded="pill"
        :to="`/collection/${collection.id}`"
        variant="elevated"
      >
        {{ $t('Common.blocked') }}
      </v-btn>
    </v-overlay>
  </router-link>
</template>

<script setup lang="ts">
  import type { Collection } from '../CollectionCard.vue'

  import { computed } from 'vue'

  import MediaFrame from '@/components/media/MediaFrame.vue'

  const props = defineProps<{ collection: Collection }>()

  function toTitleLabel (value: string) {
    const trimmed = value.trim()
    if (!trimmed) {
      return 'Collection'
    }

    const normalized = trimmed
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    return normalized
      .split(' ')
      .map(part => part.length > 0
        ? part.charAt(0).toUpperCase() + part.slice(1)
        : part,
      )
      .join(' ')
  }

  const label = computed(() => {
    switch (props.collection.collectionType) {
      case 'series': {
        return 'Series'
      }
      case 'course': {
        return 'Course'
      }
      case 'library': {
        return 'Library'
      }
      case 'list': {
        return 'List'
      }
      case 'album': {
        return 'Album'
      }
      case 'bundle': {
        return 'Bundle'
      }
      case 'catalog': {
        return 'Catalog'
      }
      case 'volume': {
        return 'Volume'
      }
      case 'archive': {
        return 'Archive'
      }
      default: {
        // Custom user-defined type (e.g. "estampillas")
        return toTitleLabel(props.collection.collectionType)
      }
    }
  })

  const typeIcon = computed(() => {
    switch (props.collection.collectionType) {
      case 'series': {
        return 'mdi-layers-triple'
      }
      case 'course': {
        return 'mdi-school'
      }
      case 'library': {
        return 'mdi-library'
      }
      case 'list': {
        return 'mdi-format-list-bulleted'
      }
      case 'album': {
        return 'mdi-album'
      }
      case 'bundle': {
        return 'mdi-package-variant'
      }
      case 'catalog': {
        return 'mdi-book-open-variant'
      }
      case 'volume': {
        return 'mdi-book'
      }
      case 'archive': {
        return 'mdi-archive'
      }
      default: {
        // Custom user-defined type
        return 'mdi-tray-full'
      }
    }
  })
</script>
