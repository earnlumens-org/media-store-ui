<template>
  <v-overlay
    class="d-flex align-center justify-center"
    :model-value="loading"
    opacity="0.9"
    persistent
    scrim="black"
  >
    <v-progress-circular color="white" indeterminate size="64" />
  </v-overlay>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'

  const loading = ref(true)

  const route = useRoute()
  const router = useRouter()

  const UUID_REGEX
    = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  watch(
    () => route.query.UUID,
    uuid => {
      const uuidValue = typeof uuid === 'string' ? uuid : null

      if (!uuidValue || !UUID_REGEX.test(uuidValue)) {
        router.replace('/')
      }
    },
    { immediate: true },
  )
</script>

<route lang="yaml">
path: /oauth2/callback
name: AuthXCallback
</route>
