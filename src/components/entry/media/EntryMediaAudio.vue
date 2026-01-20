<template>
  <div class="position-relative">
    <MediaFrame
      fallback-color="red-lighten-4"
      fallback-icon="mdi-music"
      fallback-icon-color="grey-darken-4"
      :grayscale="Boolean(entry.locked)"
      :src="entry.thumbnailUrl"
    >
      <template #overlay>
        <v-avatar
          class="position-absolute top-0 right-0 ma-2 text-white"
          color="rgba(0, 0, 0, 0.65)"
          size="28"
        >
          <v-icon size="16">mdi-music</v-icon>
        </v-avatar>

        <v-chip
          v-if="entry.durationSec"
          class="position-absolute top-0 left-0 ma-2 text-white"
          color="rgba(0, 0, 0, 0.65)"
          density="comfortable"
          label
          rounded="xl"
          variant="flat"
        >
          <span class="font-weight-bold">{{ formattedDuration }}</span>
        </v-chip>
      </template>
    </MediaFrame>

    <!-- Overlay Blocked -->
    <v-overlay
      class="d-flex align-center justify-center rounded-lg"
      :close-on-back="false"
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
  </div>
</template>

<script setup lang="ts">
  import type { Entry } from '../EntryCard.vue'

  import { computed } from 'vue'

  import MediaFrame from '@/components/media/MediaFrame.vue'

  const props = defineProps<{ entry: Entry }>()

  const formattedDuration = computed(() => {
    if (!props.entry.durationSec) {
      return ''
    }

    const totalSeconds = props.entry.durationSec
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }

    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  })
</script>
