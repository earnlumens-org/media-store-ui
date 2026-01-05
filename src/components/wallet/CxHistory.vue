<template>
  <v-container>
    <!-- Loading state -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular color="primary" indeterminate />
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="text-center py-8">
      <v-icon color="error" size="48">mdi-alert-circle-outline</v-icon>
      <div class="text-body-2 mt-2">{{ $t('CxHistory.errorLoading') }}</div>
      <v-btn
        class="mt-4"
        color="primary"
        size="small"
        variant="outlined"
        @click="loadTransactions"
      >
        {{ $t('Common.retry') }}
      </v-btn>
    </div>

    <!-- Empty state -->
    <div v-else-if="transactions.length === 0" class="text-center py-8">
      <v-icon color="grey" size="48">mdi-history</v-icon>
      <div class="text-body-2 mt-2 text-medium-emphasis">{{ $t('CxHistory.noTransactions') }}</div>
    </div>

    <!-- Transactions list -->
    <v-list v-else bg-color="transparent" class="pa-0">
      <v-list-item
        v-for="tx in transactions"
        :key="tx.id"
        class="px-0"
        :ripple="false"
      >
        <template #prepend>
          <v-avatar :color="tx.type === 'received' ? 'success' : 'grey-darken-1'" size="40">
            <v-icon :icon="tx.type === 'received' ? 'mdi-arrow-down' : 'mdi-arrow-up'" size="20" />
          </v-avatar>
        </template>

        <v-list-item-title class="text-body-2 font-weight-medium">
          {{ tx.type === 'received' ? $t('CxHistory.received') : $t('CxHistory.sent') }}
        </v-list-item-title>

        <v-list-item-subtitle class="text-caption text-medium-emphasis">
          {{ formatDate(tx.created_at) }}
        </v-list-item-subtitle>

        <template #append>
          <div class="text-right">
            <div
              class="text-body-2 font-weight-medium"
              :class="tx.type === 'received' ? 'text-success' : 'text-medium-emphasis'"
            >
              {{ tx.type === 'received' ? '+' : '-' }}{{ formatAmount(tx.amount) }} XLM
            </div>
            <div v-if="!mobileView" class="text-caption text-medium-emphasis">
              {{ formatAddress(tx.type === 'received' ? tx.from : tx.to) }}
            </div>
          </div>
        </template>
      </v-list-item>
    </v-list>
  </v-container>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'

  import { getRecentTransactions, type StellarTransaction } from '@/services/stellar'
  import { useAppStore } from '@/stores/app'
  import { useWalletStore } from '@/stores/wallet'

  const appStore = useAppStore()
  const walletStore = useWalletStore()

  const mobileView = computed(() => appStore.mobileView)
  const activeAddress = computed(() => walletStore.activeAddress)

  const loading = ref(false)
  const error = ref(false)
  const transactions = ref<StellarTransaction[]>([])

  async function loadTransactions () {
    if (!activeAddress.value) return

    loading.value = true
    error.value = false

    try {
      transactions.value = await getRecentTransactions(activeAddress.value, 10)
    } catch (error_) {
      console.error('Error loading transactions:', error_)
      error.value = true
    } finally {
      loading.value = false
    }
  }

  function formatAmount (amount: string): string {
    const num = Number.parseFloat(amount)
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 7 })
  }

  function formatAddress (address: string): string {
    if (!address) return ''
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  function formatDate (dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60_000)
    const diffHours = Math.floor(diffMs / 3_600_000)
    const diffDays = Math.floor(diffMs / 86_400_000)

    if (diffMins < 1) return 'Ahora'
    if (diffMins < 60) return `Hace ${diffMins}m`
    if (diffHours < 24) return `Hace ${diffHours}h`
    if (diffDays < 7) return `Hace ${diffDays}d`

    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  // Load on mount
  onMounted(() => {
    loadTransactions()
  })

  // Reload when address changes
  watch(activeAddress, () => {
    loadTransactions()
  })
</script>
