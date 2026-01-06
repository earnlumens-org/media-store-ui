<template>
  <v-img
    class="rounded-lg"
    cover
    height="210"
    :src="entry.thumbnailUrl"
  />
</template>

<script setup lang="ts">
  import type { Entry } from '../EntryCard.vue'

  defineProps<{ entry: Entry }>()
</script>
