<template>
  <v-sheet class="position-relative" height="85">
    <v-card-text class="px-1 pt-2 pb-0 d-flex align-start">
      <v-avatar
        v-if="showAuthor"
        class="me-4 flex-shrink-0"
        size="48"
      >
        <v-img :src="entry.authorAvatarUrl" />
      </v-avatar>

      <div class="flex-grow-1">
        <!-- Título: máximo 2 líneas con ellipsis -->
        <div
          class="text-body-1 font-weight-medium text-medium-emphasis"
          :style="{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }"
        >
          {{ entry.title }}
        </div>

        <!-- Nombre del autor -->
        <div
          v-if="showAuthor"
          class="text-body-1 font-weight-medium mt-1"
        >
          {{ entry.authorName }}
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
          <v-list-item>Compartir</v-list-item>
          <v-list-item>Guardar</v-list-item>
          <v-list-item>Denunciar</v-list-item>
        </v-list>
      </v-menu>
    </v-card-text>

    <!-- Fecha anclada a la esquina inferior derecha -->
    <div class="position-absolute bottom-0 right-0 mr-2 mb-1 text-caption text-medium-emphasis">
      {{ formattedDate }}
    </div>
  </v-sheet>
</template>

<script setup lang="ts">
  import type { Entry } from './EntryCard.vue'

  import { computed } from 'vue'

  interface Props {
    entry: Entry
    showAuthor?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    showAuthor: true,
  })

  const formattedDate = computed(() => {
    const date = props.entry.publishedAt instanceof Date
      ? props.entry.publishedAt
      : new Date(props.entry.publishedAt)

    return date.toLocaleDateString('en-CA') // formato YYYY/MM/DD
  })
</script>
