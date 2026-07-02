<!--
  ResellerButton.vue — MercadoLibre-style "EARN LUMENS" entry point

  A compact pill that opens the reseller link modal for a specific piece of
  paid content. Modeled after MercadoLibre's "Gana dinero" call to action, but
  scoped to the content the viewer is looking at.

  Visibility rules (all must hold):
  - The viewer is logged in.
  - The creator has resells enabled for this entry (`resellerEnabled`).
  - The viewer is not the content creator (when `authorId` is known).

  The heavy lifting (commission %, wallet validation, link generation) lives in
  ResellerDialog, which this button simply opens.
-->
<template>
  <template v-if="eligible">
    <v-btn
      :size="size"
      color="success"
      prepend-icon="mdi-share-variant"
      rounded="pill"
      variant="tonal"
      @click.stop.prevent="dialogOpen = true"
    >
      {{ $t('Reseller.cta') }}
    </v-btn>

    <ResellerDialog v-model="dialogOpen" :entry-id="entryId" />
  </template>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'

  import ResellerDialog from '@/components/reseller/ResellerDialog.vue'
  import { useAuthStore } from '@/stores/auth'

  const props = withDefaults(
    defineProps<{
      entryId: string
      resellerEnabled?: boolean
      authorId?: string
      size?: string
    }>(),
    {
      resellerEnabled: false,
      authorId: undefined,
      size: 'default',
    },
  )

  const authStore = useAuthStore()
  const dialogOpen = ref(false)

  const eligible = computed(() => {
    if (!props.resellerEnabled) return false
    if (!authStore.isAuthenticated) return false
    // Hide for the content creator — they can't resell their own content.
    if (props.authorId && authStore.user?.id && props.authorId === authStore.user.id) {
      return false
    }
    return true
  })
</script>
