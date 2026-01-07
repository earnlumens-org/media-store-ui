<template>
  <div class="position-relative">
    <v-img
      class="rounded-lg"
      cover
      height="210"
      :class="entry.locked ? 'grayscale opacity-60' : ''"
      :src="entry.thumbnailUrl"
    >
      <!-- Badge de curso -->
      <v-chip
        class="position-absolute top-0 left-0 ma-2"
        color="primary"
        density="comfortable"
        label
        variant="flat"
      >
        <v-icon
          size="16"
          start
        >
          mdi-school
        </v-icon>
        <span class="font-weight-bold">Course</span>
      </v-chip>
    </v-img>

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

  defineProps<{ entry: Entry }>()
</script>
