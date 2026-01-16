<template>
  <v-card
    class="mx-auto rounded-lg overflow-hidden pa-2 w-100"
    color="surface"
    elevated
  >
    <component
      :is="mediaComponent"
      :collection="collection"
    />

    <CollectionFooter
      :collection="collection"
      :show-author="showAuthor"
    />
  </v-card>
</template>

<script setup lang="ts">
  import type { ProfileBadge } from '@/lib/profileBadge'

  import { computed } from 'vue'

  import CollectionFooter from './CollectionFooter.vue'
  import CollectionMedia from './media/CollectionMedia.vue'

  export type BuiltInCollectionType
    = | 'series'
      | 'course'
      | 'library'
      | 'list'
      | 'album'
      | 'bundle'
      | 'catalog'
      | 'volume'
      | 'archive'

  // Allows custom user-defined types (e.g. "estampillas") while keeping
  // autocomplete for built-in types.
  export type CollectionType = BuiltInCollectionType | (string & {})

  export interface Collection {
    id: string
    collectionType: CollectionType
    title: string
    authorName: string
    authorAvatarUrl?: string
    profileBadge?: ProfileBadge
    publishedAt: string | Date
    coverUrl?: string
    itemsCount?: number
    totalDurationSec?: number
    locked?: boolean
  }

  interface Props {
    collection: Collection
    showAuthor?: boolean
  }

  withDefaults(defineProps<Props>(), {
    showAuthor: true,
  })

  const mediaComponent = computed(() => {
    return CollectionMedia
  })
</script>
