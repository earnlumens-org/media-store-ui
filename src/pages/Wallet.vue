<template>
  <v-container :class="{ 'fill-height': !walletStore.isConnected }" fluid>
    <v-row
      :align="walletStore.isConnected ? 'start' : 'center'"
      :class="{ 'fill-height': !walletStore.isConnected }"
      justify="center"
    >
      <v-col class="d-flex flex-column align-center" cols="12">
        <v-btn
          :append-icon="walletStore.isConnected ? 'mdi-menu-down' : undefined"
          color="primary"
          :loading="walletStore.isLoading"
          :prepend-icon="walletStore.isConnected ? 'mdi-wallet-outline' : 'mdi-wallet-plus-outline'"
          rounded="xl"
          size="large"
          variant="outlined"
          @click="handleMainButtonClick"
        >
          {{ walletStore.isConnected ? walletStore.shortActiveAddress : $t('Common.connectWallet') }}
        </v-btn>

        <!-- Stellar Wallet branding cuando está conectado -->
        <div v-if="walletStore.isConnected" class="d-flex justify-center align-center mt-8">
          <span class="mr-3 d-inline-flex" v-html="stellarLogoSized" />
          <div>
            <h1 class="text-center text-h4 text-md-h3">Stellar</h1>
            <div class="text-body-2 font-weight-light mt-n1">{{ $t('Common.wallet') }}</div>
          </div>
        </div>

        <!-- Saldo XLM -->
        <v-row v-if="walletStore.isConnected" align="center" class="mt-1 mb-4" justify="center">
          <v-col class="px-0 mr-1" cols="auto">
            <div v-if="isLoadingBalance" class="d-flex align-center justify-center">
              <v-progress-circular color="primary" indeterminate size="24" />
            </div>
            <div v-else-if="balanceTimedOut" class="d-flex align-center justify-center">
              <v-btn
                color="primary"
                icon="mdi-refresh"
                size="large"
                variant="text"
                @click="fetchBalance"
              />
            </div>
            <h2 v-else class="text-h3 font-weight-bold text-primary text-center mt-3">
              <NumberAnimation
                :delay="0"
                :duration="1.5"
                easing="easeOutQuad"
                :format="formatBalance"
                :from="0"
                :to="xlmBalance"
              />
            </h2>
          </v-col>

          <v-col class="text-left px-0 pt-0" cols="auto">
            <h2 v-if="!isLoadingBalance" class="text-left text-body-1 font-weight-bold text-primary">XLM</h2>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>

  <!-- Tabs: Deposit / History (fuera del container para evitar márgenes) -->
  <v-card v-if="walletStore.isConnected">
    <v-tabs v-model="tab" align-tabs="center" color="primary">
      <v-tab value="deposit">{{ $t('Wallet.deposit') }}</v-tab>
      <v-tab value="history">{{ $t('Wallet.history') }}</v-tab>
    </v-tabs>
    <v-window v-model="tab">
      <v-window-item value="deposit">
        <CxDeposit />
      </v-window-item>

      <v-window-item value="history">
        <CxHistory />
      </v-window-item>
    </v-window>
  </v-card>

  <!-- Bottom Sheet para gestionar wallets -->
  <v-bottom-sheet v-model="showBottomSheet">
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>{{ $t('Wallet.chooseWallet') }}</span>
        <v-btn
          class="text-uppercase"
          color="primary"
          variant="text"
          @click="handleAddWallet"
        >
          {{ $t('Wallet.addWallet') }}
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-list>
        <v-list-item
          v-for="wallet in walletStore.wallets"
          :key="wallet.address"
          :active="wallet.address === walletStore.activeAddress"
          lines="two"
          @click="handleSelectWallet(wallet.address)"
        >
          <template #prepend>
            <v-icon color="primary">mdi-wallet-outline</v-icon>
          </template>

          <v-list-item-title class="d-flex align-center">
            {{ wallet.providerName }}
            <v-chip
              v-if="wallet.address === walletStore.activeAddress"
              class="ml-2 text-uppercase"
              color="primary"
              size="x-small"
            >
              {{ $t('Wallet.active') }}
            </v-chip>
          </v-list-item-title>

          <v-list-item-subtitle>
            {{ walletStore.formatAddress(wallet.address) }}
          </v-list-item-subtitle>

          <template #append>
            <v-icon v-if="wallet.address === walletStore.activeAddress" color="primary">
              mdi-check
            </v-icon>
          </template>
        </v-list-item>
      </v-list>

      <v-divider />

      <v-card-actions class="justify-center">
        <v-btn
          class="text-uppercase"
          color="error"
          variant="text"
          @click="handleDisconnectAll"
        >
          {{ $t('Wallet.disconnectAll') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-bottom-sheet>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'
  import NumberAnimation from 'vue-number-animation'

  import stellarSvg from '@/assets/stellar.svg?raw'
  import CxDeposit from '@/components/wallet/CxDeposit.vue'
  import CxHistory from '@/components/wallet/CxHistory.vue'
  import { getXLMBalance } from '@/services/stellar'
  import { useWalletStore } from '@/stores/wallet'

  const BALANCE_TIMEOUT_MS = 10_000

  const walletStore = useWalletStore()
  const showBottomSheet = ref(false)
  const xlmBalance = ref(0)
  const isLoadingBalance = ref(false)
  const balanceTimedOut = ref(false)
  const tab = ref('deposit')

  // Request ID para ignorar respuestas de requests obsoletas
  let currentRequestId = 0

  const stellarLogoSized = computed(() => {
    return stellarSvg
      .replace(/\swidth="[^"]*"/, ' width="63"')
      .replace(/\sheight="[^"]*"/, ' height="53"')
  })

  function formatBalance (value: number): string {
    return (Math.trunc(value * 100) / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  async function fetchBalance () {
    if (!walletStore.activeAddress) {
      xlmBalance.value = 0
      return
    }

    // Incrementar request ID para invalidar requests anteriores
    const requestId = ++currentRequestId

    isLoadingBalance.value = true
    balanceTimedOut.value = false

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('timeout')), BALANCE_TIMEOUT_MS)
      })

      const balance = await Promise.race([
        getXLMBalance(walletStore.activeAddress),
        timeoutPromise,
      ])

      // Solo actualizar si este request sigue siendo el actual
      if (requestId !== currentRequestId) {
        return
      }

      xlmBalance.value = balance
    } catch (error) {
      // Solo actualizar si este request sigue siendo el actual
      if (requestId !== currentRequestId) {
        return
      }

      // Ignorar errores de abort (request cancelada)
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }

      console.error('Error fetching XLM balance:', error)
      balanceTimedOut.value = true
    } finally {
      // Solo actualizar loading si este request sigue siendo el actual
      if (requestId === currentRequestId) {
        isLoadingBalance.value = false
      }
    }
  }

  watch(() => walletStore.activeAddress, () => {
    fetchBalance()
  })

  onMounted(async () => {
    await fetchBalance()
  })

  function handleMainButtonClick () {
    if (walletStore.isConnected) {
      showBottomSheet.value = true
    } else {
      walletStore.connect()
    }
  }

  async function handleAddWallet () {
    showBottomSheet.value = false
    await walletStore.connect()
  }

  function handleSelectWallet (address: string) {
    walletStore.selectWallet(address)
    showBottomSheet.value = false
  }

  async function handleDisconnectAll () {
    await walletStore.disconnectAll()
    showBottomSheet.value = false
  }
</script>

<route lang="json">
{
  "path": "/wallet",
  "meta": { "requiresAuth": true }
}
</route>
