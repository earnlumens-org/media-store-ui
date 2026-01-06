<template>
  <v-card
    class="mx-auto rounded-lg overflow-hidden pa-3 position-relative"
    color="surface"
    elevated
    max-width="375"
  >
    <!-- Contenido que queda "deshabilitado" visualmente cuando está bloqueado -->
    <div :class="entry.locked ? 'grayscale opacity-60' : ''">
      <component
        :is="mediaComponent"
        :entry="entry"
      />

      <EntryFooter
        :entry="entry"
        :show-author="showAuthor"
      />
    </div>

    <!-- Overlay persistente: NO se cierra con click/ESC -->
    <v-overlay
      class="d-flex align-center justify-center"
      contained
      :model-value="entry.locked"
      persistent
      scrim="rgba(0, 0, 0, 0.55)"
    >
      <v-btn
        color="white"
        prepend-icon="mdi-lock"
        rounded="pill"
        variant="elevated"
      >
        Blocked
      </v-btn>
    </v-overlay>
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
