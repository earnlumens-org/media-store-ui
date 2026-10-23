<template>
  <v-container class="fill-height">
    <v-row align="center" justify="center">
      <v-col
        class="text-center"
        cols="12"
        lg="4"
        md="6"
        sm="8"
      >
        <v-icon color="error" size="120">mdi-shield-off-outline</v-icon>
        <h2 class="text-h5 mt-4 mb-2">Content removed for policy reasons</h2>
        <p class="text-body-2 text-medium-emphasis mb-4">
          This content was taken down by moderation because it was found to violate our policies or the law.
          It is no longer available to anyone, in any version.
        </p>
        <v-alert
          v-if="disputeId"
          class="text-left mb-6"
          density="compact"
          type="info"
          variant="tonal"
        >
          <div class="font-weight-medium">You purchased this content.</div>
          <div class="text-body-2">
            Your purchase is kept on record and a dispute has been opened automatically for an administrator to review.
            Reference: <code>{{ disputeId }}</code>
          </div>
        </v-alert>
        <div class="d-flex ga-2 justify-center">
          <v-btn
            color="primary"
            prepend-icon="mdi-arrow-left"
            variant="flat"
            @click="emit('back')"
          >
            Go Back
          </v-btn>
          <v-btn
            prepend-icon="mdi-home"
            variant="outlined"
            @click="emit('home')"
          >
            Go Home
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  // Shown when the API answers 451 CONTENT_BLOCKED (MYCELIUM-RESILIENCE.md H3):
  // never a generic "not found" — buyers get a reference to their dispute.
  defineProps<{ disputeId?: string | null }>()
  const emit = defineEmits<{ (e: 'back' | 'home'): void }>()
</script>
