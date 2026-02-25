<template>
  <EntryCardMockGrid :feed-fn="api.mock.getEcosystemFeed" />
</template>

<script setup lang="ts">
  import EntryCardMockGrid from '@/components/entry/EntryCardMockGrid.vue'
  import { api } from '@/api/api'
</script>

<route lang="json">
{
  "path": "/ecosystem"
}
</route>
