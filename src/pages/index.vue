<template>
  <Hero />
  <v-container class="mt-6 mb-2 px-1 px-sm-4" fluid>
    <div class="d-flex align-center">
      <div class="text-h4 font-weight-bold">Explore</div>
      <v-icon class="ml-2" size="32">mdi-chevron-right</v-icon>
    </div>
  </v-container>

  <EntryCardMockGrid class="pt-0" />
</template>

<script setup lang="ts">
  import EntryCardMockGrid from '@/components/entry/EntryCardMockGrid.vue'
  import Hero from '@/components/home/Hero.vue'
</script>

<route lang="yaml">
path: /
</route>
