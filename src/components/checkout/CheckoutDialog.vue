<!--
  CheckoutDialog.vue - Purchase flow modal

  Two-step checkout process:
  1. Confirm: Show product details (title, creator, price, what's included)
  2. Pay: Select payment method and complete purchase

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
    type: 'video' | 'audio' | 'image' | 'entry' | 'collection'
    thumbnail?: string
    /** What's included in the purchase */
    includes?: string[]
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
  const step = ref<1 | 2>(1)
  const selectedPayment = ref<'wallet' | 'card'>('wallet')
  const isProcessing = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const dialogOpen = computed({
    get: () => props.modelValue,
    set: val => emit('update:modelValue', val),
  })

  const isMobile = computed(() => appStore.mobileView)

  // Reset state when dialog closes/opens
  watch(dialogOpen, open => {
    if (open) {
      step.value = 1
      selectedPayment.value = 'wallet'
      error.value = null
      isProcessing.value = false
    }
  })

  // Type icon mapping
  const typeIcon = computed(() => {
    const icons: Record<string, string> = {
      video: 'mdi-play-circle',
      audio: 'mdi-music-circle',
      image: 'mdi-image',
      entry: 'mdi-file-document',
      collection: 'mdi-folder-multiple-image',
    }
    return icons[props.item?.type || 'entry'] || 'mdi-file'
  })

  // Type label mapping
  const typeLabel = computed(() => {
    const labels: Record<string, string> = {
      video: t('Preview.videoType'),
      audio: t('Preview.audioType'),
      image: t('Preview.imageType'),
      entry: t('Preview.entryType'),
      collection: t('Preview.collectionType'),
    }
    return labels[props.item?.type || 'entry'] || t('Preview.contentType')
  })

  // Default "includes" based on type
  const defaultIncludes = computed((): string[] => {
    const item = props.item
    if (!item) return []

    const includesMap: Record<string, string[]> = {
      video: [t('Preview.fullHDStreaming'), t('Preview.downloadMultipleFormats'), t('Preview.lifetimeAccess')],
      audio: [t('Preview.highQualityAudio'), t('Preview.downloadForOffline'), t('Preview.lifetimeAccess')],
      image: [t('Preview.fullResolutionDownload'), t('Preview.commercialUseLicense'), t('Preview.lifetimeAccess')],
      entry: [t('Preview.fullArticleAccess'), t('Preview.futureUpdates'), t('Preview.supportTheCreator')],
      collection: [t('Preview.accessToAllItems'), t('Preview.futureAdditionsIncluded'), t('Preview.lifetimeAccess')],
    }

    return item.includes || includesMap[item.type] || [t('Preview.fullAccess'), t('Preview.lifetimeAccess')]
  })

  // Format price
  function formatPrice (price: number): string {
    return `${price.toFixed(2)} XLM`
  }

  // Go to payment step
  function goToPayment () {
    step.value = 2
  }

  // Go back to confirm step
  function goBack () {
    step.value = 1
    error.value = null
  }

  // Handle purchase
  async function handlePurchase () {
    if (!props.item) return

    isProcessing.value = true
    error.value = null

    try {
      // Simulate payment processing
      // In production, this would call actual payment API
      await new Promise(resolve => setTimeout(resolve, 1500))

      // If using wallet, simulate signature
      if (selectedPayment.value === 'wallet' && !walletStore.isConnected) {
        // Try to connect wallet first
        const connected = await walletStore.connect()
        if (!connected) {
          throw new Error('Please connect your wallet to continue')
        }
      }

      // Simulate signing (in production would sign actual transaction)
      // await walletStore.sign('payment-transaction-xdr')

      // Mark as unlocked
      purchasesStore.markUnlocked(props.item.id, {
        type: props.item.type,
        title: props.item.title,
      })

      // Emit success
      emit('purchased', props.item.id)

      // Close dialog
      dialogOpen.value = false
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'Payment failed. Please try again.'
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
    :fullscreen="step === 2"
    :max-width="500"
    persistent
  >
    <v-card class="rounded-t-xl" :rounded="step === 2 ? '0' : 'xl'">
      <!-- Header -->
      <v-toolbar color="transparent" density="compact">
        <v-btn
          v-if="step === 2"
          icon="mdi-arrow-left"
          variant="text"
          @click="goBack"
        />
        <v-toolbar-title class="text-subtitle-1 font-weight-medium">
          {{ step === 1 ? 'Unlock Content' : 'Payment' }}
        </v-toolbar-title>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
      </v-toolbar>

      <v-divider />

      <!-- Step 1: Confirm -->
      <template v-if="step === 1 && item">
        <v-card-text class="pa-4">
          <!-- Product preview -->
          <v-row align="center" class="mb-4">
            <v-col cols="auto">
              <v-avatar
                v-if="item.thumbnail"
                rounded="lg"
                size="80"
              >
                <v-img cover :src="item.thumbnail" />
              </v-avatar>
              <v-avatar
                v-else
                color="primary"
                rounded="lg"
                size="80"
                variant="tonal"
              >
                <v-icon :icon="typeIcon" size="32" />
              </v-avatar>
            </v-col>
            <v-col>
              <div class="text-subtitle-1 font-weight-medium">{{ item.title }}</div>
              <div v-if="item.creator" class="text-body-2 text-medium-emphasis">
                {{ $t('Preview.by') }} {{ item.creator.name }}
              </div>
              <v-chip
                class="mt-1"
                color="primary"
                size="x-small"
                variant="tonal"
              >
                {{ typeLabel }}
              </v-chip>
            </v-col>
          </v-row>

          <!-- Price -->
          <v-card class="mb-4" color="surface-variant" variant="flat">
            <v-card-text class="d-flex align-center justify-space-between py-3">
              <span class="text-body-2 text-medium-emphasis">{{ $t('Preview.price') }}</span>
              <span class="text-h6 font-weight-bold text-primary">
                {{ formatPrice(item.price) }}
              </span>
            </v-card-text>
          </v-card>

          <!-- What's included -->
          <div class="text-subtitle-2 font-weight-medium mb-2">{{ $t('Preview.whatsIncluded') }}</div>
          <v-list class="bg-transparent pa-0" density="compact">
            <v-list-item
              v-for="(include, idx) in defaultIncludes"
              :key="idx"
              class="px-0"
            >
              <template #prepend>
                <v-icon class="mr-2" color="success" icon="mdi-check-circle" size="small" />
              </template>
              <v-list-item-title class="text-body-2">{{ include }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>

        <v-card-actions class="pa-4 pt-0">
          <v-btn
            block
            color="primary"
            size="large"
            @click="goToPayment"
          >
            {{ $t('Preview.continueToPayment') }}
          </v-btn>
        </v-card-actions>
      </template>

      <!-- Step 2: Payment -->
      <template v-if="step === 2 && item">
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

          <v-radio-group v-model="selectedPayment" class="mb-4" hide-details>
            <v-card
              class="mb-2"
              :color="selectedPayment === 'wallet' ? 'primary' : undefined"
              variant="outlined"
              @click="selectedPayment = 'wallet'"
            >
              <v-card-text class="d-flex align-center py-3">
                <v-radio class="ma-0" hide-details value="wallet" />
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
              :color="selectedPayment === 'card' ? 'primary' : undefined"
              variant="outlined"
              @click="selectedPayment = 'card'"
            >
              <v-card-text class="d-flex align-center py-3">
                <v-radio class="ma-0" hide-details value="card" />
                <span aria-label="X" class="x-icon ml-2 mr-3" role="img" v-html="xIconSvg" />
                <div>
                  <div class="text-body-1 font-weight-medium">{{ $t('Preview.xPayments') }}</div>
                  <div class="text-body-2 text-medium-emphasis">{{ $t('Preview.payWithXAccountBalance') }}</div>
                </div>
              </v-card-text>
            </v-card>
          </v-radio-group>

          <!-- Order summary -->
          <v-divider class="my-4" />

          <div class="d-flex justify-space-between align-center mb-2">
            <span class="text-body-2 text-medium-emphasis">{{ $t('Preview.subtotal') }}</span>
            <span class="text-body-2">{{ formatPrice(item.price) }}</span>
          </div>
          <div class="d-flex justify-space-between align-center mb-2">
            <span class="text-body-2 text-medium-emphasis">{{ $t('Preview.networkFee') }}</span>
            <span class="text-body-2">0.00001 XLM</span>
          </div>
          <v-divider class="my-2" />
          <div class="d-flex justify-space-between align-center">
            <span class="text-subtitle-1 font-weight-medium">{{ $t('Preview.total') }}</span>
            <span class="text-subtitle-1 font-weight-bold text-primary">
              {{ formatPrice(item.price + 0.00001) }}
            </span>
          </div>
        </v-card-text>

        <v-card-actions class="pa-4 pt-0">
          <v-btn
            block
            color="primary"
            :disabled="isProcessing"
            :loading="isProcessing"
            size="large"
            @click="handlePurchase"
          >
            <v-icon class="mr-2" icon="mdi-lock-open" />
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
        <v-btn
          v-if="step === 2"
          icon="mdi-arrow-left"
          variant="text"
          @click="goBack"
        />
        <v-toolbar-title class="text-subtitle-1 font-weight-medium">
          {{ step === 1 ? $t('Preview.unlockContent') : $t('Preview.payment') }}
        </v-toolbar-title>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
      </v-toolbar>

      <v-divider />

      <!-- Step 1: Confirm -->
      <template v-if="step === 1 && item">
        <v-card-text class="pa-6">
          <!-- Product preview -->
          <v-row align="center" class="mb-6">
            <v-col cols="auto">
              <v-avatar
                v-if="item.thumbnail"
                rounded="lg"
                size="100"
              >
                <v-img cover :src="item.thumbnail" />
              </v-avatar>
              <v-avatar
                v-else
                color="primary"
                rounded="lg"
                size="100"
                variant="tonal"
              >
                <v-icon :icon="typeIcon" size="40" />
              </v-avatar>
            </v-col>
            <v-col>
              <div class="text-h6">{{ item.title }}</div>
              <div v-if="item.creator" class="text-body-1 text-medium-emphasis mb-1">
                {{ $t('Preview.by') }} {{ item.creator.name }}
              </div>
              <v-chip
                color="primary"
                size="small"
                variant="tonal"
              >
                {{ typeLabel }}
              </v-chip>
            </v-col>
          </v-row>

          <!-- Price -->
          <v-card class="mb-6" color="surface-variant" variant="flat">
            <v-card-text class="d-flex align-center justify-space-between py-4">
              <span class="text-body-1 text-medium-emphasis">{{ $t('Preview.price') }}</span>
              <span class="text-h5 font-weight-bold text-primary">
                {{ formatPrice(item.price) }}
              </span>
            </v-card-text>
          </v-card>

          <!-- What's included -->
          <div class="text-subtitle-1 font-weight-medium mb-3">{{ $t('Preview.whatsIncluded') }}</div>
          <v-list class="bg-transparent pa-0" density="compact">
            <v-list-item
              v-for="(include, idx) in defaultIncludes"
              :key="idx"
              class="px-0"
            >
              <template #prepend>
                <v-icon class="mr-3" color="success" icon="mdi-check-circle" size="small" />
              </template>
              <v-list-item-title class="text-body-1">{{ include }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>

        <v-card-actions class="pa-6 pt-0">
          <v-btn
            block
            color="primary"
            size="large"
            @click="goToPayment"
          >
            {{ $t('Preview.continueToPayment') }}
          </v-btn>
        </v-card-actions>
      </template>

      <!-- Step 2: Payment -->
      <template v-if="step === 2 && item">
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

          <v-radio-group v-model="selectedPayment" class="mb-6" hide-details>
            <v-card
              class="mb-3"
              :color="selectedPayment === 'wallet' ? 'primary' : undefined"
              variant="outlined"
              @click="selectedPayment = 'wallet'"
            >
              <v-card-text class="d-flex align-center py-4">
                <v-radio class="ma-0" hide-details value="wallet" />
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
              :color="selectedPayment === 'card' ? 'primary' : undefined"
              variant="outlined"
              @click="selectedPayment = 'card'"
            >
              <v-card-text class="d-flex align-center py-4">
                <v-radio class="ma-0" hide-details value="card" />
                <span aria-label="X" class="x-icon x-icon--large ml-3 mr-4" role="img" v-html="xIconSvg" />
                <div>
                  <div class="text-body-1 font-weight-medium">{{ $t('Preview.xPayments') }}</div>
                  <div class="text-body-2 text-medium-emphasis">{{ $t('Preview.payWithXAccountBalance') }}</div>
                </div>
              </v-card-text>
            </v-card>
          </v-radio-group>

          <!-- Order summary -->
          <v-divider class="my-4" />

          <div class="d-flex justify-space-between align-center mb-3">
            <span class="text-body-1 text-medium-emphasis">{{ $t('Preview.subtotal') }}</span>
            <span class="text-body-1">{{ formatPrice(item.price) }}</span>
          </div>
          <div class="d-flex justify-space-between align-center mb-3">
            <span class="text-body-1 text-medium-emphasis">{{ $t('Preview.networkFee') }}</span>
            <span class="text-body-1">0.00001 XLM</span>
          </div>
          <v-divider class="my-3" />
          <div class="d-flex justify-space-between align-center">
            <span class="text-h6 font-weight-medium">{{ $t('Preview.total') }}</span>
            <span class="text-h6 font-weight-bold text-primary">
              {{ formatPrice(item.price + 0.00001) }}
            </span>
          </div>
        </v-card-text>

        <v-card-actions class="pa-6 pt-0">
          <v-btn
            block
            color="primary"
            :disabled="isProcessing"
            :loading="isProcessing"
            size="large"
            @click="handlePurchase"
          >
            <v-icon class="mr-2" icon="mdi-lock-open" />
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
</style>
