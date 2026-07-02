<!--
  TipDialog.vue — Creator tipping flow (voluntary support)

  Mirrors the audited purchase flow (CheckoutDialog.vue): the buyer signs a
  backend-built Stellar tx; the backend verifies + submits + confirms on-chain.
  The ONLY difference is the buyer chooses the amount (USD presets or custom),
  and a tip grants no entitlement.

  - The amount is the only price input; the backend bounds it to [0.25, 100],
    converts USD→XLM at a locked rate and resolves every split (same commission
    scale as a purchase: platform / tenant / franchise).
  - The exact XLM that will be transferred is shown after prepare resolves and
    in the wallet signing prompt.
  - Minimal steps: pick an amount and confirm. Wallet connection (and funding)
    is handled inline when not yet connected.

  Layout: v-bottom-sheet on mobile, v-dialog on desktop (full native Vuetify).
-->

<script setup lang="ts">
  import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRoute, useRouter } from 'vue-router'
  import { VBottomSheet, VDialog } from 'vuetify/components'

  import { api } from '@/api/api'
  import { accountExists } from '@/services/stellar'

  import { useAppStore } from '@/stores/app'
  import { useFranchiseStore } from '@/stores/franchise'
  import { useWalletStore } from '@/stores/wallet'

  const router = useRouter()
  const route = useRoute()
  const { t } = useI18n()

  interface TipTarget {
    id: string
    type: 'video' | 'audio' | 'image' | 'resource' | 'collection'
    creatorName?: string
    creatorAvatar?: string
  }

  interface Props {
    modelValue: boolean
    target: TipTarget | null
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'tipped', amountUsd: number): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const appStore = useAppStore()
  const franchiseStore = useFranchiseStore()
  const walletStore = useWalletStore()

  // Tip amount bounds — mirrors the backend (single source of truth).
  const TIP_MIN = 0.25
  const TIP_MAX = 100
  const presets = [0.5, 1, 3, 5, 10]
  const otherSuggestions = [0.25, 15, 25, 50, 75, 100]

  // State
  const selectedPreset = ref<number | null>(1)
  const isOther = ref(false)
  const customAmount = ref('')
  const customInput = ref<HTMLInputElement | null>(null)

  const isProcessing = ref(false)
  /** True while the backend confirms the submitted tx on-chain (async submit). */
  const isConfirming = ref(false)
  const success = ref(false)
  const error = ref<string | null>(null)
  const isWalletNotActivated = computed(() => error.value === t('Preview.walletNotActivated'))

  /** After prepare(), the actual XLM amount the Stellar tx will charge. */
  const resolvedXlmAmount = ref<number | null>(null)
  /** XLM/USD rate used for conversion (shown for transparency). */
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
  const wrapper = computed(() => (isMobile.value ? VBottomSheet : VDialog))
  const wrapperProps = computed(() =>
    isMobile.value
      ? { fullscreen: true, maxWidth: 500, persistent: true }
      : { maxWidth: 500, persistent: true },
  )

  /** Resolved tip amount in USD (null when invalid/empty). */
  const amountUsd = computed<number | null>(() => {
    if (isOther.value) {
      const n = Number.parseFloat(customAmount.value)
      if (!Number.isFinite(n)) return null
      return Math.round(n * 100) / 100
    }
    return selectedPreset.value
  })

  const amountValid = computed(() => {
    const a = amountUsd.value
    return a != null && a >= TIP_MIN && a <= TIP_MAX
  })

  const showAmountError = computed(() =>
    isOther.value && customAmount.value.trim() !== '' && !amountValid.value,
  )

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

  const payLabel = computed(() => {
    if (resolvedXlmAmount.value != null) {
      return `${t('Tip.send')} · ${formatXlm(resolvedXlmAmount.value)}`
    }
    if (amountValid.value && amountUsd.value != null) {
      return `${t('Tip.send')} · $${amountUsd.value.toFixed(2)}`
    }
    return t('Tip.send')
  })

  // Amount selection
  function selectPreset (value: number) {
    selectedPreset.value = value
    isOther.value = false
  }

  async function selectOther () {
    isOther.value = true
    selectedPreset.value = null
    await nextTick()
    customInput.value?.focus()
  }

  function fillCustom (value: number) {
    customAmount.value = String(value)
  }

  // Countdown
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

  function retryTip () {
    stopCountdown()
    isExpired.value = false
    countdownSeconds.value = null
    resolvedXlmAmount.value = null
    resolvedXlmRate.value = null
    error.value = null
  }

  onBeforeUnmount(stopCountdown)

  // Reset state when the dialog opens
  watch(dialogOpen, open => {
    if (open) {
      selectedPreset.value = 1
      isOther.value = false
      customAmount.value = ''
      isProcessing.value = false
      isConfirming.value = false
      success.value = false
      error.value = null
      resolvedXlmAmount.value = null
      resolvedXlmRate.value = null
      countdownSeconds.value = null
      isExpired.value = false
      stopCountdown()
    } else {
      stopCountdown()
    }
  })

  function formatXlm (amount: number): string {
    return `${amount.toFixed(2)} XLM`
  }

  // Tip — real two-phase Stellar payment flow (identical pipeline to a purchase)
  async function handleTip () {
    if (!props.target || !amountValid.value || amountUsd.value == null) return

    isProcessing.value = true
    error.value = null

    try {
      // 1. Ensure wallet is connected (handles the not-connected flow inline)
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

      // 1b. Require an ACTIVE (funded) wallet before doing anything else.
      if (!(await accountExists(buyerWallet))) {
        throw new Error('WALLET_NOT_ACTIVATED')
      }

      // 2. Prepare — backend builds the unsigned Stellar tip tx
      const isCollection = props.target.type === 'collection'
      // Franchise attribution travels in the URL (?f=<slug>, set by the router
      // when this content was opened from /f/<slug>); the store is a fallback
      // for tips sent while the franchise page itself is still mounted.
      const routeSlug = typeof route.query.f === 'string' ? route.query.f : undefined
      const franchiseSlug = routeSlug || franchiseStore.slug || undefined
      const prepared = await api.payment.prepareTip(buyerWallet, {
        ...(isCollection ? { collectionId: props.target.id } : { entryId: props.target.id }),
        ...(franchiseSlug ? { franchiseSlug } : {}),
        amountUsd: amountUsd.value,
      })

      resolvedXlmAmount.value = prepared.totalXlm
      if (prepared.xlmUsdRate) {
        resolvedXlmRate.value = prepared.xlmUsdRate
      }
      if (prepared.expiresAt) {
        startCountdown(prepared.expiresAt)
      }

      // 3. Sign — pinned to the same wallet the backend built the tx for
      const signResult = await walletStore.signTransaction(prepared.unsignedXdr, {
        networkPassphrase: prepared.networkPassphrase,
        address: buyerWallet,
      })

      // 4. Submit — backend verifies + locks inline; confirmation continues async
      let result = await api.payment.submit(prepared.orderId, signResult.signedTxXdr)

      // 4b. Poll until the backend confirms the tx on-chain
      if (result.status === 'PROCESSING') {
        stopCountdown()
        countdownSeconds.value = null
        isConfirming.value = true
        result = await waitForOrderConfirmation(result.orderId)
      }

      // 5. Success — tips unlock nothing; show positive feedback
      stopCountdown()
      success.value = true
      emit('tipped', amountUsd.value)
    } catch (error_) {
      const msg = error_ instanceof Error ? error_.message : ''
      const errorKeyByCode: Record<string, string> = {
        'WALLET_NOT_ACTIVATED': 'Preview.walletNotActivated',
        'SPLIT_WALLET_NOT_ACTIVE': 'Preview.contentWalletInactive',
        'PAYMENT_IN_PROGRESS': 'Preview.paymentInProgress',
        'FRANCHISE_SELF_PURCHASE': 'Preview.franchiseSelfPurchase',
        'WALLET_ACCOUNT_MISMATCH': 'Preview.walletAccountMismatch',
        'WALLET_RECONNECT_REQUIRED': 'Preview.walletReconnectRequired',
        'PAYMENT_NOT_CONFIRMED': 'Preview.paymentFailed',
        'PAYMENT_CONFIRMATION_TIMEOUT': 'Preview.paymentConfirmTimeout',
        'CREATOR_TIPS_UNAVAILABLE': 'Tip.unavailable',
        'TIP_AMOUNT_OUT_OF_RANGE': 'Tip.amountInvalid',
        'Cannot tip your own content': 'Tip.cannotTipOwn',
      }
      const errorKey = errorKeyByCode[msg]
      error.value = errorKey ? t(errorKey) : (msg || t('Preview.paymentFailed'))
    } finally {
      isProcessing.value = false
      isConfirming.value = false
    }
  }

  /**
   * Polls the buyer's order after an async submit until a final verdict.
   * COMPLETED resolves; FAILED/EXPIRED rejects. Transient errors are tolerated.
   */
  async function waitForOrderConfirmation (orderId: string) {
    const POLL_INTERVAL_MS = 2000
    const MAX_ATTEMPTS = 45 // ~90 s
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))
      try {
        const order = await api.payment.getOrder(orderId)
        if (order.status === 'COMPLETED') return order
        if (order.status === 'FAILED' || order.status === 'EXPIRED') {
          throw new Error('PAYMENT_NOT_CONFIRMED')
        }
      } catch (error_) {
        if (error_ instanceof Error && error_.message === 'PAYMENT_NOT_CONFIRMED') {
          throw error_
        }
      }
    }
    throw new Error('PAYMENT_CONFIRMATION_TIMEOUT')
  }

  function closeDialog () {
    dialogOpen.value = false
  }
