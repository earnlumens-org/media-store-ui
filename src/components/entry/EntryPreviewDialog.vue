<!--
  Entry Preview Dialog (Quick Read Modal)

  RESPONSIVE BEHAVIOR:
  - Mobile (< 960px): Opens as v-bottom-sheet
  - Desktop (>= 960px): Opens as v-dialog (centered modal)

  LOCKED CONTENT:
  - If entry.locked === true, shows paywall CTA instead of full content
  - Paywall CTA navigates to /preview/:id

  SHORT/LONG THRESHOLD:
  - SHORT: content length <= 600 characters (shows in modal)
  - LONG: content length > 600 characters (redirects to /read/:id)
  - If no content field exists, defaults to PAGE behavior
-->
<template>
  <!-- Mobile: Bottom Sheet -->
  <v-bottom-sheet
    v-if="isMobile"
    v-model="isOpen"
    :scrim="true"
  >
    <v-card class="rounded-t-xl" color="surface">
      <EntryPreviewContent
        :entry="entry"
        :error="error"
        :error-message="errorMessage"
        :loading="loading"
        @close="close"
        @navigate-preview="navigateToPreview"
        @open-full-page="openFullPage"
      />
    </v-card>
  </v-bottom-sheet>

  <!-- Desktop: Dialog -->
  <v-dialog
    v-else
    v-model="isOpen"
    max-width="600"
  >
    <v-card class="rounded-xl" color="surface">
      <EntryPreviewContent
        :entry="entry"
        :error="error"
        :error-message="errorMessage"
        :loading="loading"
        @close="close"
        @navigate-preview="navigateToPreview"
        @open-full-page="openFullPage"
      />
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { EntryModel } from '@/api/api'

  import { computed, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'

  import { api } from '@/api/api'
  import { useAppStore } from '@/stores/app'

  import EntryPreviewContent from './EntryPreviewContent.vue'

  interface Props {
    modelValue: boolean
    entryId: string
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
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

  // Fetch entry data
  async function fetchEntry () {
    if (!props.entryId) return

    loading.value = true
    error.value = false
    errorMessage.value = ''

    try {
      // Force type 'entry' for this component
      const data = await api.mock.getEntryById(props.entryId, 'entry')
      entry.value = data
    } catch (error_: unknown) {
      console.error('[EntryPreviewDialog] Failed to fetch entry:', error_)
      error.value = true
      errorMessage.value = error_ instanceof Error ? error_.message : 'Failed to load entry'
    } finally {
      loading.value = false
    }
  }

  // Navigation
  function close () {
    isOpen.value = false
  }

  function openFullPage () {
    if (entry.value) {
      close()
      router.push(`/read/${entry.value.id}`)
    }
  }

  function navigateToPreview () {
    if (entry.value) {
      close()
      router.push(`/preview/${entry.value.id}`)
    }
  }

  // Watch for dialog open/close
  watch(isOpen, newValue => {
    if (newValue) {
      fetchEntry()
    }
  })

  // Watch for entry ID changes
  watch(() => props.entryId, (newId, oldId) => {
    if (newId !== oldId && isOpen.value) {
      fetchEntry()
    }
  })
</script>
