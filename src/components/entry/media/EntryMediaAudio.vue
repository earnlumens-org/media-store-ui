<template>
  <div class="position-relative">
    <v-sheet
      class="rounded-lg d-flex align-center justify-center"
      :class="entry.locked ? 'grayscale opacity-60' : ''"
      color="grey-darken-3"
      height="210"
    >
      <v-icon
        color="white"
        size="64"
      >
        mdi-music
      </v-icon>

      <!-- Duración del audio -->
      <v-chip
        v-if="entry.durationSec"
        class="position-absolute bottom-0 right-0 ma-2 text-white"
        density="comfortable"
        label
        :style="{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }"
        variant="flat"
      >
        <span class="font-weight-bold">{{ formattedDuration }}</span>
      </v-chip>
    </v-sheet>

    <!-- Overlay Blocked -->
    <v-overlay
      class="d-flex align-center justify-center rounded-lg"
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
