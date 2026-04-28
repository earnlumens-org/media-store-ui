<template>
  <EntryCardMockGrid :feed-fn="api.mock.getEcosystemFeed" />
</template>

<script setup lang="ts">
  import { api } from '@/api/api'
  import EntryCardMockGrid from '@/components/entry/EntryCardMockGrid.vue'
</script>

<route lang="json">
{
  "path": "/ecosystem"
}
</route>
