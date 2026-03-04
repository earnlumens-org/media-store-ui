<!--
  CheckoutDialog.vue - Purchase flow modal

  Single-step checkout: select payment method and complete purchase.
  Wallet must be connected before this dialog opens (handled by the caller).

  Layout:
  - Desktop: v-dialog (max-width: 500px)
  - Mobile: v-bottom-sheet (fullscreen feeling)

  Props:
  - modelValue: boolean (dialog open state)
  - item: object with id, title, creator, price, type, thumbnail
  - onSuccess: callback after successful purchase

  Emits:
  - update:modelValue: toggle dialog state
  - purchased: after successful purchase
-->

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'

  import { api } from '@/api/api'
  import xIcon from '@/assets/twitterx.svg?raw'

  import { useAppStore } from '@/stores/app'
  import { usePurchasesStore } from '@/stores/purchases'
  import { useWalletStore } from '@/stores/wallet'

  const { t } = useI18n()

  // X icon SVG
  const xIconSvg = xIcon

  interface CheckoutItem {
    id: string
    title: string
    creator?: {
      name: string
      avatar?: string
    }
    price: number
    type: 'video' | 'audio' | 'image' | 'resource' | 'collection'
    thumbnail?: string
  }

  interface Props {
    modelValue: boolean
    item: CheckoutItem | null
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'purchased', itemId: string): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const appStore = useAppStore()
  const purchasesStore = usePurchasesStore()
  const walletStore = useWalletStore()

  // State
  const selectedPayment = ref<'wallet' | 'card'>('wallet')
  const isProcessing = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const dialogOpen = computed({
    get: () => props.modelValue,
    set: val => emit('update:modelValue', val),
  })

  const isMobile = computed(() => appStore.mobileView)

  // Reset state when dialog opens
  watch(dialogOpen, open => {
    if (open) {
      selectedPayment.value = 'wallet'
      error.value = null
      isProcessing.value = false
    }
  })

  // Format price
  function formatPrice (price: number): string {
    return `${price.toFixed(2)} XLM`
  }

  // Handle purchase — real two-phase Stellar payment flow
  async function handlePurchase () {
    if (!props.item) return

    isProcessing.value = true
    error.value = null

    try {
      // 1. Ensure wallet is connected
      if (!walletStore.isConnected) {
        const connected = await walletStore.connect()
        if (!connected) {
          throw new Error(t('Preview.connectWalletError'))
        }
      }

      const buyerWallet = walletStore.activeAddress
      if (!buyerWallet) {
        throw new Error(t('Preview.noWalletAddress'))
      }

      // 2. Prepare — backend builds unsigned Stellar tx
      const prepared = await api.payment.prepare(props.item.id, buyerWallet)

      // 3. Sign — wallet extension signs the XDR
      const signResult = await walletStore.signTransaction(prepared.unsignedXdr, {
        networkPassphrase: prepared.networkPassphrase,
      })

      // 4. Submit — backend submits signed tx to Stellar network
      const result = await api.payment.submit(prepared.orderId, signResult.signedTxXdr)

      // 5. Mark unlocked locally
      purchasesStore.markUnlocked(props.item.id, {
        type: props.item.type,
        title: props.item.title,
      })

      // 6. Emit success
      emit('purchased', result.entryId)

      // 7. Close dialog
      dialogOpen.value = false
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : t('Preview.paymentFailed')
    } finally {
      isProcessing.value = false
    }
  }

  // Close dialog
  function closeDialog () {
    dialogOpen.value = false
  }
</script>