</script>

<template>
  <component
    :is="wrapper"
    v-model="dialogOpen"
    v-bind="wrapperProps"
  >
    <v-card :class="isMobile ? 'rounded-t-xl rounded-0' : ''">
      <!-- Header -->
      <v-toolbar color="transparent" density="compact">
        <v-toolbar-title class="text-subtitle-1 font-weight-medium">
          {{ $t('Tip.title') }}
        </v-toolbar-title>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
      </v-toolbar>

      <v-divider />

      <!-- SUCCESS STATE -->
      <template v-if="success">
        <v-card-text class="pa-6 text-center">
          <v-avatar class="mb-4" color="primary" size="72" variant="tonal">
            <v-icon icon="mdi-hand-heart" size="40" />
          </v-avatar>
          <div class="text-h6 font-weight-bold mb-1">{{ $t('Tip.success') }}</div>
          <div class="text-body-2 text-medium-emphasis">{{ $t('Tip.successSubtitle') }}</div>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-btn
            block
            color="primary"
            size="large"
            variant="flat"
            @click="closeDialog"
          >
            {{ $t('Tip.done') }}
          </v-btn>
        </v-card-actions>
      </template>

      <!-- TIP FORM -->
      <template v-else>
        <v-card-text :class="isMobile ? 'pa-4' : 'pa-6'">
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

          <!-- Creator row -->
          <div v-if="target?.creatorName" class="d-flex align-center mb-4">
            <v-avatar class="me-3" color="surface-variant" size="40">
              <v-img v-if="target.creatorAvatar" :src="target.creatorAvatar" />
              <v-icon v-else icon="mdi-account" />
            </v-avatar>
            <div class="text-truncate">
              <div class="text-body-1 font-weight-medium text-truncate">{{ target.creatorName }}</div>
              <div class="text-caption text-medium-emphasis">{{ $t('Tip.heading') }}</div>
            </div>
          </div>

          <div class="text-subtitle-2 font-weight-medium mb-1">{{ $t('Tip.chooseAmount') }}</div>
          <div class="text-caption text-medium-emphasis mb-3">{{ $t('Tip.subtitle') }}</div>

          <!-- Preset amounts -->
          <div class="d-flex flex-wrap ga-2">
            <v-chip
              v-for="p in presets"
              :key="p"
              :color="!isOther && selectedPreset === p ? 'primary' : undefined"
              size="large"
              :variant="!isOther && selectedPreset === p ? 'flat' : 'outlined'"
              @click="selectPreset(p)"
            >
              ${{ p % 1 === 0 ? p : p.toFixed(2) }}
            </v-chip>
            <v-chip
              :color="isOther ? 'primary' : undefined"
              prepend-icon="mdi-pencil"
              size="large"
              :variant="isOther ? 'flat' : 'outlined'"
              @click="selectOther"
            >
              {{ $t('Tip.other') }}
            </v-chip>
          </div>

          <!-- Custom amount -->
          <div v-if="isOther" class="mt-4">
            <v-text-field
              ref="customInput"
              v-model="customAmount"
              density="comfortable"
              :error="showAmountError"
              :error-messages="showAmountError ? $t('Tip.amountInvalid') : undefined"
              hide-details="auto"
              :hint="$t('Tip.amountHint')"
              inputmode="decimal"
              :label="$t('Tip.customAmount')"
              :max="TIP_MAX"
              :min="TIP_MIN"
              persistent-hint
              prefix="$"
              step="0.25"
              type="number"
            />
            <div class="d-flex flex-wrap ga-2 mt-3">
              <v-chip
                v-for="s in otherSuggestions"
                :key="s"
                size="small"
                variant="tonal"
                @click="fillCustom(s)"
              >
                ${{ s }}
              </v-chip>
            </div>
          </div>

          <v-divider class="my-4" />

          <!-- Summary -->
          <div class="d-flex justify-space-between align-center">
            <span class="text-subtitle-1 font-weight-medium">{{ $t('Tip.youPay') }}</span>
            <span class="text-subtitle-1 font-weight-bold text-primary">
              {{ resolvedXlmAmount != null
                ? formatXlm(resolvedXlmAmount)
                : (amountValid && amountUsd != null ? `$${amountUsd.toFixed(2)}` : '—') }}
            </span>
          </div>
          <div
            v-if="resolvedXlmAmount != null && amountUsd != null"
            class="text-caption text-medium-emphasis mt-1"
          >
            ${{ amountUsd.toFixed(2) }} ≈ {{ formatXlm(resolvedXlmAmount) }}
            <span v-if="resolvedXlmRate">(1 XLM ≈ ${{ resolvedXlmRate.toFixed(4) }})</span>
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
              class="text-subtitle-1 font-weight-bold ml-2"
              :class="`text-${countdownColor}`"
            >{{ countdownDisplay }}</span>
          </div>

          <!-- Confirming on-chain -->
          <v-alert
            v-if="isConfirming"
            class="mt-4"
            density="compact"
            icon="mdi-progress-clock"
            type="info"
            variant="tonal"
          >
            {{ $t('Preview.confirmingPayment') }}
          </v-alert>

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
              @click="retryTip"
            >
              {{ $t('Preview.tryAgain') }}
            </v-btn>
          </v-alert>
        </v-card-text>

        <v-card-actions :class="isMobile ? 'pa-4 pt-0' : 'pa-6 pt-0'">
          <v-btn
            block
            color="primary"
            :disabled="isProcessing || !amountValid || isExpired"
            :loading="isProcessing"
            prepend-icon="mdi-hand-coin-outline"
            size="large"
            variant="flat"
            @click="handleTip"
          >
            {{ payLabel }}
          </v-btn>
        </v-card-actions>
      </template>
    </v-card>
  </component>
</template>

<style scoped>
.countdown-timer {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.countdown-timer--warning {
  background: rgba(var(--v-theme-warning), 0.08);
}

.countdown-timer--error {
  background: rgba(var(--v-theme-error), 0.08);
}

.countdown-timer--success {
  background: rgba(var(--v-theme-success), 0.08);
}
</style>
