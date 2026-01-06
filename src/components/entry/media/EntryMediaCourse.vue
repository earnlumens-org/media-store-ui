<template>
  <v-img
    class="rounded-lg"
    cover
    height="210"
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
</template>

<script setup lang="ts">
  import type { Entry } from '../EntryCard.vue'

  defineProps<{ entry: Entry }>()
</script>
