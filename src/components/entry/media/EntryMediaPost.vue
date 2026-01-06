<template>
  <v-img
    v-if="entry.thumbnailUrl"
    class="rounded-lg"
    cover
    height="210"
    :src="entry.thumbnailUrl"
  />
  <v-sheet
    v-else
    class="rounded-lg d-flex align-center justify-center"
    color="grey-lighten-3"
    height="210"
  >
    <v-icon
      color="grey"
      size="64"
    >
      mdi-text-box-outline
    </v-icon>
  </v-sheet>
</template>

<script setup lang="ts">
  import type { Entry } from '../EntryCard.vue'

  defineProps<{ entry: Entry }>()
</script>
