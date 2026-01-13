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
  import { computed } from 'vue'

  import EntryMediaAudio from './media/EntryMediaAudio.vue'
  import EntryMediaCourse from './media/EntryMediaCourse.vue'
  import EntryMediaImage from './media/EntryMediaImage.vue'
  import EntryMediaPost from './media/EntryMediaPost.vue'
  import EntryMediaVideo from './media/EntryMediaVideo.vue'

  export interface Entry {
    id: string
    type: 'video' | 'audio' | 'post' | 'image' | 'course'
    title: string
    authorName: string
    authorAvatarUrl?: string
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
      case 'post': {
        return EntryMediaPost
      }
      case 'image': {
        return EntryMediaImage
      }
      case 'course': {
        return EntryMediaCourse
      }
      default: {
        return EntryMediaPost
      }
    }
  })
</script>
