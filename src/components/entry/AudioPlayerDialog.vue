<!--
  Audio Player Dialog

  RESPONSIVE BEHAVIOR:
  - Mobile (< 960px): Opens as v-bottom-sheet (Spotify-like)
  - Desktop (>= 960px): Opens as v-dialog (centered modal)

  LOCKED CONTENT:
  - If entry.locked === true, shows paywall CTA instead of player controls
  - Paywall CTA navigates to /preview/:id

  QUEUE SUPPORT:
  - Optional queueIds + currentIndex props for playlist navigation
  - Shows prev/next buttons only when queue is provided
-->
<template>
  <!-- Mobile: Bottom Sheet -->
  <v-bottom-sheet
    v-if="isMobile"
    v-model="isOpen"
    :persistent="isPlaying"
    :scrim="true"
  >
    <v-card class="rounded-t-xl" color="surface">
      <AudioPlayerContent
        :current-index="currentIndex"
        :entry="entry"
        :error="error"
        :error-message="errorMessage"
        :loading="loading"
        :queue-ids="queueIds"
        @close="close"
        @navigate-preview="navigateToPreview"
        @next="playNext"
        @open-details="openDetails"
        @prev="playPrev"
      />
    </v-card>
  </v-bottom-sheet>

  <!-- Desktop: Dialog -->
  <v-dialog
    v-else
    v-model="isOpen"
    max-width="480"
    :persistent="isPlaying"
  >
    <v-card class="rounded-xl" color="surface">
      <AudioPlayerContent
        :current-index="currentIndex"
        :entry="entry"
        :error="error"
        :error-message="errorMessage"
        :loading="loading"
        :queue-ids="queueIds"
        @close="close"
        @navigate-preview="navigateToPreview"
        @next="playNext"
        @open-details="openDetails"
        @prev="playPrev"
      />
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { EntryModel } from '@/api/api'

  import { computed, defineAsyncComponent, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'

  import { api } from '@/api/api'
  import { useAppStore } from '@/stores/app'

  // Lazy-load internal content component
  const AudioPlayerContent = defineAsyncComponent(() =>
    import('./AudioPlayerContent.vue'),
  )

  interface Props {
    modelValue: boolean
    entryId: string
    /** Optional queue of entry IDs for playlist navigation */
    queueIds?: string[]
    /** Current index in the queue */
    currentIndex?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    queueIds: () => [],
    currentIndex: 0,
  })

  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'update:currentIndex': [value: number]
  }>()

  const router = useRouter()
  const appStore = useAppStore()

  // Responsive check
  const isMobile = computed(() => appStore.mobileView)

  // Dialog state
  const isOpen = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value),
  })

  // Data state
  const entry = ref<EntryModel | null>(null)
  const loading = ref(false)
  const error = ref(false)
  const errorMessage = ref('')

  // Player state (for persistent check)
  const isPlaying = ref(false)

  // Fetch entry data
  async function fetchEntry (id: string) {
    if (!id) return

    loading.value = true
    error.value = false
    errorMessage.value = ''

    try {
      const data = await api.mock.getEntryById(id)
      entry.value = data
    } catch (error_: unknown) {
      console.error('[AudioPlayerDialog] Failed to fetch entry:', error_)
      error.value = true
      errorMessage.value = error_ instanceof Error ? error_.message : 'Failed to load audio'
    } finally {
      loading.value = false
    }
  }

  // Navigation
  function close () {
    isPlaying.value = false
    isOpen.value = false
  }

  function openDetails () {
    if (entry.value) {
      close()
      router.push(`/listen/${entry.value.id}`)
    }
  }

  function navigateToPreview () {
    if (entry.value) {
      close()
      router.push(`/preview/${entry.value.id}`)
    }
  }

  // Queue navigation
  function playNext () {
    if (props.queueIds.length > 0 && props.currentIndex < props.queueIds.length - 1) {
      emit('update:currentIndex', props.currentIndex + 1)
    }
  }

  function playPrev () {
    if (props.queueIds.length > 0 && props.currentIndex > 0) {
      emit('update:currentIndex', props.currentIndex - 1)
    }
  }

  // Watch for entry ID changes
  watch(
    () => props.entryId,
    newId => {
      if (newId && isOpen.value) {
        fetchEntry(newId)
      }
    },
    { immediate: true },
  )

  // Watch for dialog open
  watch(isOpen, open => {
    if (open && props.entryId) {
      fetchEntry(props.entryId)
    }
  })

  // Watch for queue index changes
  watch(
    () => props.currentIndex,
    () => {
      const queueEntry = props.queueIds[props.currentIndex]
      if (props.queueIds.length > 0 && queueEntry) {
        fetchEntry(queueEntry)
      }
    },
  )
</script>
