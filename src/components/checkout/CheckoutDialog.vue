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
  import { computed, onBeforeUnmount, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'

  import { api } from '@/api/api'
  import xIcon from '@/assets/twitterx.svg?raw'

  import { useAppStore } from '@/stores/app'
  import { usePurchasesStore } from '@/stores/purchases'
  import { useWalletStore } from '@/stores/wallet'

  const router = useRouter()

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
    priceCurrency: 'XLM' | 'USD'
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
  const isWalletNotActivated = computed(() => error.value === t('Preview.walletNotActivated'))
  /** After prepare(), holds the actual XLM amount the Stellar tx will charge */
  const resolvedXlmAmount = ref<number | null>(null)
  /** XLM/USD rate used for conversion (shown to buyer for transparency) */
  const resolvedXlmRate = ref<number | null>(null)

  /** Countdown state */
  const countdownSeconds = ref<number | null>(null)
  const countdownTimer = ref<ReturnType<typeof setInterval> | null>(null)
  const isExpired = ref(false)

  // Computed
  const dialogOpen = computed({
    get: () => props.modelValue,
    set: val => emit('update:modelValue', val),
  })

  const isMobile = computed(() => appStore.mobileView)

  // Countdown computed
  const countdownDisplay = computed(() => {
    if (countdownSeconds.value == null) return ''
    const mins = Math.floor(countdownSeconds.value / 60)
    const secs = countdownSeconds.value % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  })

  const countdownColor = computed(() => {
    if (countdownSeconds.value == null) return 'success'
    if (countdownSeconds.value <= 60) return 'error'
    if (countdownSeconds.value <= 120) return 'warning'
    return 'success'
  })

  // Countdown functions
  function startCountdown (expiresAtIso: string) {
    stopCountdown()
    isExpired.value = false

    const expiresAt = new Date(expiresAtIso).getTime()
    const tick = () => {
      const remaining = Math.floor((expiresAt - Date.now()) / 1000)
      if (remaining <= 0) {
        countdownSeconds.value = 0
        isExpired.value = true
        stopCountdown()
        return
      }
      countdownSeconds.value = remaining
    }

    tick()
    countdownTimer.value = setInterval(tick, 1000)
  }

  function stopCountdown () {
    if (countdownTimer.value) {
      clearInterval(countdownTimer.value)
      countdownTimer.value = null
    }
  }

  function retryPayment () {
    stopCountdown()
    isExpired.value = false
    countdownSeconds.value = null
    resolvedXlmAmount.value = null
    resolvedXlmRate.value = null
    error.value = null
  }

  // Cleanup on unmount
  onBeforeUnmount(stopCountdown)

  // Reset state when dialog opens
  watch(dialogOpen, open => {
    if (open) {
      selectedPayment.value = 'wallet'
      error.value = null
      isProcessing.value = false
      resolvedXlmAmount.value = null
      resolvedXlmRate.value = null
      countdownSeconds.value = null
      isExpired.value = false
      stopCountdown()
    } else {
      stopCountdown()
    }
  })

  // Format price in the entry's original currency
  function formatPrice (price: number): string {
    if (props.item?.priceCurrency === 'USD') {
      return `$${price.toFixed(2)} USD`
    }
    return `${price.toFixed(2)} XLM`
  }

  // Format XLM amount (always XLM)
  function formatXlm (amount: number): string {
    return `${amount.toFixed(2)} XLM`
  }

  // The label for the pay button
  const payLabel = computed(() => {
    if (!props.item) return ''
    const price = formatPrice(props.item.price)
    if (props.item.priceCurrency === 'USD') {
      // Show resolved XLM if available, otherwise indicate it'll be in XLM
      if (resolvedXlmAmount.value != null) {
        return `${t('Preview.pay')} ${formatXlm(resolvedXlmAmount.value)}`
      }
      return `${t('Preview.pay')} ${price} en XLM`
    }
    return `${t('Preview.pay')} ${price}`
  })

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
      const isCollection = props.item.type === 'collection'
      const prepared = await api.payment.prepare(buyerWallet, isCollection
        ? { collectionId: props.item.id }
        : { entryId: props.item.id },
      )

      // Store the resolved XLM amount (backend computed for USD entries)
      resolvedXlmAmount.value = prepared.totalXlm
      if (prepared.xlmUsdRate) {
        resolvedXlmRate.value = prepared.xlmUsdRate
      }

      // 2b. Start countdown timer from backend expiresAt
      if (prepared.expiresAt) {
        startCountdown(prepared.expiresAt)
      }

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
      const purchasedId = result.entryId || result.collectionId || props.item.id
      emit('purchased', purchasedId)

      // 7. Close dialog
      dialogOpen.value = false
    } catch (error_) {
      const msg = error_ instanceof Error ? error_.message : ''
      if (msg === 'WALLET_NOT_ACTIVATED') {
        error.value = t('Preview.walletNotActivated')
      } else {
        error.value = msg || t('Preview.paymentFailed')
      }
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
          <!-- Wallet not activated alert -->
          <v-alert
            v-if="isWalletNotActivated"
            class="mb-4"
            density="compact"
            type="warning"
            variant="tonal"
          >
            {{ error }}
            <template #append>
              <v-btn
                color="warning"
                size="small"
                variant="tonal"
                @click="router.push('/wallet'); closeDialog()"
              >
                {{ $t('Preview.goToWallet') }}
              </v-btn>
            </template>
          </v-alert>

          <!-- Error alert -->
          <v-alert
            v-else-if="error"
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

          <!-- USD→XLM conversion note (shown after prepare resolves) -->
          <div v-if="item.priceCurrency === 'USD' && resolvedXlmAmount" class="text-caption text-medium-emphasis mb-2">
            {{ formatPrice(item.price) }} ≈ {{ formatXlm(resolvedXlmAmount) }}
            <span v-if="resolvedXlmRate" class="text-caption">(1 XLM ≈ ${{ resolvedXlmRate.toFixed(4) }})</span>
          </div>

          <div class="d-flex justify-space-between align-center">
            <span class="text-subtitle-1 font-weight-medium">{{ $t('Preview.total') }}</span>
            <span class="text-subtitle-1 font-weight-bold text-primary">
              {{ resolvedXlmAmount != null ? formatXlm(resolvedXlmAmount) : formatPrice(item.price) }}
            </span>
          </div>

          <!-- Countdown Timer -->
          <div
            v-if="countdownSeconds != null && !isExpired"
            class="countdown-timer d-flex align-center justify-center mt-4 pa-3 rounded-lg"
            :class="`countdown-timer--${countdownColor}`"
          >
            <v-icon class="mr-2" :color="countdownColor" icon="mdi-timer-outline" size="20" />
            <span class="text-body-2 font-weight-medium">{{ $t('Preview.timeRemaining') }}</span>
            <span
              class="text-subtitle-1 font-weight-bold ml-2 countdown-digits"
              :class="`text-${countdownColor}`"
            >{{ countdownDisplay }}</span>
          </div>

          <!-- Expired Alert -->
          <v-alert
            v-if="isExpired"
            class="mt-4"
            icon="mdi-clock-alert-outline"
            prominent
            type="error"
            variant="tonal"
          >
            <div class="text-subtitle-2 font-weight-bold">{{ $t('Preview.transactionExpired') }}</div>
            <div class="text-body-2 mt-1">{{ $t('Preview.transactionExpiredMessage') }}</div>
            <v-btn
              class="mt-3"
              color="error"
              prepend-icon="mdi-refresh"
              size="small"
              variant="outlined"
              @click="retryPayment"
            >
              {{ $t('Preview.tryAgain') }}
            </v-btn>
          </v-alert>
        </v-card-text>

        <v-card-actions class="pa-4 pt-0">
          <v-btn
            block
            color="primary"
            :disabled="isProcessing || !walletStore.isConnected || isExpired"
            :loading="isProcessing"
            prepend-icon="mdi-lock-open"
            size="large"
            variant="flat"
            @click="handlePurchase"
          >
            {{ payLabel }}
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
          <!-- Wallet not activated alert -->
          <v-alert
            v-if="isWalletNotActivated"
            class="mb-4"
            density="compact"
            type="warning"
            variant="tonal"
          >
            {{ error }}
            <template #append>
              <v-btn
                color="warning"
                size="small"
                variant="tonal"
                @click="router.push('/wallet'); closeDialog()"
              >
                {{ $t('Preview.goToWallet') }}
              </v-btn>
            </template>
          </v-alert>

          <!-- Error alert -->
          <v-alert
            v-else-if="error"
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

          <!-- USD→XLM conversion note (shown after prepare resolves) -->
          <div v-if="item.priceCurrency === 'USD' && resolvedXlmAmount" class="text-caption text-medium-emphasis mb-2">
            {{ formatPrice(item.price) }} ≈ {{ formatXlm(resolvedXlmAmount) }}
            <span v-if="resolvedXlmRate" class="text-caption">(1 XLM ≈ ${{ resolvedXlmRate.toFixed(4) }})</span>
          </div>

          <div class="d-flex justify-space-between align-center">
            <span class="text-h6 font-weight-medium">{{ $t('Preview.total') }}</span>
            <span class="text-h6 font-weight-bold text-primary">
              {{ resolvedXlmAmount != null ? formatXlm(resolvedXlmAmount) : formatPrice(item.price) }}
            </span>
          </div>

          <!-- Countdown Timer -->
          <div
            v-if="countdownSeconds != null && !isExpired"
            class="countdown-timer d-flex align-center justify-center mt-4 pa-4 rounded-lg"
            :class="`countdown-timer--${countdownColor}`"
          >
            <v-icon class="mr-2" :color="countdownColor" icon="mdi-timer-outline" size="24" />
            <span class="text-body-1 font-weight-medium">{{ $t('Preview.timeRemaining') }}</span>
            <span
              class="text-h5 font-weight-bold ml-3 countdown-digits"
              :class="`text-${countdownColor}`"
            >{{ countdownDisplay }}</span>
          </div>

          <!-- Expired Alert -->
          <v-alert
            v-if="isExpired"
            class="mt-4"
            icon="mdi-clock-alert-outline"
            prominent
            type="error"
            variant="tonal"
          >
            <div class="text-subtitle-1 font-weight-bold">{{ $t('Preview.transactionExpired') }}</div>
            <div class="text-body-2 mt-1">{{ $t('Preview.transactionExpiredMessage') }}</div>
            <v-btn
              class="mt-3"
              color="error"
              prepend-icon="mdi-refresh"
              size="small"
              variant="outlined"
              @click="retryPayment"
            >
              {{ $t('Preview.tryAgain') }}
            </v-btn>
          </v-alert>
        </v-card-text>

        <v-card-actions class="pa-6 pt-0">
          <v-btn
            block
            color="primary"
            :disabled="isProcessing || !walletStore.isConnected || isExpired"
            :loading="isProcessing"
            prepend-icon="mdi-lock-open"
            size="large"
            variant="flat"
            @click="handlePurchase"
          >
            {{ payLabel }}
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

/* Countdown timer */
.countdown-timer {
  border: 1px solid;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.countdown-timer--success {
  background-color: rgba(var(--v-theme-success), 0.08);
  border-color: rgba(var(--v-theme-success), 0.3);
}

.countdown-timer--warning {
  background-color: rgba(var(--v-theme-warning), 0.08);
  border-color: rgba(var(--v-theme-warning), 0.3);
}

.countdown-timer--error {
  background-color: rgba(var(--v-theme-error), 0.08);
  border-color: rgba(var(--v-theme-error), 0.3);
}

.countdown-digits {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.05em;
}
</style>
