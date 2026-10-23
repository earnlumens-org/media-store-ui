<template>
  <v-alert
    v-if="notice"
    class="mb-4"
    density="compact"
    :icon="notice.icon"
    :type="notice.type"
    variant="tonal"
  >
    <div class="font-weight-medium">{{ notice.title }}</div>
    <div class="text-body-2">{{ notice.text }}</div>
  </v-alert>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  /**
   * Buyer / creator-facing notice for an entry that is not publicly visible
   * but still reachable for this viewer (MYCELIUM-RESILIENCE.md H3 action 7):
   * in review, archived or deleted by the creator, not yet published. Nothing
   * is shown for PUBLISHED / UNLISTED or for anonymous visitors.
   */
  const props = defineProps<{
    status?: string | null
    viewerAccess?: string | null
  }>()

  type Notice = { type: 'info' | 'warning', icon: string, title: string, text: string }

  const notice = computed<Notice | null>(() => {
    const status = props.status
    if (!status || status === 'PUBLISHED' || status === 'UNLISTED') return null
    const buyer = props.viewerAccess === 'ENTITLED'
    const owner = props.viewerAccess === 'OWNER'
    if (!buyer && !owner) return null

    switch (status) {
      case 'IN_REVIEW': {
        return {
          type: 'info',
          icon: 'mdi-magnify-scan',
          title: 'This content is under review',
          text: buyer
            ? 'It has been reported and a moderator is reviewing it. You keep full access to what you purchased while the review is in progress.'
            : 'A moderator is reviewing it. It is hidden from the public until the review completes.',
        }
      }
      case 'ARCHIVED':
      case 'DELETED': {
        return {
          type: 'info',
          icon: 'mdi-archive-outline',
          title: status === 'ARCHIVED' ? 'Archived by the creator' : 'Removed by the creator',
          text: buyer
            ? 'The creator no longer lists this content publicly. Your purchase keeps your access.'
            : 'Only you and the people who purchased it can still open it.',
        }
      }
      case 'SUSPENDED':
      case 'REJECTED': {
        return {
          type: 'warning',
          icon: 'mdi-alert-outline',
          title: 'This content is not publicly available',
          text: buyer
            ? 'Your purchase keeps your access while the content is not public.'
            : 'It is hidden from the public following a moderation decision.',
        }
      }
      default: {
        return {
          type: 'info',
          icon: 'mdi-eye-off-outline',
          title: 'This content is not public yet',
          text: buyer
            ? 'Your purchase keeps your access.'
            : 'Only you can see it until it is published.',
        }
      }
    }
  })
</script>
