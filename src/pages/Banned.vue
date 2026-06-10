<template>
  <v-container class="py-10" style="max-width: 760px">
    <v-card class="pa-2 pa-sm-4" elevation="2">
      <v-card-text>
        <div class="d-flex flex-column align-center text-center mb-6">
          <v-avatar class="mb-4" color="error" size="72" variant="tonal">
            <v-icon size="40">mdi-account-cancel</v-icon>
          </v-avatar>
          <h1 class="text-h5 font-weight-bold mb-2">
            {{ $t('Banned.title') }}
          </h1>
          <p class="text-body-2 text-medium-emphasis">
            {{ $t('Banned.subtitle') }}
          </p>
        </div>

        <v-alert class="mb-4" type="error" variant="tonal">
          <div class="text-subtitle-2 mb-1">
            {{ statusLabel }}
          </div>
          <div v-if="payload?.reason" class="text-body-2">
            <b>{{ $t('Banned.reasonLabel') }}:</b> {{ payload.reason }}
          </div>
          <div v-if="payload?.expiresAt" class="text-body-2">
            <b>{{ $t('Banned.expiresLabel') }}:</b> {{ formatDate(payload.expiresAt) }}
          </div>
          <div v-if="payload?.issuedAt" class="text-caption text-medium-emphasis mt-1">
            {{ $t('Banned.issuedAt', { date: formatDate(payload.issuedAt) }) }}
          </div>
        </v-alert>

        <v-divider class="my-4" />

        <h2 class="text-subtitle-1 font-weight-bold mb-3">
          {{ $t('Banned.howItWorksHeading') }}
        </h2>
        <SanctionLadderExplainer />

        <v-divider class="my-4" />

        <p class="text-body-2 mb-4">
          {{ $t('Banned.appealBody') }}
        </p>

        <div class="d-flex flex-wrap justify-center ga-2">
          <v-btn
            color="primary"
            prepend-icon="mdi-book-open-page-variant-outline"
            to="/guidelines"
            variant="tonal"
          >
            {{ $t('Banned.viewGuidelines') }}
          </v-btn>
          <v-btn
            prepend-icon="mdi-home-outline"
            to="/"
            variant="text"
          >
            {{ $t('Banned.backHome') }}
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
  import type { AccountBannedPayload } from '@/api/modules/auth.api'
  import { computed, onMounted, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import SanctionLadderExplainer from '@/components/sanctions/SanctionLadderExplainer.vue'

  const { t, locale } = useI18n()

  const payload = ref<AccountBannedPayload | null>(null)

  onMounted(() => {
    try {
      const raw = sessionStorage.getItem('accountBannedPayload')
      if (raw) {
        payload.value = JSON.parse(raw) as AccountBannedPayload
        // Single-use: clear after read so a refresh after manual unban does
        // not keep showing the stale ban screen.
        sessionStorage.removeItem('accountBannedPayload')
      }
    } catch {
      // Ignore JSON / sessionStorage errors; we'll show a generic message.
    }
  })

  const statusLabel = computed(() => {
    const banType = payload.value?.banType
    if (banType === 'PERMA_BAN') return t('Banned.statusPermanent')
    if (payload.value?.expiresAt) return t('Banned.statusTemporary')
    return t('Banned.statusGeneric')
  })

  function formatDate (iso: string): string {
    try {
      return new Date(iso).toLocaleString(locale.value, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return iso
    }
  }
</script>

<route lang="json">
{
  "path": "/banned",
  "meta": { "requiresAuth": false }
}
</route>
