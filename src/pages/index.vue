<template>
  <Hero />

  <v-container class="mt-6">
    <v-card class="pa-6" color="transparent" elevation="4">
      <div class="text-h6 font-weight-bold mb-2">Debug Card</div>
      <div>Revisando márgenes y separación debajo del Hero.</div>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
  import Hero from '@/components/home/Hero.vue'
</script>

<route lang="yaml">
path: /
</route>
