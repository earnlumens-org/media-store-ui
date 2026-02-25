<template>
  <v-sheet class="position-relative" height="84">
    <v-card-text class="px-1 pt-2 pb-0 d-flex align-start">
      <router-link
        v-if="showAuthor"
        class="me-4 flex-shrink-0"
        :to="`/${entry.authorName}`"
      >
        <AvatarFrame
          :size="48"
          :src="entry.authorAvatarUrl"
        />
      </router-link>

      <div class="flex-grow-1 overflow-hidden">
        <!-- Título: máximo 2 líneas con ellipsis -->
        <router-link
          class="text-body-1 font-weight-medium text-medium-emphasis text-decoration-none d-block"
          style="color: inherit"
          :to="entryRoute"
        >
          <div
            :style="{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }"
          >
            {{ entry.title }}
          </div>
        </router-link>

        <!-- Nombre del autor + fecha -->
        <div
          v-if="showAuthor"
          class="mt-1 d-flex align-center justify-space-between"
        >
          <div class="d-flex align-center overflow-hidden" style="min-width: 0">
            <router-link
              class="text-body-1 font-weight-medium text-decoration-none text-truncate"
              style="color: inherit"
              :to="`/${entry.authorName}`"
            >
              {{ entry.authorName }}
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
          <span class="text-caption text-medium-emphasis flex-shrink-0 ms-3 text-no-wrap">{{ formattedDate }}</span>
        </div>
        <!-- Solo fecha (sin autor) -->
        <div
          v-else
          class="mt-1 d-flex justify-end"
        >
          <span class="text-caption text-medium-emphasis">{{ formattedDate }}</span>
        </div>
      </div>

      <!-- Menú de tres puntos -->
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

  </v-sheet>
</template>

<script setup lang="ts">
  import type { Entry } from './EntryCard.vue'

  import { computed } from 'vue'

  import AvatarFrame from '@/components/media/AvatarFrame.vue'

  import { getProfileBadgeSrc } from '@/lib/profileBadge'

  import { getEntryRoute } from './entryRoute'

  interface Props {
    entry: Entry
    showAuthor?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    showAuthor: true,
  })

  const entryRoute = computed(() => getEntryRoute(props.entry))

  const formattedDate = computed(() => {
    const date = props.entry.publishedAt instanceof Date
      ? props.entry.publishedAt
      : new Date(props.entry.publishedAt)

    return date.toLocaleDateString('en-CA') // formato YYYY/MM/DD
  })

  const profileBadgeSrc = computed(() => getProfileBadgeSrc(props.entry.profileBadge))
</script>
