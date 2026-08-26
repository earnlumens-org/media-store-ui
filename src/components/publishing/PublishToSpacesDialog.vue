<!--
  PublishToSpacesDialog.vue — Publishing Block queue flow

  Battlefield-style queue UX: for each space the creator sees exactly what
  will happen — which block, when it publishes, how many slots are used and
  how many publications are ahead. Entities publish immediately on the
  profile; space visibility is released in blocks.

  Two views:
    - select  : pick spaces + enqueue (FastPass purchase when a space is full)
    - status  : live queue items with countdown, position, priority-fee boost
                and cancel (until the block locks, 1 min before publishing)

  Payments (priority fee / FastPass) mirror the audited TipDialog pipeline:
  prepare → wallet sign → submit → poll until confirmed.
-->

<script setup lang="ts">
  import { computed, onBeforeUnmount, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { VBottomSheet, VDialog } from 'vuetify/components'

  import { api } from '@/api/api'
  import type { PublishingEntityType, QueueItemStatusDto, SpaceQueuePreviewDto } from '@/api/modules/publishing.api'
  import { accountExists } from '@/services/stellar'

  import { useAppStore } from '@/stores/app'
  import { useWalletStore } from '@/stores/wallet'

  const props = defineProps<{
    modelValue: boolean
    entityType: PublishingEntityType
    entityId: string | null
    entityTitle?: string
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'queued'): void
  }>()

  const { t } = useI18n()
  const appStore = useAppStore()
  const walletStore = useWalletStore()

  const dialogOpen = computed({
    get: () => props.modelValue,
    set: v => emit('update:modelValue', v),
  })
  const isMobile = computed(() => appStore.mobileView)
  const wrapper = computed(() => (isMobile.value ? VBottomSheet : VDialog))
  const wrapperProps = computed(() =>
    isMobile.value
      ? { fullscreen: true, maxWidth: 560, persistent: true }
      : { maxWidth: 560, persistent: true, scrollable: true },
  )

  // ── State ─────────────────────────────────────────────────
  type View = 'select' | 'status'
  const view = ref<View>('select')
  const loading = ref(false)
  const error = ref<string | null>(null)

  const spaces = ref<SpaceQueuePreviewDto[]>([])
  const selected = ref<string[]>([])
  const items = ref<QueueItemStatusDto[]>([])

  const enqueueing = ref(false)
  const cancellingId = ref<string | null>(null)

  // Priority fee boost
  const boostItem = ref<QueueItemStatusDto | null>(null)
  const boostAmount = ref('')
  const paying = ref(false)
  const payError = ref<string | null>(null)
  // FastPass
  const fastPassSpace = ref<SpaceQueuePreviewDto | null>(null)

  // Live clock for countdowns
  const now = ref(Date.now())
  let clock: ReturnType<typeof setInterval> | null = null
  let refresher: ReturnType<typeof setInterval> | null = null

  // ── Loading ───────────────────────────────────────────────
  async function loadAll () {
    if (!props.entityId) return
    loading.value = true
    error.value = null
    try {
      const [sp, it] = await Promise.all([
        api.publishing.getSpaces(props.entityType, props.entityId),
        api.publishing.getQueueStatus(props.entityType, props.entityId),
      ])
      spaces.value = sp
      items.value = it.filter(i => i.status === 'QUEUED' || i.status === 'LOCKED')
      view.value = items.value.length > 0 ? 'status' : 'select'
    } catch (error_) {
      error.value = localiseCode(error_)
    } finally {
      loading.value = false
    }
  }

  async function refreshStatus () {
    if (!props.entityId || !dialogOpen.value) return
    try {
      const it = await api.publishing.getQueueStatus(props.entityType, props.entityId)
      items.value = it.filter(i => i.status === 'QUEUED' || i.status === 'LOCKED')
    } catch { /* transient — keep last snapshot */ }
  }

  watch(dialogOpen, open => {
    if (open) {
      selected.value = []
      boostItem.value = null
      fastPassSpace.value = null
      error.value = null
      payError.value = null
      loadAll()
      now.value = Date.now()
      clock = setInterval(() => { now.value = Date.now() }, 1000)
      refresher = setInterval(refreshStatus, 10_000)
    } else {
      if (clock) { clearInterval(clock); clock = null }
      if (refresher) { clearInterval(refresher); refresher = null }
    }
  })
  onBeforeUnmount(() => {
    if (clock) clearInterval(clock)
    if (refresher) clearInterval(refresher)
  })

  // ── Formatting ────────────────────────────────────────────
  function countdown (epochMs: number | null): string {
    if (epochMs == null) return '—'
    const s = Math.max(0, Math.floor((epochMs - now.value) / 1000))
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      : `${m}:${String(sec).padStart(2, '0')}`
  }

  function timeOfDay (epochMs: number | null): string {
    if (epochMs == null) return '—'
    return new Date(epochMs).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }

  function localiseCode (error_: unknown): string {
    const msg = error_ instanceof Error ? error_.message : ''
    const map: Record<string, string> = {
      NO_SPACES_SELECTED: 'Publishing.errors.noSpacesSelected',
      SYSTEM_SPACE_NOT_ALLOWED: 'Publishing.errors.systemSpaceNotAllowed',
      ALREADY_PUBLISHED_TO_SPACE: 'Publishing.errors.alreadyPublished',
      ALREADY_QUEUED: 'Publishing.errors.alreadyQueued',
      QUEUE_CONTENTION: 'Publishing.errors.queueContention',
      QUEUE_ITEM_NOT_FOUND: 'Publishing.errors.itemNotFound',
      NOT_OWNER: 'Publishing.errors.notOwner',
      BLOCK_LOCKED: 'Publishing.errors.blockLocked',
      BLOCK_NOT_FOUND: 'Publishing.errors.blockLocked',
      FAST_PASS_NOT_AVAILABLE: 'Publishing.errors.fastPassNotAvailable',
      FEE_AMOUNT_INVALID: 'Publishing.errors.feeAmountInvalid',
      ENTITY_TYPE_NOT_SUPPORTED: 'Publishing.errors.generic',
      ENTITY_NOT_FOUND: 'Publishing.errors.generic',
      ENTITY_NOT_PUBLISHED: 'Publishing.errors.entityNotPublished',
      SPACE_NOT_FOUND: 'Publishing.errors.generic',
      SPLIT_WALLET_NOT_ACTIVE: 'Preview.contentWalletInactive',
      WALLET_NOT_ACTIVATED: 'Preview.walletNotActivated',
      PAYMENT_NOT_CONFIRMED: 'Preview.paymentFailed',
      PAYMENT_CONFIRMATION_TIMEOUT: 'Preview.paymentConfirmTimeout',
    }
    const key = map[msg]
    return key ? t(key) : (msg || t('Publishing.errors.generic'))
  }

  // ── Selection / enqueue ───────────────────────────────────
  const selectableSpaces = computed(() =>
    spaces.value.filter(s => !s.alreadyPublished && !s.alreadyQueued))

  function toggleSpace (s: SpaceQueuePreviewDto) {
    if (s.alreadyPublished || s.alreadyQueued || spaceIsFull(s)) return
    selected.value = selected.value.includes(s.spaceId)
      ? selected.value.filter(id => id !== s.spaceId)
      : [...selected.value, s.spaceId]
  }

  function spaceIsFull (s: SpaceQueuePreviewDto): boolean {
    return s.baseSlotsUsed >= s.baseCapacity
  }

  async function enqueue () {
    if (!props.entityId || selected.value.length === 0) return
    enqueueing.value = true
    error.value = null
    try {
      await api.publishing.enqueue(props.entityType, props.entityId, selected.value)
      selected.value = []
      emit('queued')
      await loadAll()
      view.value = 'status'
    } catch (error_) {
      error.value = localiseCode(error_)
    } finally {
      enqueueing.value = false
    }
  }

  // ── Cancel ────────────────────────────────────────────────
  async function cancelItem (item: QueueItemStatusDto) {
    cancellingId.value = item.itemId
    error.value = null
    try {
      await api.publishing.cancelItem(item.itemId)
      await loadAll()
    } catch (error_) {
      error.value = localiseCode(error_)
    } finally {
      cancellingId.value = null
    }
  }

  // ── Payments (shared pipeline) ────────────────────────────
  async function runPayment (prepare: (wallet: string) => ReturnType<typeof api.payment.preparePublishFee>) {
    paying.value = true
    payError.value = null
    try {
      if (!walletStore.isConnected) {
        const connected = await walletStore.connect()
        if (!connected) throw new Error(t('Preview.connectWalletError'))
      }
      const wallet = walletStore.activeAddress
      if (!wallet) throw new Error(t('Preview.noWalletAddress'))
      if (!(await accountExists(wallet))) throw new Error('WALLET_NOT_ACTIVATED')

      const prepared = await prepare(wallet)
      const signResult = await walletStore.signTransaction(prepared.unsignedXdr, {
        networkPassphrase: prepared.networkPassphrase,
        address: wallet,
      })
      let result = await api.payment.submit(prepared.orderId, signResult.signedTxXdr)
      if (result.status === 'PROCESSING') {
        result = await waitForOrderConfirmation(result.orderId)
      }
      return true
    } catch (error_) {
      payError.value = localiseCode(error_)
      return false
    } finally {
      paying.value = false
    }
  }

  async function waitForOrderConfirmation (orderId: string) {
    const POLL_INTERVAL_MS = 2000
    const MAX_ATTEMPTS = 45
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))
      try {
        const order = await api.payment.getOrder(orderId)
        if (order.status === 'COMPLETED') return order
        if (order.status === 'FAILED' || order.status === 'EXPIRED') {
          throw new Error('PAYMENT_NOT_CONFIRMED')
        }
      } catch (error_) {
        if (error_ instanceof Error && error_.message === 'PAYMENT_NOT_CONFIRMED') throw error_
      }
    }
    throw new Error('PAYMENT_CONFIRMATION_TIMEOUT')
  }

  // Priority fee boost
  function openBoost (item: QueueItemStatusDto) {
    boostItem.value = item
    boostAmount.value = ''
    payError.value = null
  }

  const boostValid = computed(() => {
    const n = Number.parseFloat(boostAmount.value)
    return Number.isFinite(n) && n > 0
  })

  async function payBoost () {
    const item = boostItem.value
    if (!item || !boostValid.value) return
    const amount = Number.parseFloat(boostAmount.value)
    const ok = await runPayment(wallet =>
      api.payment.preparePublishFee(wallet, { queueItemId: item.itemId, amountXlm: amount }))
    if (ok) {
      boostItem.value = null
      await refreshStatus()
    }
  }

  // FastPass
  function openFastPass (s: SpaceQueuePreviewDto) {
    fastPassSpace.value = s
    payError.value = null
  }

  async function payFastPass () {
    const s = fastPassSpace.value
    if (!s || !props.entityId) return
    const ok = await runPayment(wallet =>
      api.payment.prepareFastPass(wallet, {
        spaceId: s.spaceId,
        entityType: props.entityType,
        entityId: props.entityId!,
      }))
    if (ok) {
      fastPassSpace.value = null
      emit('queued')
      await loadAll()
      view.value = 'status'
    }
  }

  function closeDialog () {
    dialogOpen.value = false
  }
