<template>
  <v-dialog
    v-model="dialog"
    fullscreen
    :scrim="false"
    transition="dialog-top-transition"
  >
    <template #activator="{ props: activatorProps }">
      <v-btn
        v-bind="activatorProps"
        :aria-label="$t('Common.search')"
        class="my-1"
        color="grey"
        icon="mdi-magnify"
      />
    </template>

    <v-card>
      <v-toolbar color="surface" elevation="0">
        <v-btn class="ml-1" icon="mdi-arrow-left" @click="dialog = false" />

        <v-text-field
          v-model="search"
          autofocus
          class="mr-2"
          clearable
          density="comfortable"
          hide-details
          :placeholder="$t('Search.placeholder')"
          rounded
          single-line
          variant="solo-filled"
          @keyup.enter="submit(search)"
        />

        <v-btn
          :aria-label="$t('Common.search')"
          icon="mdi-magnify"
          @click="submit(search)"
        />
      </v-toolbar>

      <v-divider />

      <v-list class="py-0" lines="one">
        <!-- Live autocomplete suggestions while typing -->
        <template v-if="trimmedSearch && suggestions.length > 0">
          <v-list-item
            v-for="(item, i) in suggestions"
            :key="`sug-${i}`"
            :title="item"
            @click="submit(item)"
          >
            <template #prepend>
              <v-icon class="text-medium-emphasis">mdi-magnify</v-icon>
            </template>
          </v-list-item>
        </template>

        <!-- Recent searches (shown when the box is empty), YouTube-style -->
        <template v-else-if="!trimmedSearch && history.length > 0">
          <v-list-subheader class="d-flex align-center">
            <span>{{ $t('Search.recentSearches') }}</span>
            <v-spacer />
            <v-btn
              class="text-none"
              color="primary"
              size="small"
              variant="text"
              @click="clear"
            >
              {{ $t('Search.clearHistory') }}
            </v-btn>
          </v-list-subheader>

          <v-list-item
            v-for="(item, i) in history"
            :key="`hist-${i}`"
            :title="item"
            @click="submit(item)"
          >
            <template #prepend>
              <v-icon class="text-medium-emphasis">mdi-history</v-icon>
            </template>
            <template #append>
              <v-btn
                :aria-label="$t('Common.remove')"
                density="comfortable"
                icon="mdi-close"
                size="small"
                variant="text"
                @click.stop="remove(item)"
              />
            </template>
          </v-list-item>
        </template>

        <!-- Empty hint -->
        <v-list-item
          v-else-if="!trimmedSearch"
          class="text-medium-emphasis text-center py-8"
          :title="$t('Search.startTyping')"
        />
      </v-list>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'

  import { api } from '@/api/api'
  import { useSearchHistory } from '@/composables/useSearchHistory'

  const router = useRouter()
  const { history, add, remove, clear, refresh } = useSearchHistory()

  const dialog = ref(false)
  const search = ref('')
  const suggestions = ref<string[]>([])

  const trimmedSearch = computed(() => (search.value ?? '').trim())

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let suggestController: AbortController | null = null

  watch(search, value => {
    const term = (value ?? '').trim()
    if (debounceTimer) clearTimeout(debounceTimer)
    if (suggestController) suggestController.abort()

    if (!term) {
      suggestions.value = []
      return
    }

    debounceTimer = setTimeout(async () => {
      suggestController = new AbortController()
      try {
        suggestions.value = await api.search.suggestions(term, suggestController.signal)
      } catch {
        // network/cancel — drop suggestions silently
        suggestions.value = []
      }
    }, 200)
  })

  // Refresh history each time the dialog opens so removals/additions made on
  // the results page are reflected here.
  watch(dialog, open => {
    if (open) {
      refresh()
    } else {
      search.value = ''
      suggestions.value = []
    }
  })

  function submit (term: string) {
    const value = (term ?? '').trim()
    if (!value) return
    add(value)
    dialog.value = false
    router.push({ path: '/results', query: { q: value } })
  }
</script>
