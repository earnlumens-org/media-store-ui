<template>
  <Hero />
  <v-container class="mt-6 mb-2 px-1 px-sm-4" fluid>
    <router-link class="d-flex align-center text-decoration-none" style="color: inherit; cursor: pointer;" to="/explore">
      <div class="text-h4 font-weight-bold">Explore</div>
      <v-icon class="ml-2" size="32">mdi-chevron-right</v-icon>
    </router-link>
  </v-container>

  <EntryCardGrid class="pt-0" />
</template>

<script setup lang="ts">
  import EntryCardGrid from '@/components/entry/EntryCardGrid.vue'
  import Hero from '@/components/home/Hero.vue'
</script>

<route lang="yaml">
path: /
</route>
