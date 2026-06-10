<template>
  <div>
    <!--
      Loading the space metadata first lets the page render its title +
      icon header before the entry grid hydrates. The grid resolves its
      own loading / empty / error states downstream.
    -->
    <v-container v-if="loadingSpace" class="d-flex justify-center py-12" fluid>
      <v-progress-circular indeterminate />
    </v-container>

    <v-container v-else-if="loadError" class="py-12 text-center" fluid>
      <v-icon class="mb-2" color="grey" icon="mdi-alert-circle-outline" size="48" />
      <div class="text-body-1 text-medium-emphasis">{{ loadError }}</div>
    </v-container>

    <template v-else-if="space">
      <v-container class="py-4 px-4 d-flex align-center ga-3" fluid>
        <v-icon :icon="space.icon || 'mdi-folder-outline'" size="32" />
        <div>
          <div class="text-h6">{{ resolveSpaceTitle(space) }}</div>
        </div>
      </v-container>

      <v-divider />

      <EntryCardMockGrid :feed-fn="feedFn" />
    </template>
  </div>
</template>

<script lang="ts" setup>
  import type { FeedPageModel, FeedRequestParams } from '@/api/api'
  import type { SpaceSummaryDto } from '@/api/modules/spaces.api'
  import { computed, onMounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRoute } from 'vue-router'
  import { api } from '@/api/api'
  import EntryCardMockGrid from '@/components/entry/EntryCardMockGrid.vue'

  const route = useRoute()
  const { locale, t } = useI18n()

  const space = ref<SpaceSummaryDto | null>(null)
  const loadingSpace = ref(true)
  const loadError = ref<string | null>(null)

  const spaceId = computed(() => String((route.params as Record<string, string | string[] | undefined>).spaceId ?? ''))

  // Bound to the grid; closes over spaceId so navigating between
  // /spaces/:a → /spaces/:b after a watch() reload always fetches the
  // currently-routed space and never the stale one.
  const feedFn = computed(() => (params: FeedRequestParams): Promise<FeedPageModel> => {
    return api.spaces.getFeed(spaceId.value, params)
  })

  /**
   * Title resolution mirrors the sidebar:
   *   - system Explore space → global i18n key (its baseName is null);
   *   - other spaces → translated name for the current locale, falling
   *     back to the English baseName, finally to the key.
   */
  function resolveSpaceTitle (s: SpaceSummaryDto): string {
    if (s.systemSpace && s.key === 'explore') {
      return t('AppBar.explore')
    }
    return s.translations?.[locale.value] || s.baseName || s.key
  }

  async function loadSpace () {
    loadingSpace.value = true
    loadError.value = null
    space.value = null
    try {
      // listSidebar already returns this space when it's flagged for the
      // sidebar; reusing it avoids a second round-trip when the user lands
      // here from the sidebar. For deep-linked / non-sidebar spaces we
      // fall back to the dedicated endpoint.
      const list = await api.spaces.listSidebar()
      space.value = list.find(s => s.id === spaceId.value) ?? null
      if (!space.value) {
        // Direct fetch — the per-space endpoint also returns 404 for
        // archived/unknown spaces, which is the same UX we want here.
        const direct = await fetchSpaceDirect(spaceId.value)
        space.value = direct
      }
      if (!space.value) {
        loadError.value = 'Space not found.'
      }
    } catch {
      loadError.value = 'Failed to load space.'
    } finally {
      loadingSpace.value = false
    }
  }

  async function fetchSpaceDirect (id: string): Promise<SpaceSummaryDto | null> {
    // Lightweight inline fetch instead of importing axios separately —
    // avoids polluting the spaces.api with a one-off endpoint that is
    // only used by this fallback path.
    const { default: axios } = await import('@/api/axios/axiosClient')
    try {
      const res = await axios.get<SpaceSummaryDto>(`/public/spaces/${encodeURIComponent(id)}`)
      return res.data
    } catch {
      return null
    }
  }

  onMounted(loadSpace)
  watch(spaceId, loadSpace)
</script>

<route lang="json">
{
  "path": "/spaces/:spaceId"
}
</route>
