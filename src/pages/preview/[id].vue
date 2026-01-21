<!--
  Preview Page (Placeholder)

  This page handles locked/paid content preview.
  When a user tries to access locked content, they are redirected here.

  TODO: Implement full preview page with:
  - Blurred/partial content preview
  - Paywall panel with price and benefits
  - Checkout modal integration
  - "Already purchased" check
-->
<template>
  <v-container class="fill-height">
    <v-row align="center" justify="center">
      <v-col
        cols="12"
        lg="6"
        md="8"
        sm="10"
      >
        <v-card class="text-center pa-6" variant="tonal">
          <v-icon color="warning" size="80">mdi-lock-outline</v-icon>

          <v-card-title class="text-h5 mt-4">
            Preview Page
          </v-card-title>

          <v-card-subtitle class="text-body-1 mt-2">
            Content ID: {{ entryId }}
          </v-card-subtitle>

          <v-card-text class="text-body-2 text-medium-emphasis mt-4">
            Preview page not implemented yet.
            This page will show a preview of locked content with a paywall panel.
          </v-card-text>

          <v-card-actions class="justify-center mt-4">
            <v-btn
              color="primary"
              prepend-icon="mdi-arrow-left"
              variant="flat"
              @click="goBack"
            >
              Go Back
            </v-btn>
            <v-btn
              prepend-icon="mdi-home"
              variant="outlined"
              @click="goHome"
            >
              Go Home
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useRoute, useRouter } from 'vue-router'

  const route = useRoute()
  const router = useRouter()

  // Route param - cast to handle typed router union
  const entryId = computed(() => {
    const params = route.params as { id?: string }
    return params.id ?? ''
  })

  function goBack () {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  function goHome () {
    router.push('/')
  }
</script>

<route lang="json">
{
  "path": "/preview/:id"
}
</route>
