<template>
  <v-sheet class="position-relative" height="84">
    <v-card-text class="px-1 pt-2 pb-0 d-flex align-start">
      <router-link
        v-if="showAuthor"
        class="me-4 flex-shrink-0"
        :to="`/${collection.authorName}`"
      >
        <AvatarFrame
          :size="48"
          :src="collection.authorAvatarUrl"
        />
      </router-link>

      <div class="flex-grow-1">
        <router-link
          class="text-body-1 font-weight-medium text-medium-emphasis text-decoration-none d-block"
          style="color: inherit"
          :to="`/collection/${collection.id}`"
        >
          <div
            :style="{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }"
          >
            {{ collection.title }}
          </div>
        </router-link>

        <div
          v-if="showAuthor"
          class="text-body-1 font-weight-medium mt-1 d-flex align-center"
        >
          <router-link
            class="text-decoration-none"
            style="color: inherit"
            :to="`/${collection.authorName}`"
          >
            {{ collection.authorName }}
          </router-link>
          <v-avatar
            v-if="profileBadgeSrc"
            class="ms-2 flex-shrink-0"
            color="transparent"
            size="18"
          >
            <v-img :src="profileBadgeSrc" />
          </v-avatar>
        </div>
      </div>

      <v-menu>
        <template #activator="{ props: menuProps }">
          <v-btn
            v-bind="menuProps"
            class="mt-2"
            density="compact"
            icon="mdi-dots-vertical"
            variant="text"
          />
        </template>

        <v-list density="compact">
          <v-list-item>{{ $t('Common.share') }}</v-list-item>
          <v-list-item>{{ $t('Common.saveToFavorites') }}</v-list-item>
          <v-list-item>{{ $t('Common.report') }}</v-list-item>
        </v-list>
      </v-menu>
    </v-card-text>

    <div
      v-if="!showAuthor"
      class="position-absolute bottom-0 left-0 ml-2 mb-1 text-caption text-medium-emphasis"
    >
      <span v-if="collection.itemsCount">{{ collection.itemsCount }} items</span>
      <span v-else>{{ collection.collectionType }}</span>
    </div>

    <div class="position-absolute bottom-0 right-0 mr-2 mb-0 text-caption text-medium-emphasis">
      {{ formattedDate }}
    </div>
  </v-sheet>
</template>

<script setup lang="ts">
  import type { Collection } from './CollectionCard.vue'

  import { computed } from 'vue'

  import AvatarFrame from '@/components/media/AvatarFrame.vue'

  import { getProfileBadgeSrc } from '@/lib/profileBadge'

  interface Props {
    collection: Collection
    showAuthor?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    showAuthor: true,
  })

  const formattedDate = computed(() => {
    const date = props.collection.publishedAt instanceof Date
      ? props.collection.publishedAt
      : new Date(props.collection.publishedAt)

    return date.toLocaleDateString('en-CA')
  })

  const profileBadgeSrc = computed(() => getProfileBadgeSrc(props.collection.profileBadge))
</script>
