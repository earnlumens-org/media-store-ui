<template>
  <div class="pa-4 d-flex flex-column ga-4">
    <EntryCard :entry="videoEntry" />
    <EntryCard :entry="videoEntry" :show-author="false" />
  </div>
</template>

<script setup lang="ts">
  import type { Entry } from '@/components/entry/EntryCard.vue'

  const videoEntry: Entry = {
    id: '1',
    type: 'video',
    title: 'One meets his destiny on the road he takes to avoid it. One meets his destiny on the road he takes to avoid it.',
    authorName: 'Shamus',
    authorAvatarUrl: 'https://randomuser.me/api/portraits/women/21.jpg',
    publishedAt: '2024-10-07',
    thumbnailUrl: 'https://picsum.photos/500/300?image=88',
    durationSec: 836, // 13:56
    locked: true,
  }
</script>

<route lang="json">
{
  "path": "/firststeps"
}
</route>
