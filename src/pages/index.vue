<template>
  <Hero v-if="isPlatformRoot" />
  <v-container class="mt-6 mb-2 px-1 px-sm-4" fluid>
    <router-link class="d-flex align-center text-decoration-none" style="color: inherit; cursor: pointer;" to="/explore">
      <div class="text-h4 font-weight-bold">Explore</div>
      <v-icon class="ml-2" size="32">mdi-chevron-right</v-icon>
    </router-link>
  </v-container>

  <EntryCardGrid class="pt-0" />
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import EntryCardGrid from '@/components/entry/EntryCardGrid.vue'
  import Hero from '@/components/home/Hero.vue'
  import { useTenantStore } from '@/stores/tenant'

  // The Hero block ("EARNLUMENS — Plataforma para lanzar tu marketplace…")
  // is platform marketing copy: it pitches the credential-azul flow that
  // creates new tenants. Showing it on a tenant subdomain is misleading
  // because that storefront has nothing to do with the platform pitch and
  // the buttons would take the visitor away from the tenant they were
  // browsing. Restrict it to the apex/root visitor context.
  const tenantStore = useTenantStore()
  const isPlatformRoot = computed(() => tenantStore.kind === 'platform')
</script>

<route lang="yaml">
path: /
</route>
