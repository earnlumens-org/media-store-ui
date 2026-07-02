<route lang="json">
  { "path": "/account/resellers" }
</route>

<!--
  MyResellerLinks.vue — Account → Resellers

  Lists every reseller link the current user owns under this storefront. For
  each link the user can copy the shareable URL (product page + `?r=<code>`),
  see the live commission %, change the payout wallet, and is told when the
  creator has disabled resells (the link still opens the content, but new sales
  won't earn a commission).
-->
<template>
  <v-container class="py-8" style="max-width: 820px;">
    <!-- Header -->
    <div class="d-flex align-center ga-3 mb-6">
      <v-btn
        icon="mdi-arrow-left"
        size="small"
        variant="text"
        @click="router.push('/account')"
      />
      <div>
        <h1 class="text-h5 font-weight-bold">{{ t('ResellerLinks.title') }}</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">{{ t('ResellerLinks.subtitle') }}</p>
      </div>
    </div>

    <!-- Not authenticated -->
    <v-card v-if="authReady && !isAuthenticated" variant="tonal">
      <v-card-text class="text-center py-10">
        <v-icon class="mb-3" color="medium-emphasis" size="48">mdi-account-lock-outline</v-icon>
        <p class="text-body-1 mb-4">{{ t('ResellerLinks.loginRequired') }}</p>
        <CxLoginDialog />
      </v-card-text>
    </v-card>

    <template v-else>
      <!-- Loading -->
      <div v-if="loading">
        <v-skeleton-loader class="mb-3" type="list-item-avatar-two-line" />
        <v-skeleton-loader class="mb-3" type="list-item-avatar-two-line" />
      </div>

      <!-- Load error -->
      <v-alert
        v-else-if="loadError"
        type="error"
        variant="tonal"
      >
        {{ loadError }}
        <div class="mt-3">
          <v-btn color="error" size="small" variant="tonal" @click="load">
            {{ t('ResellerLinks.retry') }}
          </v-btn>
        </div>
      </v-alert>

      <!-- Empty -->
      <v-card v-else-if="links.length === 0" variant="tonal">
        <v-card-text class="text-center py-10">
          <v-icon class="mb-3" color="medium-emphasis" size="48">mdi-link-variant</v-icon>
          <p class="text-body-1 mb-1">{{ t('ResellerLinks.empty') }}</p>
          <p class="text-body-2 text-medium-emphasis mb-0">{{ t('ResellerLinks.emptyHint') }}</p>
        </v-card-text>
      </v-card>

      <!-- Links -->
      <template v-else>
        <v-card
          v-for="link in links"
          :key="link.id"
          class="mb-3"
          variant="outlined"
        >
          <v-card-text>
            <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-2">
              <div class="text-subtitle-1 font-weight-medium text-truncate" style="min-width: 0">
                {{ link.entryTitle || t('ResellerLinks.title') }}
              </div>
              <div class="d-flex align-center ga-2">
                <v-chip
                  v-if="link.resellerEnabled"
                  color="primary"
                  size="small"
                  variant="tonal"
                >
                  {{ t('ResellerLinks.commission') }}: {{ formatPercent(link.commissionPercent) }}
                </v-chip>
                <v-chip
                  v-else
                  color="warning"
                  size="small"
                  variant="tonal"
                >
                  {{ t('ResellerLinks.resaleDisabled') }}
                </v-chip>
              </div>
            </div>

            <p
              v-if="!link.resellerEnabled"
              class="text-caption text-warning mb-3"
            >
              {{ t('ResellerLinks.resaleDisabledHint') }}
            </p>

            <!-- Share link -->
            <v-text-field
              :model-value="buildProductUrl(link)"
              class="mb-2"
              density="comfortable"
              hide-details
              readonly
              variant="outlined"
            >
              <template #append-inner>
                <v-btn
                  :color="copiedId === link.id ? 'success' : 'primary'"
                  :prepend-icon="copiedId === link.id ? 'mdi-check' : 'mdi-content-copy'"
                  size="small"
                  variant="text"
                  @click="copyLink(link)"
                >
                  {{ copiedId === link.id ? t('ResellerLinks.linkCopied') : t('ResellerLinks.copyLink') }}
                </v-btn>
              </template>
            </v-text-field>

            <!-- Wallet -->
            <div v-if="editingId !== link.id">
              <div class="text-caption text-medium-emphasis mb-1">
                {{ t('ResellerLinks.payoutWallet') }}
              </div>
              <div class="d-flex align-start justify-space-between flex-wrap ga-2">
                <!-- Full address, wrapping onto a second line: the tail of a
                     Stellar key is its most distinguishing part. -->
                <code class="wallet-full text-body-2" style="min-width: 0">{{ link.resellerWallet }}</code>
                <v-btn
                  prepend-icon="mdi-wallet-outline"
                  size="small"
                  variant="text"
                  @click="startEditWallet(link)"
                >
                  {{ t('ResellerLinks.changeWallet') }}
                </v-btn>
              </div>
            </div>

            <!-- Wallet edit: connect-first, manual entry verified on-chain -->
            <div v-else>
              <v-btn
                v-if="!walletStore.isConnected"
                block
                class="mb-3"
                color="primary"
                prepend-icon="mdi-wallet"
                variant="tonal"
                @click="connectWallet"
              >
                {{ t('Reseller.connectWallet') }}
              </v-btn>
              <v-btn
                v-else-if="walletStore.activeAddress && walletDraft.trim() !== walletStore.activeAddress"
                block
                class="mb-3"
                color="primary"
                prepend-icon="mdi-wallet"
                variant="tonal"
                @click="walletDraft = walletStore.activeAddress"
              >
                {{ t('ResellerLinks.useConnected') }}
              </v-btn>

              <v-textarea
                v-model="walletDraft"
                :error-messages="walletError ? [walletError] : []"
                :label="t('ResellerLinks.payoutWallet')"
                auto-grow
                class="wallet-input"
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

              <p v-if="walletVerified" class="text-caption text-success mb-2">
                <v-icon icon="mdi-shield-check" size="14" start />
                {{ t('Reseller.walletVerified') }}
              </p>
              <v-alert
                v-if="walletInactive"
                class="mb-2"
                density="compact"
                type="warning"
                variant="tonal"
              >
                {{ t('Reseller.walletNotActivated') }}
              </v-alert>

              <div class="d-flex justify-end ga-2">
                <v-btn
                  size="small"
                  variant="text"
                  @click="cancelEditWallet"
                >
                  {{ t('ResellerLinks.cancel') }}
                </v-btn>
                <v-btn
                  :disabled="!canSaveWallet(link)"
                  :loading="savingWallet"
                  color="primary"
                  size="small"
                  variant="elevated"
                  @click="saveWallet(link)"
                >
                  {{ t('ResellerLinks.saveWallet') }}
                </v-btn>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </template>
    </template>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script lang="ts" setup>
  import type { ResellerLinkDto } from '@/api/modules/reseller.api'

  import { storeToRefs } from 'pinia'
  import { onMounted, reactive, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'

  import { api, ApiError } from '@/api/api'
  import CxLoginDialog from '@/components/CxLoginDialog.vue'
  import { accountExists } from '@/services/stellar'
  import { useAuthStore } from '@/stores/auth'
  import { useWalletStore } from '@/stores/wallet'

  const router = useRouter()
  const { t } = useI18n()
  const authStore = useAuthStore()
  const walletStore = useWalletStore()
  const { isAuthenticated, isAuthReady: authReady } = storeToRefs(authStore)

  const WALLET_RE = /^G[A-Z2-7]{55}$/

  const loading = ref(false)
  const loadError = ref('')
  const links = ref<ResellerLinkDto[]>([])

  const copiedId = ref('')
  const editingId = ref('')
  const walletDraft = ref('')
  const walletError = ref('')
  const walletChecking = ref(false)
  const walletVerified = ref(false)
  const walletInactive = ref(false)
  const savingWallet = ref(false)

  // Serializes on-chain wallet checks so a stale response can never mark a
  // newer input as verified.
  let verifySeq = 0
  let verifyTimer: ReturnType<typeof setTimeout> | undefined

  const snackbar = reactive({ show: false, text: '', color: 'success' })

  watch(walletDraft, () => {
    walletError.value = ''
    scheduleWalletVerify()
  })

  onMounted(load)

  async function load () {
    if (!isAuthenticated.value) return
    loading.value = true
    loadError.value = ''
    try {
      links.value = await api.resellers.mine()
    } catch {
      loadError.value = t('ResellerLinks.loadError')
    } finally {
      loading.value = false
    }
  }

  function formatPercent (pct: number | null): string {
    return pct == null ? '—' : `${Number(pct)}%`
  }

  function buildProductUrl (link: ResellerLinkDto): string {
    const origin = window.location.origin
    return `${origin}/preview/${encodeURIComponent(link.entryId)}?r=${encodeURIComponent(link.code)}`
  }

  async function copyLink (link: ResellerLinkDto) {
    try {
      await navigator.clipboard.writeText(buildProductUrl(link))
      copiedId.value = link.id
      setTimeout(() => {
        if (copiedId.value === link.id) copiedId.value = ''
      }, 2000)
    } catch {
      notify(t('Reseller.errors.copyFailed'), 'error')
    }
  }

  function startEditWallet (link: ResellerLinkDto) {
    editingId.value = link.id
    walletDraft.value = link.resellerWallet
    walletError.value = ''
    // The watcher won't fire if the draft already equals this wallet; verify
    // explicitly so the checklist state is always fresh.
    scheduleWalletVerify()
  }

  function cancelEditWallet () {
    editingId.value = ''
    walletDraft.value = ''
    walletError.value = ''
    walletInactive.value = false
    walletVerified.value = false
  }

  async function connectWallet () {
    try {
      await walletStore.connect()
      if (walletStore.activeAddress) {
        walletDraft.value = walletStore.activeAddress
      }
    } catch {
      notify(t('Reseller.errors.connectFailed'), 'error')
    }
  }

  /**
   * Debounced on-chain verification of the entered wallet. Only wallets that
   * exist (are funded/active) on the Stellar network pass the checklist and
   * enable saving — the backend re-validates on update, so this is UX, not
   * the security boundary.
   */
  function scheduleWalletVerify () {
    verifySeq++
    walletVerified.value = false
    walletInactive.value = false
    walletChecking.value = false
    if (verifyTimer) clearTimeout(verifyTimer)
    const wallet = walletDraft.value.trim()
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

  /** Save requires: valid format, verified active on-chain, actually changed. */
  function canSaveWallet (link: ResellerLinkDto): boolean {
    const wallet = walletDraft.value.trim()
    return WALLET_RE.test(wallet)
      && walletVerified.value
      && wallet !== link.resellerWallet
      && !savingWallet.value
  }

  async function saveWallet (link: ResellerLinkDto) {
    const wallet = walletDraft.value.trim()
    if (!canSaveWallet(link)) return
    savingWallet.value = true
    try {
      const updated = await api.resellers.updateWallet(link.id, wallet)
      const idx = links.value.findIndex(l => l.id === link.id)
      if (idx !== -1) links.value[idx] = updated
      cancelEditWallet()
      notify(t('ResellerLinks.walletUpdated'), 'success')
    } catch (error_) {
      notify(localiseError(error_), 'error')
    } finally {
      savingWallet.value = false
    }
  }

  function notify (text: string, color: 'success' | 'error' = 'success') {
    snackbar.text = text
    snackbar.color = color
    snackbar.show = true
  }

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
  .wallet-full {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    word-break: break-all;
  }
  .wallet-input :deep(textarea) {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.875rem;
    line-height: 1.5;
    word-break: break-all;
  }
</style>