</script>

<template>
  <component :is="wrapper" v-model="dialogOpen" v-bind="wrapperProps">
    <v-card :class="isMobile ? 'rounded-t-xl rounded-0' : ''">
      <v-toolbar color="transparent" density="compact">
        <v-toolbar-title class="text-subtitle-1 font-weight-medium">
          {{ t('Publishing.title') }}
        </v-toolbar-title>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
      </v-toolbar>
      <v-divider />

      <v-card-text :class="isMobile ? 'pa-4' : 'pa-6'">
        <div v-if="entityTitle" class="text-body-2 text-medium-emphasis mb-3 text-truncate">
          {{ entityTitle }}
        </div>

        <v-alert v-if="error" class="mb-4" density="compact" type="error" variant="tonal">
          {{ error }}
        </v-alert>

        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate />
        </div>

        <template v-else>
          <!-- View switch when the entity is queued somewhere -->
          <v-btn-toggle
            v-if="items.length > 0"
            v-model="view"
            class="mb-4"
            density="compact"
            divided
            mandatory
            variant="outlined"
          >
            <v-btn size="small" value="status">
              {{ t('Publishing.tabs.myQueue', { count: items.length }) }}
            </v-btn>
            <v-btn size="small" value="select">
              {{ t('Publishing.tabs.addSpaces') }}
            </v-btn>
          </v-btn-toggle>

          <!-- ═══════════ SELECT VIEW ═══════════ -->
          <template v-if="view === 'select'">
            <p class="text-body-2 text-medium-emphasis mb-4">
              {{ t('Publishing.selectHint') }}
            </p>

            <div v-if="spaces.length === 0" class="text-center text-medium-emphasis py-6">
              {{ t('Publishing.noSpaces') }}
            </div>

            <v-card
              v-for="s in spaces"
              :key="s.spaceId"
              class="mb-2"
              :disabled="s.alreadyPublished || s.alreadyQueued"
              variant="outlined"
              @click="toggleSpace(s)"
            >
              <v-card-text class="py-3">
                <div class="d-flex align-center">
                  <v-checkbox-btn
                    v-if="!s.alreadyPublished && !s.alreadyQueued && !spaceIsFull(s)"
                    class="flex-grow-0 mr-2"
                    density="compact"
                    :model-value="selected.includes(s.spaceId)"
                  />
                  <v-icon v-if="s.spaceIcon" class="mr-2" :icon="s.spaceIcon" size="20" />
                  <div class="flex-grow-1 min-width-0">
                    <div class="text-subtitle-2">{{ s.spaceName || s.spaceId }}</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ t('Publishing.blockInfo', {
                        seq: s.nextBlockSequence,
                        time: timeOfDay(s.nextBlockPublishAtEpochMs),
                        used: s.baseSlotsUsed,
                        capacity: s.baseCapacity,
                      }) }}
                      <template v-if="s.waitingAhead > 0">
                        · {{ t('Publishing.waitingAhead', { count: s.waitingAhead }) }}
                      </template>
                    </div>
                    <div v-if="s.nextBlockPublishAtEpochMs" class="text-caption text-primary">
                      {{ t('Publishing.publishesIn', { countdown: countdown(s.nextBlockPublishAtEpochMs) }) }}
                    </div>
                  </div>
                  <div class="ml-2 flex-shrink-0">
                    <v-chip v-if="s.alreadyPublished" color="success" size="x-small" variant="tonal">
                      {{ t('Publishing.chips.published') }}
                    </v-chip>
                    <v-chip v-else-if="s.alreadyQueued" color="info" size="x-small" variant="tonal">
                      {{ t('Publishing.chips.queued') }}
                    </v-chip>
                    <template v-else-if="spaceIsFull(s)">
                      <v-btn
                        v-if="s.fastPassAvailable"
                        color="warning"
                        size="small"
                        variant="tonal"
                        @click.stop="openFastPass(s)"
                      >
                        {{ t('Publishing.fastPass.button', { price: s.fastPassPriceUsd.toFixed(2) }) }}
                      </v-btn>
                      <v-chip v-else color="error" size="x-small" variant="tonal">
                        {{ t('Publishing.chips.full') }}
                      </v-chip>
                    </template>
                  </div>
                </div>
              </v-card-text>
            </v-card>

            <v-btn
              block
              class="mt-4"
              color="primary"
              :disabled="selected.length === 0 || enqueueing"
              :loading="enqueueing"
              size="large"
              variant="flat"
              @click="enqueue"
            >
              {{ t('Publishing.enqueueButton', { count: selected.length }) }}
            </v-btn>
          </template>

          <!-- ═══════════ STATUS VIEW ═══════════ -->
          <template v-else>
            <p class="text-body-2 text-medium-emphasis mb-4">
              {{ t('Publishing.statusHint') }}
            </p>

            <v-card v-for="item in items" :key="item.itemId" class="mb-3" variant="outlined">
              <v-card-text class="py-3">
                <div class="d-flex align-center mb-1">
                  <div class="text-subtitle-2 flex-grow-1">{{ item.spaceName || item.spaceId }}</div>
                  <v-chip
                    :color="item.status === 'LOCKED' ? 'warning' : 'info'"
                    size="x-small"
                    variant="tonal"
                  >
                    {{ item.status === 'LOCKED' ? t('Publishing.chips.locked') : t('Publishing.chips.queued') }}
                  </v-chip>
                  <v-chip v-if="item.fastPass" class="ml-1" color="warning" size="x-small" variant="tonal">
                    {{ t('Publishing.chips.fastPass') }}
                  </v-chip>
                </div>

                <div class="text-caption text-medium-emphasis">
                  {{ t('Publishing.itemBlock', { seq: item.blockSequence, time: timeOfDay(item.blockPublishAtEpochMs) }) }}
                </div>
                <div class="text-caption">
                  <span v-if="item.position != null">
                    {{ t('Publishing.itemPosition', { position: item.position, total: item.totalInBlock }) }}
                  </span>
                  <span v-if="item.aheadInSpace > 0" class="text-medium-emphasis">
                    · {{ t('Publishing.waitingAhead', { count: item.aheadInSpace }) }}
                  </span>
                </div>
                <div v-if="item.priorityFeeXlm > 0" class="text-caption text-medium-emphasis">
                  {{ t('Publishing.itemFee', { amount: item.priorityFeeXlm }) }}
                </div>
                <div class="text-caption text-primary font-weight-medium mt-1">
                  {{ t('Publishing.publishesIn', { countdown: countdown(item.blockPublishAtEpochMs) }) }}
                  <span v-if="item.blockStatus === 'OPEN' && item.blockLockAtEpochMs" class="text-medium-emphasis">
                    · {{ t('Publishing.locksIn', { countdown: countdown(item.blockLockAtEpochMs) }) }}
                  </span>
                </div>

                <div class="d-flex mt-2" style="gap: 8px">
                  <v-btn
                    v-if="item.canBoostFee"
                    color="primary"
                    prepend-icon="mdi-rocket-launch-outline"
                    size="small"
                    variant="tonal"
                    @click="openBoost(item)"
                  >
                    {{ t('Publishing.boost.button') }}
                  </v-btn>
                  <v-btn
                    v-if="item.canCancel"
                    color="error"
                    :loading="cancellingId === item.itemId"
                    size="small"
                    variant="text"
                    @click="cancelItem(item)"
                  >
                    {{ t('Publishing.cancelButton') }}
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </template>
        </template>
      </v-card-text>
    </v-card>

    <!-- ── Priority fee boost dialog ── -->
    <v-dialog :max-width="420" :model-value="!!boostItem" @update:model-value="v => { if (!v) boostItem = null }">
      <v-card>
        <v-card-title class="text-subtitle-1">{{ t('Publishing.boost.title') }}</v-card-title>
        <v-card-text>
          <p class="text-body-2 text-medium-emphasis mb-3">{{ t('Publishing.boost.hint') }}</p>
          <v-text-field
            v-model="boostAmount"
            autofocus
            density="compact"
            :label="t('Publishing.boost.amountLabel')"
            min="0.0000001"
            suffix="XLM"
            type="number"
            variant="outlined"
          />
          <div v-if="boostItem && boostItem.priorityFeeXlm > 0" class="text-caption text-medium-emphasis">
            {{ t('Publishing.boost.current', { amount: boostItem.priorityFeeXlm }) }}
          </div>
          <v-alert v-if="payError" class="mt-3" density="compact" type="error" variant="tonal">
            {{ payError }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn :disabled="paying" variant="text" @click="boostItem = null">
            {{ t('Publishing.close') }}
          </v-btn>
          <v-btn color="primary" :disabled="!boostValid || paying" :loading="paying" variant="flat" @click="payBoost">
            {{ t('Publishing.boost.pay') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── FastPass dialog ── -->
    <v-dialog :max-width="420" :model-value="!!fastPassSpace" @update:model-value="v => { if (!v) fastPassSpace = null }">
      <v-card>
        <v-card-title class="text-subtitle-1">{{ t('Publishing.fastPass.title') }}</v-card-title>
        <v-card-text>
          <p class="text-body-2 text-medium-emphasis mb-2">
            {{ t('Publishing.fastPass.hint', { space: fastPassSpace?.spaceName || '' }) }}
          </p>
          <p class="text-body-2 font-weight-medium">
            {{ t('Publishing.fastPass.price', { price: fastPassSpace?.fastPassPriceUsd.toFixed(2) }) }}
          </p>
          <v-alert v-if="payError" class="mt-3" density="compact" type="error" variant="tonal">
            {{ payError }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn :disabled="paying" variant="text" @click="fastPassSpace = null">
            {{ t('Publishing.close') }}
          </v-btn>
          <v-btn color="warning" :disabled="paying" :loading="paying" variant="flat" @click="payFastPass">
            {{ t('Publishing.fastPass.pay') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </component>
</template>
