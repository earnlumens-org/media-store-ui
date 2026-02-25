<template>
  <EntryCardMockGrid :feed-fn="api.mock.getCommunityFeed" />
</template>

<script setup lang="ts">
  import { api } from '@/api/api'
  import EntryCardMockGrid from '@/components/entry/EntryCardMockGrid.vue'
</script>

<route lang="json">
{
  "path": "/community"
}
</route>
