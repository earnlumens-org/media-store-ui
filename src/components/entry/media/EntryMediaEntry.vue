<template>
  <router-link class="position-relative d-block text-decoration-none" style="color: inherit" :to="entryRoute">
    <MediaFrame
      fallback-color="deep-purple-lighten-4"
      fallback-icon="mdi-text-box-outline"
      fallback-icon-color="grey-darken-4"
      :grayscale="Boolean(entry.locked)"
      :src="entry.thumbnailUrl"
    >
      <template #overlay>
        <v-avatar
          class="position-absolute top-0 right-0 ma-2 text-white"
          color="rgba(0, 0, 0, 0.65)"
          size="28"
        >
          <v-icon size="16">mdi-text-box-outline</v-icon>
        </v-avatar>
      </template>
    </MediaFrame>

    <!-- Overlay Blocked -->
    <v-overlay
      class="d-flex align-center justify-center rounded-lg"
      :close-on-back="false"
      contained
      :model-value="entry.locked"
      persistent
      scrim="rgba(0, 0, 0, 0.55)"
    >
      <v-btn
        color="white"
        prepend-icon="mdi-lock"
        rounded="pill"
        :to="entryRoute"
        variant="elevated"
      >
        {{ $t('Common.blocked') }}
      </v-btn>
    </v-overlay>
  </router-link>
</template>

<script setup lang="ts">
  import type { Entry } from '../EntryCard.vue'

  import { computed } from 'vue'

  import MediaFrame from '@/components/media/MediaFrame.vue'

  import { getEntryRoute } from '../entryRoute'

  const props = defineProps<{ entry: Entry }>()

  const entryRoute = computed(() => getEntryRoute(props.entry))
</script>
