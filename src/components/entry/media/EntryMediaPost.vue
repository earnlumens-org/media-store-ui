<template>
  <div class="position-relative">
    <v-img
      v-if="entry.thumbnailUrl"
      class="rounded-lg"
      cover
      height="210"
      :class="entry.locked ? 'grayscale opacity-60' : ''"
      :src="entry.thumbnailUrl"
    />
    <v-sheet
      v-else
      class="rounded-lg d-flex align-center justify-center"
      color="grey-lighten-3"
      height="210"
      :class="entry.locked ? 'grayscale opacity-60' : ''"
    >
      <v-icon
        color="grey"
        size="64"
      >
        mdi-text-box-outline
      </v-icon>
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

  defineProps<{ entry: Entry }>()
</script>
