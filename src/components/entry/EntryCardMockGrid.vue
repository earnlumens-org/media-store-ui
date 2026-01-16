<template>
  <v-container class="py-4 px-1 px-sm-4" fluid>
    <v-row dense>
      <v-col
        v-for="item in feed"
        :key="itemKey(item)"
        cols="12"
        lg="3"
        md="4"
        sm="6"
        xl="2"
      >
        <EntryCard
          v-if="item.kind === 'entry'"
          :entry="item.entry"
          :show-author="item.showAuthor"
        />
        <CollectionCard
          v-else
          :collection="item.collection"
          :show-author="item.showAuthor"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import type { Collection } from '@/components/collection/CollectionCard.vue'
  import type { Entry } from '@/components/entry/EntryCard.vue'

  type FeedItem
    = | { kind: 'entry', entry: Entry, showAuthor: boolean }
      | { kind: 'collection', collection: Collection, showAuthor: boolean }

  function itemKey (item: FeedItem) {
    return item.kind === 'entry'
      ? `entry-${item.entry.id}`
      : `collection-${item.collection.id}`
  }

  const feed: FeedItem[] = [
    // Collections: built-ins (series/course/library/list/album/bundle/catalog/volume/archive)
    {
      kind: 'collection',
      showAuthor: true,
      collection: {
        id: 'series-1',
        collectionType: 'series',
        title: 'Series: Learn Design Systems (Part 1–8)',
        authorName: 'Sarah',
        authorAvatarUrl: 'https://randomuser.me/api/portraits/women/21.jpg',
        profileBadge: 'u1',
        publishedAt: '2024-12-15',
        coverUrl: 'https://picsum.photos/500/300?image=88',
        itemsCount: 8,
        locked: false,
      },
    },
    {
      kind: 'collection',
      showAuthor: false,
      collection: {
        id: 'course-locked-1',
        collectionType: 'course',
        title: 'Course: Modern Web Development Bootcamp',
        authorName: 'Sarah',
        publishedAt: '2024-12-20',
        coverUrl: 'https://picsum.photos/500/300?image=101',
        itemsCount: 12,
        locked: true,
      },
    },
    {
      kind: 'collection',
      showAuthor: true,
      collection: {
        id: 'library-no-cover-1',
        collectionType: 'library',
        title: 'Library: Saved Resources & References',
        authorName: 'Nadia',
        authorAvatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
        profileBadge: 'u2',
        publishedAt: new Date('2025-01-03'),
        itemsCount: 42,
        locked: false,
      },
    },
    {
      kind: 'collection',
      showAuthor: true,
      collection: {
        id: 'list-1',
        collectionType: 'list',
        title: 'List: Lo-fi + Focus (Weekly Picks)',
        authorName: 'Nadia',
        authorAvatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
        profileBadge: 'u2',
        publishedAt: '2024-11-02',
        coverUrl: 'https://picsum.photos/500/300?image=1015',
        itemsCount: 18,
        locked: false,
      },
    },
    {
      kind: 'collection',
      showAuthor: true,
      collection: {
        id: 'album-broken-cover-1',
        collectionType: 'album',
        title: 'Album with broken cover should fallback.',
        authorName: 'Val',
        authorAvatarUrl: 'https://invalid.invalid/avatar.jpg',
        publishedAt: '2025-05-06',
        coverUrl: 'https://invalid.invalid/album.jpg',
        itemsCount: 6,
        locked: false,
      },
    },
    {
      kind: 'collection',
      showAuthor: false,
      collection: {
        id: 'bundle-1',
        collectionType: 'bundle',
        title: 'Bundle: Creator Starter Pack',
        authorName: 'Alicia',
        publishedAt: '2025-02-01',
        coverUrl: 'https://picsum.photos/500/300?image=903',
        itemsCount: 5,
        locked: false,
      },
    },
    {
      kind: 'collection',
      showAuthor: true,
      collection: {
        id: 'catalog-1',
        collectionType: 'catalog',
        title: 'Catalog: Templates & UI Kits',
        authorName: 'Mateo',
        authorAvatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
        publishedAt: '2025-03-10',
        coverUrl: 'https://picsum.photos/500/300?image=1067',
        itemsCount: 27,
        locked: false,
      },
    },
    {
      kind: 'collection',
      showAuthor: true,
      collection: {
        id: 'volume-no-items-1',
        collectionType: 'volume',
        title: 'Volume: Photo Essays — Vol. 3',
        authorName: 'Aya',
        authorAvatarUrl: 'https://randomuser.me/api/portraits/women/83.jpg',
        profileBadge: 'u1',
        publishedAt: new Date('2025-04-18'),
        coverUrl: 'https://picsum.photos/500/300?image=989',
        locked: true,
      },
    },
    {
      kind: 'collection',
      showAuthor: false,
      collection: {
        id: 'archive-1',
        collectionType: 'archive',
        title: 'Archive: 2023 Highlights',
        authorName: 'Val',
        publishedAt: '2024-01-12',
        coverUrl: 'https://picsum.photos/500/300?image=1044',
        itemsCount: 99,
        locked: false,
      },
    },

    // Collections: custom user-defined types (default icon mdi-tray-full)
    {
      kind: 'collection',
      showAuthor: true,
      collection: {
        id: 'custom-1',
        collectionType: 'estampillas',
        title: 'Estampillas: rare set (user defined type)',
        authorName: 'Base User',
        authorAvatarUrl: 'https://randomuser.me/api/portraits/men/52.jpg',
        publishedAt: '2025-05-19',
        coverUrl: 'https://picsum.photos/500/300?image=1074',
        itemsCount: 14,
        locked: false,
      },
    },
    {
      kind: 'collection',
      showAuthor: true,
      collection: {
        id: 'custom-2',
        collectionType: 'my-stamps_collection',
        title: 'Custom type with separators should Title Case',
        authorName: 'Jordan',
        authorAvatarUrl: 'https://invalid.invalid/avatar.png',
        profileBadge: 'u2',
        publishedAt: '2025-05-20',
        itemsCount: 3,
        locked: false,
      },
    },

    // Entries: Video
    {
      kind: 'entry',
      showAuthor: true,
      entry: {
        id: 'video-locked-1',
        type: 'video',
        title: 'One meets his destiny on the road he takes to avoid it.',
        authorName: 'Shamus',
        authorAvatarUrl: 'https://randomuser.me/api/portraits/women/21.jpg',
        profileBadge: 'u2',
        publishedAt: '2024-10-06',
        thumbnailUrl: 'https://picsum.photos/500/300?image=88',
        durationSec: 836,
        locked: true,
      },
    },
    {
      kind: 'entry',
      showAuthor: true,
      entry: {
        id: 'video-open-long-1',
        type: 'video',
        title: 'First steps: build your creator profile and publish.',
        authorName: 'Alicia',
        authorAvatarUrl: 'https://randomuser.me/api/portraits/women/68.jpg',
        publishedAt: new Date('2025-06-28'),
        thumbnailUrl: 'https://picsum.photos/500/300?image=903',
        durationSec: 5400,
        locked: false,
      },
    },
    {
      kind: 'entry',
      showAuthor: false,
      entry: {
        id: 'video-open-short-1',
        type: 'video',
        title: 'Meal prep: 4 lunches in 20 minutes.',
        authorName: 'Val',
        publishedAt: '2024-10-29',
        thumbnailUrl: 'https://picsum.photos/500/300?image=1044',
        durationSec: 119,
        locked: false,
      },
    },
    {
      kind: 'entry',
      showAuthor: true,
      entry: {
        id: 'video-no-thumb-1',
        type: 'video',
        title: 'Video without thumbnail (src missing).',
        authorName: 'Base User',
        authorAvatarUrl: 'https://randomuser.me/api/portraits/men/52.jpg',
        publishedAt: '2025-01-02',
        durationSec: 92,
        locked: false,
      },
    },
    {
      kind: 'entry',
      showAuthor: true,
      entry: {
        id: 'video-broken-thumb-1',
        type: 'video',
        title: 'Video with broken thumbnail should fallback.',
        authorName: 'Jordan',
        authorAvatarUrl: 'https://invalid.invalid/avatar.png',
        profileBadge: 'u1',
        publishedAt: '2025-01-05',
        thumbnailUrl: 'https://invalid.invalid/video.jpg',
        durationSec: 321,
        locked: false,
      },
    },

    // Entries: Audio
    {
      kind: 'entry',
      showAuthor: true,
      entry: {
        id: 'audio-open-1',
        type: 'audio',
        title: 'Podcast: Creative Process Unveiled',
        authorName: 'Sarah Mitchell',
        authorAvatarUrl: 'https://randomuser.me/api/portraits/women/21.jpg',
        publishedAt: '2024-12-10',
        thumbnailUrl: 'https://picsum.photos/500/300?image=777',
        durationSec: 45 * 60 + 12,
        locked: false,
      },
    },
    {
      kind: 'entry',
      showAuthor: false,
      entry: {
        id: 'audio-no-thumb-1',
        type: 'audio',
        title: 'Audio without thumbnail (src missing).',
        authorName: 'Nadia',
        publishedAt: '2025-02-10',
        durationSec: 180,
        locked: false,
      },
    },
    {
      kind: 'entry',
      showAuthor: true,
      entry: {
        id: 'audio-broken-thumb-1',
        type: 'audio',
        title: 'Audio with broken image should fallback.',
        authorName: 'Nadia',
        authorAvatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
        profileBadge: 'u1',
        publishedAt: '2025-02-14',
        thumbnailUrl: 'https://invalid.invalid/audio-thumb.jpg',
        durationSec: 180,
        locked: false,
      },
    },
    {
      kind: 'entry',
      showAuthor: true,
      entry: {
        id: 'audio-locked-1',
        type: 'audio',
        title: 'Locked audio (tests grayscale + lock overlay).',
        authorName: 'Aya',
        authorAvatarUrl: 'https://randomuser.me/api/portraits/women/83.jpg',
        publishedAt: '2025-03-01',
        thumbnailUrl: 'https://picsum.photos/500/300?image=901',
        durationSec: 3200,
        locked: true,
      },
    },

    // Entries: Image
    {
      kind: 'entry',
      showAuthor: true,
      entry: {
        id: 'image-open-1',
        type: 'image',
        title: 'Morning light on concrete — minimal photo set.',
        authorName: 'Mateo',
        authorAvatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
        publishedAt: '2025-01-15',
        thumbnailUrl: 'https://picsum.photos/500/300?image=1067',
        locked: false,
      },
    },
    {
      kind: 'entry',
      showAuthor: false,
      entry: {
        id: 'image-no-thumb-1',
        type: 'image',
        title: 'Image without thumbnail (src missing).',
        authorName: 'Base User',
        publishedAt: '2025-01-16',
        locked: false,
      },
    },
    {
      kind: 'entry',
      showAuthor: true,
      entry: {
        id: 'image-broken-thumb-1',
        type: 'image',
        title: 'Image with broken URL should fallback.',
        authorName: 'Aya',
        authorAvatarUrl: 'https://invalid.invalid/avatar.jpg',
        profileBadge: 'u2',
        publishedAt: '2025-03-08',
        thumbnailUrl: 'https://invalid.invalid/image.jpg',
        locked: false,
      },
    },
    {
      kind: 'entry',
      showAuthor: true,
      entry: {
        id: 'image-locked-1',
        type: 'image',
        title: 'Locked image (tests lock overlay).',
        authorName: 'Jordan',
        publishedAt: '2025-03-09',
        thumbnailUrl: 'https://picsum.photos/500/300?image=1002',
        locked: true,
      },
    },

    // Entries: Entry (text)
    {
      kind: 'entry',
      showAuthor: true,
      entry: {
        id: 'entry-open-1',
        type: 'entry',
        title: 'The Art of Storytelling in Digital Media (long title to test clamp and layout across multiple lines).',
        authorName: 'Sarah Mitchell',
        authorAvatarUrl: 'https://randomuser.me/api/portraits/women/21.jpg',
        profileBadge: 'u1',
        publishedAt: '2024-12-18',
        locked: false,
      },
    },
    {
      kind: 'entry',
      showAuthor: false,
      entry: {
        id: 'entry-no-thumb-1',
        type: 'entry',
        title: 'Entry without thumbnail (src missing).',
        authorName: 'Alicia',
        publishedAt: '2025-04-01',
        locked: false,
      },
    },
    {
      kind: 'entry',
      showAuthor: true,
      entry: {
        id: 'entry-locked-1',
        type: 'entry',
        title: 'Locked entry (tests grayscale + lock overlay).',
        authorName: 'Mateo',
        authorAvatarUrl: 'https://invalid.invalid/avatar.png',
        profileBadge: 'u2',
        publishedAt: new Date('2025-04-02'),
        thumbnailUrl: 'https://picsum.photos/500/300?image=1050',
        locked: true,
      },
    },
  ]
</script>
