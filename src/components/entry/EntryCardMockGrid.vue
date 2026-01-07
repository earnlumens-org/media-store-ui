<template>
  <v-container class="py-4 px-1 px-sm-4" fluid>
    <v-row dense>
      <v-col
        v-for="item in entries"
        :key="item.entry.id"
        cols="12"
        lg="3"
        md="4"
        sm="6"
        xl="2"
      >
        <EntryCard
          :entry="item.entry"
          :show-author="item.showAuthor"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import type { Entry } from '@/components/entry/EntryCard.vue'

  interface EntryCardItem {
    entry: Entry
    showAuthor: boolean
  }

  const entries: EntryCardItem[] = [
    {
      showAuthor: true,
      entry: {
        id: 'video-locked-1',
        type: 'video',
        title: 'One meets his destiny on the road he takes to avoid it. One meets his destiny on the road he takes to avoid it',
        authorName: 'Shamus',
        authorAvatarUrl: 'https://randomuser.me/api/portraits/women/21.jpg',
        publishedAt: '2024-10-06',
        thumbnailUrl: 'https://picsum.photos/500/300?image=88',
        durationSec: 836,
        locked: true,
      },
    },
    {
      showAuthor: true,
      entry: {
        id: 'video-open-2',
        type: 'video',
        title: 'Lo-fi mix for',
        authorName: 'Nadia',
        authorAvatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
        publishedAt: '2024-11-02',
        thumbnailUrl: 'https://picsum.photos/500/300?image=1025',
        durationSec: 188,
        locked: false,
      },
    },
    {
      showAuthor: false,
      entry: {
        id: 'video-locked-3',
        type: 'video',
        title: 'Morning light on concrete — minimal photo set.',
        authorName: 'Mateo',
        authorAvatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
        publishedAt: '2025-01-15',
        thumbnailUrl: 'https://picsum.photos/500/300?image=1069',
        durationSec: 42,
        locked: true,
      },
    },
    {
      showAuthor: false,
      entry: {
        id: 'video-open-4',
        type: 'video',
        title: 'First steps: build your creator profile and publish.',
        authorName: 'Alicia',
        authorAvatarUrl: 'https://randomuser.me/api/portraits/women/68.jpg',
        publishedAt: '2025-06-28',
        thumbnailUrl: 'https://picsum.photos/500/300?image=903',
        durationSec: 5400,
        locked: false,
      },
    },
    {
      showAuthor: true,
      entry: {
        id: 'video-open-5',
        type: 'video',
        title: 'Street food tour: quick bites and big flavors.',
        authorName: 'Iris',
        authorAvatarUrl: 'https://randomuser.me/api/portraits/women/12.jpg',
        publishedAt: '2024-09-19',
        thumbnailUrl: 'https://picsum.photos/500/300?image=1074',
        durationSec: 512,
        locked: false,
      },
    },
    {
      showAuthor: false,
      entry: {
        id: 'video-locked-6',
        type: 'video',
        title: 'Late night coding session: refactor & ship.',
        authorName: 'Kenji',
        authorAvatarUrl: 'https://randomuser.me/api/portraits/men/11.jpg',
        publishedAt: '2024-12-08',
        thumbnailUrl: 'https://picsum.photos/500/300?image=1084',
        durationSec: 1240,
        locked: true,
      },
    },
    {
      showAuthor: true,
      entry: {
        id: 'video-open-7',
        type: 'video',
        title: 'Minimal home studio setup under $100.',
        authorName: 'Rafa',
        authorAvatarUrl: 'https://randomuser.me/api/portraits/men/45.jpg',
        publishedAt: '2024-08-03',
        thumbnailUrl: 'https://picsum.photos/500/300?image=944',
        durationSec: 369,
        locked: false,
      },
    },
    {
      showAuthor: false,
      entry: {
        id: 'video-open-8',
        type: 'video',
        title: 'Coffee basics: grind size explained.',
        authorName: 'Sofia',
        authorAvatarUrl: 'https://randomuser.me/api/portraits/women/7.jpg',
        publishedAt: '2025-02-01',
        thumbnailUrl: 'https://picsum.photos/500/300?image=1060',
        durationSec: 221,
        locked: false,
      },
    },
    {
      showAuthor: true,
      entry: {
        id: 'video-locked-9',
        type: 'video',
        title: 'How I edit videos fast: a simple workflow.',
        authorName: 'Mara',
        authorAvatarUrl: 'https://randomuser.me/api/portraits/women/33.jpg',
        publishedAt: '2025-03-12',
        thumbnailUrl: 'https://picsum.photos/500/300?image=883',
        durationSec: 905,
        locked: true,
      },
    },
    {
      showAuthor: true,
      entry: {
        id: 'video-open-10',
        type: 'video',
        title: 'Beginner guitar: 3 chords, 5 songs.',
        authorName: 'Noah',
        authorAvatarUrl: 'https://randomuser.me/api/portraits/men/9.jpg',
        publishedAt: '2024-07-21',
        thumbnailUrl: 'https://picsum.photos/500/300?image=839',
        durationSec: 602,
        locked: false,
      },
    },
    {
      showAuthor: false,
      entry: {
        id: 'video-locked-11',
        type: 'video',
        title: 'A calm walk in the rain (no talking).',
        authorName: 'Liam',
        authorAvatarUrl: 'https://randomuser.me/api/portraits/men/52.jpg',
        publishedAt: '2025-05-04',
        thumbnailUrl: 'https://picsum.photos/500/300?image=1011',
        durationSec: 1456,
        locked: true,
      },
    },
    {
      showAuthor: true,
      entry: {
        id: 'video-open-12',
        type: 'video',
        title: 'Meal prep: 4 lunches in 20 minutes.',
        authorName: 'Val',
        authorAvatarUrl: 'https://randomuser.me/api/portraits/women/60.jpg',
        publishedAt: '2024-10-29',
        thumbnailUrl: 'https://picsum.photos/500/300?image=1044',
        durationSec: 119,
        locked: false,
      },
    },
    {
      showAuthor: false,
      entry: {
        id: 'video-open-13',
        type: 'video',
        title: 'Productivity myth-busting in 5 minutes.',
        authorName: 'Aya',
        authorAvatarUrl: 'https://randomuser.me/api/portraits/women/83.jpg',
        publishedAt: '2025-04-18',
        thumbnailUrl: 'https://picsum.photos/500/300?image=989',
        durationSec: 304,
        locked: false,
      },
    },
    {
      showAuthor: true,
      entry: {
        id: 'video-locked-14',
        type: 'video',
        title: 'Deep dive: color grading for beginners.',
        authorName: 'Owen',
        authorAvatarUrl: 'https://randomuser.me/api/portraits/men/77.jpg',
        publishedAt: '2024-12-30',
        thumbnailUrl: 'https://picsum.photos/500/300?image=943',
        durationSec: 2688,
        locked: true,
      },
    },
    {
      showAuthor: false,
      entry: {
        id: 'video-open-15',
        type: 'video',
        title: 'Quick stretch routine for desk workers.',
        authorName: 'Eli',
        authorAvatarUrl: 'https://randomuser.me/api/portraits/men/24.jpg',
        publishedAt: '2025-02-22',
        thumbnailUrl: 'https://picsum.photos/500/300?image=941',
        durationSec: 176,
        locked: false,
      },
    },
    {
      showAuthor: true,
      entry: {
        id: 'video-open-16',
        type: 'video',
        title: 'Sketching basics: lines, shapes, confidence.',
        authorName: 'Jun',
        authorAvatarUrl: 'https://randomuser.me/api/portraits/men/61.jpg',
        publishedAt: '2024-06-02',
        thumbnailUrl: 'https://picsum.photos/500/300?image=1062',
        durationSec: 734,
        locked: false,
      },
    },
    {
      showAuthor: false,
      entry: {
        id: 'video-locked-17',
        type: 'video',
        title: 'Behind the scenes: shooting b-roll in daylight.',
        authorName: 'Zoe',
        authorAvatarUrl: 'https://randomuser.me/api/portraits/women/90.jpg',
        publishedAt: '2025-03-03',
        thumbnailUrl: 'https://picsum.photos/500/300?image=1003',
        durationSec: 981,
        locked: true,
      },
    },
    {
      showAuthor: true,
      entry: {
        id: 'video-open-18',
        type: 'video',
        title: 'Travel packing list: one bag, one week.',
        authorName: 'Nico',
        authorAvatarUrl: 'https://randomuser.me/api/portraits/men/68.jpg',
        publishedAt: '2024-09-04',
        thumbnailUrl: 'https://picsum.photos/500/300?image=1070',
        durationSec: 415,
        locked: false,
      },
    },
    {
      showAuthor: false,
      entry: {
        id: 'video-open-19',
        type: 'video',
        title: 'From idea to upload: my weekly routine.',
        authorName: 'Ana',
        authorAvatarUrl: 'https://randomuser.me/api/portraits/women/5.jpg',
        publishedAt: '2025-06-01',
        thumbnailUrl: 'https://picsum.photos/500/300?image=1050',
        durationSec: 1107,
        locked: false,
      },
    },
    {
      showAuthor: true,
      entry: {
        id: 'video-locked-20',
        type: 'video',
        title: 'Masterclass teaser: storytelling with rhythm.',
        authorName: 'Diego',
        authorAvatarUrl: 'https://randomuser.me/api/portraits/men/14.jpg',
        publishedAt: '2024-11-25',
        thumbnailUrl: 'https://picsum.photos/500/300?image=1015',
        durationSec: 72,
        locked: true,
      },
    },
  ]
</script>
