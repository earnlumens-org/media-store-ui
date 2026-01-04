<template>
  <v-container class="fill-height" fluid>
    <v-row
      :align="walletStore.isConnected ? 'start' : 'center'"
      class="fill-height"
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
          {{ walletStore.isConnected ? walletStore.shortActiveAddress : 'Connect Wallet' }}
        </v-btn>

        <!-- Stellar Wallet branding cuando está conectado -->
        <div v-if="walletStore.isConnected" class="d-flex justify-center align-center mt-8">
          <span class="mr-3 d-inline-flex" v-html="stellarLogoSized" />
          <div>
            <h1 class="text-center text-h4 text-md-h3">Stellar</h1>
            <div class="text-body-2 font-weight-light mt-n1">{{ $t('Common.wallet') }}</div>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-container>

  <!-- Bottom Sheet para gestionar wallets -->
  <v-bottom-sheet v-model="showBottomSheet">
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Choose wallet</span>
        <v-btn
          color="primary"
          variant="text"
          @click="handleAddWallet"
        >
          Add Wallet
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
              class="ml-2"
              color="primary"
              size="x-small"
            >
              ACTIVE
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
          color="error"
          variant="text"
          @click="handleDisconnectAll"
        >
          Disconnect All
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-bottom-sheet>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'

  import stellarSvg from '@/assets/stellar.svg?raw'
  import { useWalletStore } from '@/stores/wallet'

  const walletStore = useWalletStore()
  const showBottomSheet = ref(false)

  const stellarLogoSized = computed(() => {
    return stellarSvg
      .replace(/\swidth="[^"]*"/, ' width="63"')
      .replace(/\sheight="[^"]*"/, ' height="53"')
  })

  onMounted(async () => {
    await walletStore.initialize()
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
