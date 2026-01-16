<template>
  <v-card
    class="mx-auto rounded-lg overflow-hidden pa-2 w-100"
    color="surface"
    elevated
  >
    <component
      :is="mediaComponent"
      :entry="entry"
    />

    <EntryFooter
      :entry="entry"
      :show-author="showAuthor"
    />
  </v-card>
</template>

<script setup lang="ts">
  import type { ProfileBadge } from '@/lib/profileBadge'

  import { computed } from 'vue'

  import EntryMediaAudio from './media/EntryMediaAudio.vue'
  import EntryMediaEntry from './media/EntryMediaEntry.vue'
  import EntryMediaImage from './media/EntryMediaImage.vue'
  import EntryMediaVideo from './media/EntryMediaVideo.vue'

  export interface Entry {
    id: string
    type: 'video' | 'audio' | 'entry' | 'image'
    title: string
    authorName: string
    authorAvatarUrl?: string
    profileBadge?: ProfileBadge
    publishedAt: string | Date
    thumbnailUrl?: string
    durationSec?: number
    locked?: boolean
  }

  interface Props {
    entry: Entry
    showAuthor?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    showAuthor: true,
  })

  const mediaComponent = computed(() => {
    switch (props.entry.type) {
      case 'video': {
        return EntryMediaVideo
      }
      case 'audio': {
        return EntryMediaAudio
      }
      case 'entry': {
        return EntryMediaEntry
      }
      case 'image': {
        return EntryMediaImage
      }
      default: {
        return EntryMediaEntry
      }
    }
  })
</script>
