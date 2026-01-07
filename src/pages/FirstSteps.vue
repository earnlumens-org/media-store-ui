<template>
  <v-container class="py-4 px-1" fluid>
    <v-row dense>
      <v-col cols="12" sm="6">
        <EntryCard :entry="entryA" />
      </v-col>
      <v-col cols="12" sm="6">
        <EntryCard :entry="entryB" />
      </v-col>
      <v-col cols="12" sm="6">
        <EntryCard :entry="entryC" :show-author="false" />
      </v-col>
      <v-col cols="12" sm="6">
        <EntryCard :entry="entryD" :show-author="false" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import type { Entry } from '@/components/entry/EntryCard.vue'

  // A) show-author: true, locked: true
  const entryA: Entry = {
    id: 'video-locked-1',
    type: 'video',
    title: 'One meets his destiny on the road he takes to avoid it. One meets his destiny on the road he takes to avoid it',
    authorName: 'Shamus',
    authorAvatarUrl: 'https://randomuser.me/api/portraits/women/21.jpg',
    publishedAt: '2024-10-06',
    thumbnailUrl: 'https://picsum.photos/500/300?image=88',
    durationSec: 836, // 13:56
    locked: true,
  }

  // B) show-author: true, locked: false
  const entryB: Entry = {
    id: 'video-open-2',
    type: 'video',
    title: 'Lo-fi mix for ',
    authorName: 'Nadia',
    authorAvatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
    publishedAt: '2024-11-02',
    thumbnailUrl: 'https://picsum.photos/500/300?image=1025',
    durationSec: 188, // 3:08
    locked: false,
  }

  // C) show-author: false, locked: true
  const entryC: Entry = {
    id: 'video-locked-3',
    type: 'video',
    title: 'Morning light on concrete — minimal photo set.',
    authorName: 'Mateo',
    authorAvatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
    publishedAt: '2025-01-15',
    thumbnailUrl: 'https://picsum.photos/500/300?image=1069',
    durationSec: 42,
    locked: true,
  }

  // D) show-author: false, locked: false
  const entryD: Entry = {
    id: 'video-open-4',
    type: 'video',
    title: 'First steps: build your creator profile and publish.',
    authorName: 'Alicia',
    authorAvatarUrl: 'https://randomuser.me/api/portraits/women/68.jpg',
    publishedAt: '2025-06-28',
    thumbnailUrl: 'https://picsum.photos/500/300?image=903',
    durationSec: 5400, // 1:30:00
    locked: false,
  }
</script>

<route lang="json">
{
  "path": "/firststeps"
}
</route>
