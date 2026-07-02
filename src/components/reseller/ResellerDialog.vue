<!--
  ResellerDialog.vue — "EARN LUMENS" reseller link modal

  Lets a logged-in user (who is not the content creator) generate a shareable
  link that earns them a commission when someone buys the content through it.

  Flow:
  1. Fetch the entry's live reseller info (current commission %, price, own-content
     flag, whether resells are enabled).
  2. Handle non-resellable states (free content / creator disabled resells /
     own content) with a clear message.
  3. Require a valid, activated Stellar wallet before generating the link
     (connect via wallet kit or paste a public key), mirroring the franchise flow.
  4. Generate (or fetch the existing) link — one active link per content per user —
     then show the product URL with `?r=<code>` and a copy button.

  Responsive: native v-dialog, fullscreen on mobile.

  The commission shown here is orientative: the reseller's real commission is
  computed at purchase time. The authoritative current value also lives in
  Account → Resellers.
-->
<template>
  <v-dialog
    v-model="open"
    :fullscreen="isMobile"
    max-width="520"
    scrollable
  >
    <v-card>
      <v-toolbar color="surface" density="comfortable" flat>
        <v-toolbar-title class="text-h6 font-weight-bold d-flex align-center ga-2">
          <v-icon color="primary" icon="mdi-cash-multiple" />
          {{ $t('Reseller.title') }}
        </v-toolbar-title>
        <template #append>
          <v-btn
            :aria-label="$t('Common.close')"
            icon="mdi-close"
            variant="text"
            @click="open = false"
          />
        </template>
      </v-toolbar>

      <v-divider />

      <v-card-text class="pa-4">
        <!-- LOADING -->
        <div v-if="loadingInfo" class="py-8">
          <v-skeleton-loader type="article" />
        </div>

        <!-- LOAD ERROR -->
        <v-alert
          v-else-if="loadError"
          class="mb-0"
          type="error"
          variant="tonal"
        >
          {{ loadError }}
          <div class="mt-3">
            <v-btn
              color="error"
              size="small"
              variant="tonal"
              @click="fetchInfo"
            >
              {{ $t('Common.retry') }}
            </v-btn>
          </div>
        </v-alert>

        <!-- OWN CONTENT -->
        <v-alert
          v-else-if="info?.ownContent"
          class="mb-0"
          icon="mdi-account-alert"
          type="info"
          variant="tonal"
        >
          {{ $t('Reseller.ownContent') }}
        </v-alert>

        <!-- RESELLS DISABLED / FREE -->
        <v-alert
          v-else-if="info && !info.resellerEnabled"
          class="mb-0"
          icon="mdi-link-off"
          type="info"
          variant="tonal"
        >
          {{ $t('Reseller.disabledForContent') }}
        </v-alert>

        <!-- MAIN FLOW -->
        <template v-else-if="info">
          <p class="text-body-2 text-medium-emphasis mb-4">
            {{ $t('Reseller.intro') }}
          </p>

          <!-- Commission highlight -->
          <v-sheet
            border
            class="d-flex align-center justify-space-between pa-4 mb-1 rounded-lg"
            color="surface"
          >
            <div>
              <div class="text-caption text-medium-emphasis">
                {{ $t('Reseller.yourCommission') }}
              </div>
              <div class="text-h5 font-weight-bold text-primary">
                {{ commissionLabel }}
              </div>
            </div>
            <v-icon color="primary" icon="mdi-percent-outline" size="36" />
          </v-sheet>
          <p class="text-caption text-medium-emphasis mb-4">
            {{ $t('Reseller.commissionOrientative') }}
          </p>

          <!-- GENERATED LINK -->
          <template v-if="generatedLink">
            <v-alert
              class="mb-3"
              icon="mdi-check-circle"
              type="success"
              variant="tonal"
            >
              {{ $t('Reseller.linkReady') }}
            </v-alert>

            <v-text-field
              :model-value="generatedLink"
              class="mb-1"
              density="comfortable"
              hide-details
              readonly
              variant="outlined"
            >
              <template #append-inner>
                <v-btn
                  :color="copied ? 'success' : 'primary'"
                  :prepend-icon="copied ? 'mdi-check' : 'mdi-content-copy'"
                  size="small"
                  variant="text"
                  @click="copyLink"
                >
                  {{ copied ? $t('Common.copied') : $t('Common.copy') }}
                </v-btn>
              </template>
            </v-text-field>

            <p class="text-caption text-medium-emphasis mb-0">
              {{ $t('Reseller.manageHint') }}
            </p>
          </template>

          <!-- GENERATE FLOW -->
          <template v-else>
            <div class="text-subtitle-2 font-weight-bold mb-1">
              {{ $t('Reseller.payoutWallet') }}
            </div>
            <p class="text-caption text-medium-emphasis mb-2">
              {{ $t('Reseller.walletHint') }}
            </p>

            <v-btn
              v-if="!walletStore.isConnected"
              block
              class="mb-3"
              color="primary"
              prepend-icon="mdi-wallet"
              variant="tonal"
              @click="connectWallet"
            >
              {{ $t('Reseller.connectWallet') }}
            </v-btn>

            <!--
              Full public key, wrapping onto a second line (the tail of a
              Stellar address is its most distinguishing part, so it must
              never be clipped). A textarea (not a text-field) so the value
              is always fully visible.
            -->
            <v-textarea
              v-model="walletInput"
              :error-messages="walletError ? [walletError] : []"
              :label="$t('Reseller.walletLabel')"
              auto-grow
              class="mb-1 wallet-input"
              density="comfortable"
              placeholder="G…"
              rows="2"
              variant="outlined"
            >
              <template #append-inner>
                <v-progress-circular
                  v-if="walletChecking"
                  color="primary"
                  indeterminate
                  size="20"
                  width="2"
                />
                <v-icon
                  v-else-if="walletVerified"
                  color="success"
                  icon="mdi-check-circle"
                />
              </template>
            </v-textarea>

            <p v-if="walletVerified" class="text-caption text-success mb-3">
              <v-icon icon="mdi-shield-check" size="14" start />
              {{ $t('Reseller.walletVerified') }}
            </p>

            <v-alert
              v-if="walletInactive"
              class="mb-3"
              density="compact"
              type="warning"
              variant="tonal"
            >
              {{ $t('Reseller.walletNotActivated') }}
            </v-alert>

            <v-btn
              :disabled="!canGenerate"
              :loading="generating"
              block
              color="primary"
              prepend-icon="mdi-link-plus"
              size="large"
              @click="generate"
            >
              {{ $t('Reseller.generateLink') }}
            </v-btn>
          </template>
        </template>
      </v-card-text>
    </v-card>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { ResellerEntryInfoDto } from '@/api/modules/reseller.api'

  import { computed, reactive, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'

  import { api, ApiError } from '@/api/api'
  import { accountExists } from '@/services/stellar'
  import { useAppStore } from '@/stores/app'
  import { useWalletStore } from '@/stores/wallet'

  const props = defineProps<{
    modelValue: boolean
    entryId: string
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
  }>()

  const { t } = useI18n()
  const appStore = useAppStore()
  const walletStore = useWalletStore()

  const WALLET_RE = /^G[A-Z2-7]{55}$/

  const open = computed({
    get: () => props.modelValue,
    set: (v: boolean) => emit('update:modelValue', v),
  })
  const isMobile = computed(() => appStore.mobileView)

  const loadingInfo = ref(false)
  const loadError = ref('')
  const info = ref<ResellerEntryInfoDto | null>(null)

  const walletInput = ref('')
  const walletError = ref('')
  const walletInactive = ref(false)
  const walletChecking = ref(false)
  const walletVerified = ref(false)
  const generating = ref(false)
  const generatedLink = ref('')
  const copied = ref(false)

  // Serializes on-chain wallet checks so a stale response can never mark a
  // newer input as verified.
  let verifySeq = 0
  let verifyTimer: ReturnType<typeof setTimeout> | undefined

  const snackbar = reactive({ show: false, text: '', color: 'success' })

  const commissionLabel = computed(() => {
    const pct = info.value?.commissionPercent
    return pct == null ? '—' : `${Number(pct)}%`
  })

  // The link can only be generated once the wallet has passed the full
  // checklist: valid format AND verified active on the Stellar network.
  const canGenerate = computed(() =>
    WALLET_RE.test(walletInput.value.trim()) && walletVerified.value && !generating.value)

  watch(
    () => props.modelValue,
    open_ => {
      if (open_) {
        resetState()
        fetchInfo()
      }
    },
  )

  watch(walletInput, () => {
    walletError.value = ''
    scheduleWalletVerify()
  })

  function resetState () {
    loadError.value = ''
    info.value = null
    walletError.value = ''
    walletInactive.value = false
    generatedLink.value = ''
    copied.value = false
    // Pre-fill with the connected wallet when available, and kick off the
    // on-chain verification for it (the input watcher won't fire when the
    // dialog reopens with the same address).
    walletInput.value = walletStore.activeAddress || ''
    scheduleWalletVerify()
  }

  /**
   * Debounced on-chain verification of the entered wallet. Only wallets that
   * exist (are funded/active) on the Stellar network pass the checklist and
   * enable link generation — the backend re-validates this on create, so this
   * is UX, not the security boundary.
   */
  function scheduleWalletVerify () {
    verifySeq++
    walletVerified.value = false
    walletInactive.value = false
    walletChecking.value = false
    if (verifyTimer) clearTimeout(verifyTimer)
    const wallet = walletInput.value.trim()
    if (!WALLET_RE.test(wallet)) return
    const seq = verifySeq
    walletChecking.value = true
    verifyTimer = setTimeout(async () => {
      try {
        const active = await accountExists(wallet)
        if (seq !== verifySeq) return
        walletVerified.value = active
        walletInactive.value = !active
      } catch {
        if (seq !== verifySeq) return
        walletError.value = t('Reseller.errors.verifyFailed')
      } finally {
        if (seq === verifySeq) walletChecking.value = false
      }
    }, 450)
  }

  async function fetchInfo () {
    loadingInfo.value = true
    loadError.value = ''
    try {
      info.value = await api.resellers.entryInfo(props.entryId)
    } catch {
      loadError.value = t('Reseller.errors.loadFailed')
    } finally {
      loadingInfo.value = false
    }
  }

  async function connectWallet () {
    try {
      await walletStore.connect()
      if (walletStore.activeAddress) {
        walletInput.value = walletStore.activeAddress
        walletError.value = ''
      }
    } catch {
      notify(t('Reseller.errors.connectFailed'), 'error')
    }
  }

  async function generate () {
    const wallet = walletInput.value.trim()
    if (!WALLET_RE.test(wallet)) {
      walletError.value = t('Reseller.errors.wallet_format')
      return
    }
    // The wallet was already verified active on-chain by the checklist
    // (canGenerate); the backend re-validates format + on-chain activity.
    if (!walletVerified.value) return
    generating.value = true
    walletError.value = ''
    try {
      const link = await api.resellers.create(props.entryId, wallet)
      generatedLink.value = buildProductUrl(link.code)
    } catch (error_) {
      notify(localiseError(error_), 'error')
    } finally {
      generating.value = false
    }
  }

  function buildProductUrl (code: string): string {
    const origin = window.location.origin
    return `${origin}/preview/${encodeURIComponent(props.entryId)}?r=${encodeURIComponent(code)}`
  }

  async function copyLink () {
    try {
      await navigator.clipboard.writeText(generatedLink.value)
      copied.value = true
      setTimeout(() => (copied.value = false), 2000)
    } catch {
      notify(t('Reseller.errors.copyFailed'), 'error')
    }
  }

  function notify (text: string, color: 'success' | 'error' = 'success') {
    snackbar.text = text
    snackbar.color = color
    snackbar.show = true
  }

  /** Maps a backend reseller error code to a localized message. */
  function localiseError (error_: unknown): string {
    if (error_ instanceof ApiError) {
      const code = (error_.message || '').toLowerCase()
      const key = `Reseller.errors.${code}`
      const msg = t(key)
      if (msg !== key) return msg
    }
    return t('Reseller.errors.generic')
  }
</script>

<style scoped>
  /* Full Stellar public key, wrapped — the tail must always be visible. */
  .wallet-input :deep(textarea) {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.875rem;
    line-height: 1.5;
    word-break: break-all;
  }
</style>