<template>
  <!-- Mobile: Bottom Sheet -->
  <v-bottom-sheet
    v-if="isMobile"
    v-model="dialogOpen"
    fullscreen
    :max-width="500"
    persistent
  >
    <v-card class="rounded-t-xl rounded-0">
      <!-- Header -->
      <v-toolbar color="transparent" density="compact">
        <v-toolbar-title class="text-subtitle-1 font-weight-medium">
          {{ $t('Preview.payment') }}
        </v-toolbar-title>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
      </v-toolbar>

      <v-divider />

      <!-- Payment -->
      <template v-if="item">
        <v-card-text class="pa-4">
          <!-- Error alert -->
          <v-alert
            v-if="error"
            class="mb-4"
            closable
            density="compact"
            type="error"
            variant="tonal"
            @click:close="error = null"
          >
            {{ error }}
          </v-alert>

          <!-- Payment methods -->
          <div class="text-subtitle-2 font-weight-medium mb-3">{{ $t('Preview.selectPaymentMethod') }}</div>

          <v-radio-group v-model="selectedPayment" class="mb-4 payment-methods" hide-details>
            <v-card
              class="mb-2"
              :color="selectedPayment === 'wallet' ? 'primary' : undefined"
              variant="outlined"
              @click="selectedPayment = 'wallet'"
            >
              <v-card-text class="d-flex align-center py-3">
                <v-radio class="ma-0 flex-grow-0" hide-details value="wallet" />
                <v-icon class="ml-2 mr-3" icon="mdi-wallet" />
                <div>
                  <div class="text-body-1 font-weight-medium">{{ $t('Preview.stellarWallet') }}</div>
                  <div class="text-body-2 text-medium-emphasis">
                    {{ walletStore.isConnected ? $t('Preview.connected') : $t('Preview.connectToPay') }}
                  </div>
                </div>
                <v-spacer />
                <v-chip
                  v-if="walletStore.isConnected"
                  color="success"
                  size="x-small"
                  variant="tonal"
                >
                  {{ $t('Preview.ready') }}
                </v-chip>
              </v-card-text>
            </v-card>

            <v-card
              class="x-payments-disabled"
              variant="outlined"
            >
              <v-card-text class="d-flex align-center py-3">
                <v-radio class="ma-0 flex-grow-0" disabled hide-details value="card" />
                <span aria-label="X" class="x-icon ml-2 mr-3" role="img" v-html="xIconSvg" />
                <div>
                  <div class="text-body-1 font-weight-medium">{{ $t('Preview.xPayments') }}</div>
                  <div class="text-body-2 text-medium-emphasis">{{ $t('Preview.payWithXAccountBalance') }}</div>
                </div>
                <v-spacer />
                <v-chip
                  color="warning"
                  size="x-small"
                  variant="tonal"
                >
                  {{ $t('Preview.comingSoon') }}
                </v-chip>
              </v-card-text>
            </v-card>
          </v-radio-group>

          <!-- Order summary -->
          <v-divider class="my-4" />

          <div class="d-flex justify-space-between align-center">
            <span class="text-subtitle-1 font-weight-medium">{{ $t('Preview.total') }}</span>
            <span class="text-subtitle-1 font-weight-bold text-primary">
              {{ formatPrice(item.price) }}
            </span>
          </div>
        </v-card-text>

        <v-card-actions class="pa-4 pt-0">
          <v-btn
            block
            color="primary"
            :disabled="isProcessing || !walletStore.isConnected"
            :loading="isProcessing"
            prepend-icon="mdi-lock-open"
            size="large"
            variant="flat"
            @click="handlePurchase"
          >
            {{ $t('Preview.pay') }} {{ formatPrice(item.price) }}
          </v-btn>
        </v-card-actions>
      </template>
    </v-card>
  </v-bottom-sheet>

  <!-- Desktop: Dialog -->
  <v-dialog
    v-else
    v-model="dialogOpen"
    max-width="500"
    persistent
  >
    <v-card>
      <!-- Header -->
      <v-toolbar color="transparent" density="compact">
        <v-toolbar-title class="text-subtitle-1 font-weight-medium">
          {{ $t('Preview.payment') }}
        </v-toolbar-title>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
      </v-toolbar>

      <v-divider />

      <!-- Payment -->
      <template v-if="item">
        <v-card-text class="pa-6">
          <!-- Error alert -->
          <v-alert
            v-if="error"
            class="mb-4"
            closable
            density="compact"
            type="error"
            variant="tonal"
            @click:close="error = null"
          >
            {{ error }}
          </v-alert>

          <!-- Payment methods -->
          <div class="text-subtitle-1 font-weight-medium mb-4">{{ $t('Preview.selectPaymentMethod') }}</div>

          <v-radio-group v-model="selectedPayment" class="mb-6 payment-methods" hide-details>
            <v-card
              class="mb-3"
              :color="selectedPayment === 'wallet' ? 'primary' : undefined"
              variant="outlined"
              @click="selectedPayment = 'wallet'"
            >
              <v-card-text class="d-flex align-center py-4">
                <v-radio class="ma-0 flex-grow-0" hide-details value="wallet" />
                <v-icon class="ml-3 mr-4" icon="mdi-wallet" size="28" />
                <div>
                  <div class="text-body-1 font-weight-medium">{{ $t('Preview.stellarWallet') }}</div>
                  <div class="text-body-2 text-medium-emphasis">
                    {{ walletStore.isConnected ? $t('Preview.connected') : $t('Preview.connectToPayWithXLM') }}
                  </div>
                </div>
                <v-spacer />
                <v-chip
                  v-if="walletStore.isConnected"
                  color="success"
                  size="small"
                  variant="tonal"
                >
                  {{ $t('Preview.ready') }}
                </v-chip>
              </v-card-text>
            </v-card>

            <v-card
              class="x-payments-disabled"
              variant="outlined"
            >
              <v-card-text class="d-flex align-center py-4">
                <v-radio class="ma-0 flex-grow-0" disabled hide-details value="card" />
                <span aria-label="X" class="x-icon x-icon--large ml-3 mr-4" role="img" v-html="xIconSvg" />
                <div>
                  <div class="text-body-1 font-weight-medium">{{ $t('Preview.xPayments') }}</div>
                  <div class="text-body-2 text-medium-emphasis">{{ $t('Preview.payWithXAccountBalance') }}</div>
                </div>
                <v-spacer />
                <v-chip
                  color="warning"
                  size="small"
                  variant="tonal"
                >
                  {{ $t('Preview.comingSoon') }}
                </v-chip>
              </v-card-text>
            </v-card>
          </v-radio-group>

          <!-- Order summary -->
          <v-divider class="my-4" />

          <div class="d-flex justify-space-between align-center">
            <span class="text-h6 font-weight-medium">{{ $t('Preview.total') }}</span>
            <span class="text-h6 font-weight-bold text-primary">
              {{ formatPrice(item.price) }}
            </span>
          </div>
        </v-card-text>

        <v-card-actions class="pa-6 pt-0">
          <v-btn
            block
            color="primary"
            :disabled="isProcessing || !walletStore.isConnected"
            :loading="isProcessing"
            prepend-icon="mdi-lock-open"
            size="large"
            variant="flat"
            @click="handlePurchase"
          >
            {{ $t('Preview.pay') }} {{ formatPrice(item.price) }}
          </v-btn>
        </v-card-actions>
      </template>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.x-icon {
  display: inline-flex;
  width: 24px;
  height: 24px;
  color: rgb(var(--v-theme-on-surface));
}

.x-icon--large {
  width: 28px;
  height: 28px;
}

.x-icon :deep(svg) {
  width: 100%;
  height: 100%;
  fill: currentColor;
}

/* Remove radio-group default indentation so cards align flush */
.payment-methods :deep(.v-selection-control-group) {
  gap: 0;
}
.payment-methods :deep(.v-input__control) {
  padding: 0;
}

/* Disabled state for X Payments */
.x-payments-disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
