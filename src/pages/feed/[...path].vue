<template>
  <div>GenericGridLayout (Feed)</div>
  <div>{{ pathAfterFeed }}</div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useRoute } from 'vue-router'

  const route = useRoute()

  const pathAfterFeed = computed(() => {
    const p = (route.params as any).path
    return Array.isArray(p) ? p.join('/') : p
  })
</script>
