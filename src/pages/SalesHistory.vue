<template>
  <v-container class="pa-2 pa-sm-4 pa-md-6 mx-auto" fluid style="max-width: 900px;">
    <!-- ── Header ──────────────────────────────────────────── -->
    <div class="d-flex align-center mb-6">
      <v-btn
        class="me-2"
        icon="mdi-arrow-left"
        size="small"
        variant="text"
        @click="router.push('/creator-studio')"
      />
      <div>
        <h1 class="text-h5 font-weight-bold">
          {{ t('SalesHistory.title') }}
        </h1>
        <p class="text-body-2 text-medium-emphasis mt-1">
          {{ t('SalesHistory.subtitle') }}
        </p>
      </div>
    </div>

    <!-- ── Loading ─────────────────────────────────────────── -->
    <div v-if="loading" class="text-center py-12">
      <v-progress-circular color="primary" indeterminate />
    </div>

    <!-- ── Error ───────────────────────────────────────────── -->
    <div v-else-if="error" class="text-center py-12">
      <v-icon color="error" size="48">mdi-alert-circle-outline</v-icon>
      <div class="text-body-2 mt-2">{{ t('SalesHistory.errorLoading') }}</div>
      <v-btn
        class="mt-4"
        color="primary"
        size="small"
        variant="outlined"
        @click="loadSales"
      >
        {{ t('Common.retry') }}
      </v-btn>
    </div>

    <!-- ── Empty ───────────────────────────────────────────── -->
    <div v-else-if="sales.length === 0" class="text-center py-12">
      <v-icon color="grey" size="48">mdi-cart-off</v-icon>
      <div class="text-body-1 mt-3 font-weight-medium">{{ t('SalesHistory.noSales') }}</div>
      <div class="text-body-2 text-medium-emphasis mt-1">{{ t('SalesHistory.noSalesHint') }}</div>
    </div>

    <!-- ── Sales list ──────────────────────────────────────── -->
    <v-list v-else bg-color="transparent" class="pa-0">
      <template v-for="sale in sales" :key="sale.orderId">
        <v-list-item
          class="px-0"
          :ripple="false"
          @click="toggleExpand(sale.orderId)"
        >
          <template #prepend>
            <v-avatar color="success" size="40">
              <v-icon :icon="typeIcon(sale.entryType)" size="20" />
            </v-avatar>
          </template>

          <v-list-item-title class="text-body-2 font-weight-medium text-truncate">
            {{ sale.entryTitle }}
          </v-list-item-title>

          <v-list-item-subtitle class="text-caption text-medium-emphasis">
            {{ formatDate(sale.completedAt) }}
            · {{ t(`SalesHistory.type.${sale.entryType}`) }}
          </v-list-item-subtitle>

          <template #append>
            <div class="d-flex align-center">
              <div class="text-right">
                <div class="text-body-2 font-weight-medium text-success">
                  {{ formatAmount(sale.amountXlm) }} XLM
                </div>
              </div>
              <v-icon
                class="ml-2"
                :icon="expandedIds.has(sale.orderId) ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                size="20"
              />
            </div>
          </template>
        </v-list-item>

        <!-- Expanded: payment split breakdown -->
        <v-expand-transition>
          <div v-if="expandedIds.has(sale.orderId)">
            <div class="ml-14 mr-2 mb-3">
              <div class="text-caption text-medium-emphasis mb-2">
                {{ t('SalesHistory.paymentBreakdown') }}
              </div>

              <div
                v-for="(split, idx) in sale.splits"
                :key="idx"
                class="d-flex justify-space-between align-center py-1"
              >
                <span class="text-caption text-medium-emphasis">
                  <v-chip
                    class="me-2"
                    :color="splitColor(split.role)"
                    size="x-small"
                    variant="tonal"
                  >
                    {{ t(`SalesHistory.role.${split.role}`) }}
                  </v-chip>
                  {{ formatAddress(split.wallet) }}
                </span>
                <span class="text-caption font-weight-medium">
                  {{ formatAmount(split.amountXlm) }} XLM
                  <span class="text-medium-emphasis ml-1">({{ split.percent }}%)</span>
                </span>
              </div>

              <a
                v-if="sale.stellarTxHash"
                class="text-caption text-primary d-inline-flex align-center mt-3"
                :href="stellarExpertUrl(sale.stellarTxHash)"
                rel="noopener noreferrer"
                style="text-decoration: none;"
                target="_blank"
                @click.stop
              >
                {{ t('SalesHistory.viewOnStellarExpert') }}
                <v-icon class="ml-1" icon="mdi-open-in-new" size="12" />
              </a>
            </div>
          </div>
        </v-expand-transition>

        <v-divider />
      </template>
    </v-list>
  </v-container>
</template>

<script setup lang="ts">
  import type { SellerSaleModel } from '@/api/types/sales.types'
  import { onMounted, reactive, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'
  import { api } from '@/api/api'
  import { getStellarExpertTxUrl } from '@/config/env'

  const router = useRouter()
  const { t } = useI18n()

  const loading = ref(false)
  const error = ref(false)
  const sales = ref<SellerSaleModel[]>([])
  const expandedIds = reactive(new Set<string>())

  async function loadSales () {
    loading.value = true
    error.value = false
    expandedIds.clear()

    try {
      sales.value = await api.creator.getSales()
    } catch (error_) {
      console.error('[SalesHistory] Failed to load sales:', error_)
      error.value = true
    } finally {
      loading.value = false
    }
  }

  function toggleExpand (id: string) {
    if (expandedIds.has(id)) {
      expandedIds.delete(id)
    } else {
      expandedIds.add(id)
    }
  }

  function stellarExpertUrl (hash: string): string {
    return getStellarExpertTxUrl(hash)
  }

  function typeIcon (type: string): string {
    const icons: Record<string, string> = {
      VIDEO: 'mdi-video-outline',
      AUDIO: 'mdi-music-note',
      IMAGE: 'mdi-image-outline',
      RESOURCE: 'mdi-text-box-outline',
    }
    return icons[type] ?? 'mdi-file-outline'
  }

  function splitColor (role: string): string {
    switch (role) {
      case 'SELLER': { return 'success' }
      case 'PLATFORM': { return 'grey' }
      case 'COLLABORATOR': { return 'info' }
      default: { return 'grey' }
    }
  }

  function formatAmount (amount: number): string {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 7 })
  }

  function formatAddress (address: string): string {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  function formatDate (dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  onMounted(() => {
    loadSales()
  })
</script>

<route lang="json">
{
  "path": "/creator-studio/sales",
  "meta": { "requiresAuth": true }
}
</route>
