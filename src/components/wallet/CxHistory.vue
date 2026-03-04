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
    <div v-else-if="groupedTransactions.length === 0" class="text-center py-8">
      <v-icon color="grey" size="48">mdi-history</v-icon>
      <div class="text-body-2 mt-2 text-medium-emphasis">{{ $t('CxHistory.noTransactions') }}</div>
    </div>

    <!-- Grouped transactions list -->
    <v-list v-else bg-color="transparent" class="pa-0">
      <template v-for="group in groupedTransactions" :key="group.transactionHash">
        <v-list-item
          class="px-0"
          :ripple="false"
          @click="toggleExpand(group.transactionHash)"
        >
          <template #prepend>
            <v-avatar :color="group.type === 'received' ? 'success' : 'grey-darken-1'" size="40">
              <v-icon :icon="group.type === 'received' ? 'mdi-arrow-down' : 'mdi-arrow-up'" size="20" />
            </v-avatar>
          </template>

          <v-list-item-title class="text-body-2 font-weight-medium">
            {{ group.type === 'received' ? $t('CxHistory.received') : $t('CxHistory.sent') }}
          </v-list-item-title>

          <v-list-item-subtitle class="text-caption text-medium-emphasis">
            {{ formatDate(group.created_at) }}
            <span v-if="group.operations.length > 1" class="ml-1">
              · {{ $t('CxHistory.nOperations', { n: group.operations.length }) }}
            </span>
          </v-list-item-subtitle>

          <template #append>
            <div class="d-flex align-center">
              <div class="text-right">
                <div
                  class="text-body-2 font-weight-medium"
                  :class="group.type === 'received' ? 'text-success' : 'text-medium-emphasis'"
                >
                  {{ group.type === 'received' ? '+' : '-' }}{{ formatAmount(group.totalAmount) }} XLM
                </div>
                <div v-if="!mobileView && group.operations.length === 1" class="text-caption text-medium-emphasis">
                  {{ formatAddress(group.operations[0].type === 'received' ? group.operations[0].from : group.operations[0].to) }}
                </div>
              </div>
              <v-icon
                class="ml-2"
                :icon="expandedHashes.has(group.transactionHash) ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                size="20"
              />
            </div>
          </template>
        </v-list-item>

        <!-- Expanded detail with operations breakdown + stellar.expert link -->
        <v-expand-transition>
          <div v-if="expandedHashes.has(group.transactionHash)">
            <div class="ml-14 mr-2 mb-3">
              <div
                v-for="op in group.operations"
                :key="op.id"
                class="d-flex justify-space-between align-center py-1"
              >
                <span class="text-caption text-medium-emphasis">
                  {{ formatAddress(op.type === 'received' ? op.from : op.to) }}
                </span>
                <span
                  class="text-caption font-weight-medium"
                  :class="op.type === 'received' ? 'text-success' : 'text-medium-emphasis'"
                >
                  {{ op.type === 'received' ? '+' : '-' }}{{ formatAmount(op.amount) }} XLM
                </span>
              </div>

              <a
                class="text-caption text-primary d-inline-flex align-center mt-2"
                :href="stellarExpertTxUrl(group.transactionHash)"
                rel="noopener noreferrer"
                style="text-decoration: none;"
                target="_blank"
                @click.stop
              >
                {{ $t('CxHistory.viewOnStellarExpert') }}
                <v-icon class="ml-1" icon="mdi-open-in-new" size="12" />
              </a>
            </div>
          </div>
        </v-expand-transition>
      </template>
    </v-list>
  </v-container>
</template>

<script setup lang="ts">
  import { computed, inject, onMounted, reactive, ref, type Ref, watch } from 'vue'

  import { getStellarExpertTxUrl } from '@/config/env'
  import { getRecentGroupedTransactions, type GroupedTransaction } from '@/services/stellar'
  import { useAppStore } from '@/stores/app'
  import { useWalletStore } from '@/stores/wallet'

  const appStore = useAppStore()
  const walletStore = useWalletStore()

  const mobileView = computed(() => appStore.mobileView)
  const activeAddress = computed(() => walletStore.activeAddress)

  const loading = ref(false)
  const error = ref(false)
  const groupedTransactions = ref<GroupedTransaction[]>([])
  const expandedHashes = reactive(new Set<string>())

  async function loadTransactions () {
    if (!activeAddress.value) return

    loading.value = true
    error.value = false
    expandedHashes.clear()

    try {
      groupedTransactions.value = await getRecentGroupedTransactions(activeAddress.value, 10)
    } catch (error_) {
      console.error('Error loading transactions:', error_)
      error.value = true
    } finally {
      loading.value = false
    }
  }

  function toggleExpand (hash: string) {
    if (expandedHashes.has(hash)) {
      expandedHashes.delete(hash)
    } else {
      expandedHashes.add(hash)
    }
  }

  function stellarExpertTxUrl (hash: string): string {
    return getStellarExpertTxUrl(hash)
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

  // Real-time: reload when a new payment is detected by the stream
  const newPaymentSignal = inject<Ref<number>>('newPaymentSignal')
  if (newPaymentSignal) {
    watch(newPaymentSignal, () => {
      loadTransactions()
    })
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
