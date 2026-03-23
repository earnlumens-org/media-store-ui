<!--
  Create Collection Page

  Multi-step flow:
  1. Metadata — title, description, type, pricing, wallet
  2. Items — search & add entries from creator's published content
  3. Cover — optional cover image upload
  4. Success — links to studio or view collection

  Route: /create-collection (requires auth)
-->
<template>
  <!-- ═══ Success Screen ═══ -->
  <v-container v-if="phase === 'success'" class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" lg="5" md="6" sm="8">
        <v-card class="pa-8 text-center" elevation="2">
          <div class="mb-5">
            <v-icon color="success" size="72">mdi-check-circle</v-icon>
          </div>

          <h2 class="text-h5 font-weight-bold mb-2">
            {{ t('CreateCollection.success.title') }}
          </h2>

          <p class="text-body-1 text-medium-emphasis mb-2">
            {{ createdAsDraft
              ? t('CreateCollection.success.draftMessage')
              : t('CreateCollection.success.publishedMessage')
            }}
          </p>

          <v-chip
            class="mb-6"
            :color="createdAsDraft ? 'warning' : 'success'"
            size="small"
            variant="tonal"
          >
            {{ createdAsDraft ? t('CreateCollection.status.draft') : t('CreateCollection.status.published') }}
          </v-chip>

          <div class="d-flex flex-column ga-3">
            <v-btn
              v-if="!createdAsDraft && createdCollectionId"
              block
              color="primary"
              size="large"
              variant="elevated"
              @click="router.push(`/collection/${createdCollectionId}`)"
            >
              <v-icon class="me-2">mdi-eye</v-icon>
              {{ t('CreateCollection.success.viewCollection') }}
            </v-btn>

            <v-btn
              block
              :color="createdAsDraft ? 'primary' : undefined"
              size="large"
              :variant="createdAsDraft ? 'elevated' : 'outlined'"
              @click="router.push('/creator-studio')"
            >
              <v-icon class="me-2">mdi-view-dashboard-outline</v-icon>
              {{ t('CreateCollection.success.goToStudio') }}
            </v-btn>

            <v-btn
              block
              size="large"
              variant="outlined"
              @click="resetForm"
            >
              <v-icon class="me-2">mdi-plus</v-icon>
              {{ t('CreateCollection.success.createAnother') }}
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>

  <!-- ═══ Form ═══ -->
  <v-container v-else class="pa-2 pa-sm-4 pa-md-6 mx-auto" fluid style="max-width: 900px;">
    <!-- Header -->
    <div class="d-flex align-center mb-6">
      <v-btn
        class="me-2"
        icon="mdi-arrow-left"
        variant="text"
        @click="router.back()"
      />
      <div>
        <h1 class="text-h5 font-weight-bold">
          {{ t('CreateCollection.pageTitle') }}
        </h1>
        <p class="text-body-2 text-medium-emphasis mt-1">
          {{ t('CreateCollection.pageSubtitle') }}
        </p>
      </div>
    </div>

    <!-- Stepper -->
    <v-stepper v-model="step" flat>
      <v-stepper-header>
        <v-stepper-item
          :complete="step > 1"
          :title="t('CreateCollection.steps.details')"
          :value="1"
        />
        <v-divider />
        <v-stepper-item
          :complete="step > 2"
          :title="t('CreateCollection.steps.items')"
          :value="2"
        />
        <v-divider />
        <v-stepper-item
          :complete="step > 3"
          :title="t('CreateCollection.steps.cover')"
          :value="3"
        />
      </v-stepper-header>

      <v-stepper-window>
        <!-- ═══ STEP 1: Details ═══ -->
        <v-stepper-window-item :value="1">
          <v-form ref="detailsFormRef" @submit.prevent>
            <v-card class="pa-4 mb-4" variant="outlined">
              <h3 class="text-subtitle-1 font-weight-bold mb-4">
                {{ t('CreateCollection.details.heading') }}
              </h3>

              <!-- Title -->
              <v-text-field
                v-model="form.title"
                class="mb-2"
                counter="200"
                :label="t('CreateCollection.details.title')"
                :placeholder="t('CreateCollection.details.titlePlaceholder')"
                :rules="titleRules"
                variant="outlined"
              />

              <!-- Description -->
              <v-textarea
                v-model="form.description"
                counter="2000"
                :label="t('CreateCollection.details.description')"
                :placeholder="t('CreateCollection.details.descriptionPlaceholder')"
                rows="3"
                :rules="descriptionRules"
                variant="outlined"
              />

              <!-- Collection Type -->
              <v-select
                v-model="form.collectionType"
                :items="collectionTypeItems"
                :label="t('CreateCollection.details.type')"
                prepend-inner-icon="mdi-folder-multiple"
                :rules="typeRules"
                variant="outlined"
              />

              <!-- Paid toggle + price -->
              <v-divider class="my-4" />

              <v-switch
                v-model="form.isPaid"
                color="primary"
                :hint="t('CreateCollection.details.isPaidHint')"
                :label="t('CreateCollection.details.isPaid')"
                persistent-hint
              />

              <v-text-field
                v-if="form.isPaid"
                v-model="form.price"
                class="mt-3"
                :label="form.priceCurrency === 'USD' ? t('CreateCollection.details.priceUsd') : t('CreateCollection.details.priceXlm')"
                :placeholder="t('CreateCollection.details.pricePlaceholder')"
                :prefix="form.priceCurrency"
                :rules="priceRules"
                step="0.01"
                type="number"
                variant="outlined"
              >
                <template #append-inner>
                  <v-btn-toggle
                    v-model="form.priceCurrency"
                    color="primary"
                    density="compact"
                    mandatory
                    variant="outlined"
                  >
                    <v-btn size="small" value="XLM">XLM</v-btn>
                    <v-btn size="small" value="USD">USD</v-btn>
                  </v-btn-toggle>
                </template>
              </v-text-field>

              <!-- Wallet requirement for paid content -->
              <template v-if="form.isPaid">
                <!-- No wallet connected -->
                <v-alert
                  v-if="!walletStore.isConnected"
                  class="mt-3"
                  color="warning"
                  icon="mdi-wallet-outline"
                  variant="tonal"
                >
                  <div class="text-body-2 font-weight-medium">
                    {{ t('Upload.wallet.required') }}
                  </div>
                  <div class="text-caption mt-1">
                    {{ t('Upload.wallet.requiredHint') }}
                  </div>
                  <v-btn
                    class="mt-2"
                    color="warning"
                    size="small"
                    variant="elevated"
                    @click="connectWallet"
                  >
                    <v-icon class="me-1" size="small">mdi-wallet-plus</v-icon>
                    {{ t('Upload.wallet.connect') }}
                  </v-btn>
                </v-alert>

                <!-- Wallet connected but unfunded -->
                <v-alert
                  v-else-if="isWalletUnfunded"
                  class="mt-3"
                  color="warning"
                  icon="mdi-wallet-outline"
                  variant="tonal"
                >
                  <div class="text-body-2 font-weight-medium">
                    {{ t('Upload.wallet.unfunded') }}
                  </div>
                  <div class="text-caption mt-1">
                    {{ t('Upload.wallet.unfundedHint') }}
                  </div>
                  <v-btn
                    class="mt-2"
                    color="warning"
                    size="small"
                    variant="elevated"
                    @click="router.push('/wallet')"
                  >
                    <v-icon class="me-1" size="small">mdi-wallet</v-icon>
                    {{ t('Upload.wallet.goToWallet') }}
                  </v-btn>
                </v-alert>

                <!-- Wallet connected and funded -->
                <v-alert
                  v-else
                  class="mt-3"
                  color="success"
                  icon="mdi-wallet-outline"
                  variant="tonal"
                >
                  <div class="text-body-2 font-weight-medium">
                    {{ t('Upload.wallet.connected') }}
                  </div>
                  <v-select
                    v-model="selectedSellerWallet"
                    class="mt-2"
                    density="compact"
                    hide-details
                    :items="walletItems"
                    :label="t('Upload.wallet.sellerWallet')"
                    variant="outlined"
                  >
                    <template #prepend-inner>
                      <v-icon color="success" size="small">mdi-check-circle</v-icon>
                    </template>
                  </v-select>
                  <div class="text-caption text-medium-emphasis mt-1">
                    {{ t('Upload.wallet.sellerWalletHint') }}
                  </div>
                  <v-btn
                    class="mt-2"
                    size="small"
                    variant="text"
                    @click="connectWallet"
                  >
                    <v-icon class="me-1" size="small">mdi-wallet-plus</v-icon>
                    {{ t('Upload.wallet.addAnother') }}
                  </v-btn>
                </v-alert>
              </template>
            </v-card>

            <!-- Step 1 Actions -->
            <div class="d-flex justify-end ga-3">
              <v-btn
                variant="text"
                @click="router.back()"
              >
                {{ t('Common.cancel') }}
              </v-btn>
              <v-btn
                color="primary"
                :disabled="!canProceedStep1"
                variant="elevated"
                @click="goToStep2"
              >
                {{ t('Common.continue') }}
                <v-icon end>mdi-arrow-right</v-icon>
              </v-btn>
            </div>
          </v-form>
        </v-stepper-window-item>

        <!-- ═══ STEP 2: Add Items ═══ -->
        <v-stepper-window-item :value="2">
          <v-card class="pa-4 mb-4" variant="outlined">
            <div class="d-flex align-center justify-space-between mb-4">
              <h3 class="text-subtitle-1 font-weight-bold">
                {{ t('CreateCollection.items.heading') }}
              </h3>
              <v-chip size="small" variant="tonal">
                {{ t('CreateCollection.items.count', { count: selectedEntries.length }) }}
              </v-chip>
            </div>

            <!-- Search entries -->
            <v-text-field
              v-model="entrySearch"
              clearable
              density="compact"
              hide-details
              :loading="entriesLoading"
              :placeholder="t('CreateCollection.items.searchPlaceholder')"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              @update:model-value="debouncedFetchEntries"
            />

            <!-- Available entries -->
            <v-list v-if="availableEntries.length > 0" class="mt-3" density="compact" lines="two">
              <v-list-item
                v-for="entry in availableEntries"
                :key="entry.id"
                :class="{ 'bg-primary-lighten-5': isEntrySelected(entry.id) }"
                @click="toggleEntry(entry)"
              >
                <template #prepend>
                  <v-avatar
                    class="rounded"
                    :image="entry.thumbnailUrl"
                    size="48"
                  >
                    <v-icon v-if="!entry.thumbnailUrl">{{ getEntryTypeIcon(entry.type) }}</v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title>{{ entry.title }}</v-list-item-title>
                <v-list-item-subtitle>
                  <v-icon class="me-1" size="12">{{ getEntryTypeIcon(entry.type) }}</v-icon>
                  {{ entry.type }}
                </v-list-item-subtitle>

                <template #append>
                  <v-icon :color="isEntrySelected(entry.id) ? 'primary' : 'grey-lighten-1'" size="24">
                    {{ isEntrySelected(entry.id) ? 'mdi-check-circle' : 'mdi-plus-circle-outline' }}
                  </v-icon>
                </template>
              </v-list-item>
            </v-list>

            <!-- Empty state -->
            <div
              v-else-if="!entriesLoading && entriesFetched"
              class="text-center pa-6 text-medium-emphasis"
            >
              <v-icon class="mb-2" size="48">mdi-file-document-outline</v-icon>
              <p>{{ t('CreateCollection.items.noEntries') }}</p>
            </div>

            <!-- Loading -->
            <div v-if="entriesLoading" class="text-center pa-4">
              <v-progress-circular color="primary" indeterminate size="32" />
            </div>

            <!-- Selected items (draggable order) -->
            <template v-if="selectedEntries.length > 0">
              <v-divider class="my-4" />
              <h4 class="text-subtitle-2 mb-2">
                {{ t('CreateCollection.items.selectedHeading') }}
              </h4>
              <v-list density="compact">
                <v-list-item
                  v-for="(entry, index) in selectedEntries"
                  :key="entry.id"
                  class="rounded-lg mb-1"
                >
                  <template #prepend>
                    <span class="text-body-2 text-medium-emphasis me-3" style="min-width: 20px;">
                      {{ index + 1 }}
                    </span>
                    <v-avatar
                      class="rounded me-3"
                      :image="entry.thumbnailUrl"
                      size="40"
                    >
                      <v-icon v-if="!entry.thumbnailUrl" size="20">{{ getEntryTypeIcon(entry.type) }}</v-icon>
                    </v-avatar>
                  </template>

                  <v-list-item-title class="text-body-2">{{ entry.title }}</v-list-item-title>

                  <template #append>
                    <v-btn
                      :disabled="index === 0"
                      icon="mdi-arrow-up"
                      size="x-small"
                      variant="text"
                      @click="moveEntry(index, -1)"
                    />
                    <v-btn
                      :disabled="index === selectedEntries.length - 1"
                      icon="mdi-arrow-down"
                      size="x-small"
                      variant="text"
                      @click="moveEntry(index, 1)"
                    />
                    <v-btn
                      color="error"
                      icon="mdi-close"
                      size="x-small"
                      variant="text"
                      @click="removeEntry(index)"
                    />
                  </template>
                </v-list-item>
              </v-list>
            </template>
          </v-card>

          <!-- Step 2 Actions -->
          <div class="d-flex justify-space-between ga-3">
            <v-btn
              prepend-icon="mdi-arrow-left"
              variant="text"
              @click="step = 1"
            >
              {{ t('Common.goBack') }}
            </v-btn>
            <v-btn
              color="primary"
              variant="elevated"
              @click="step = 3"
            >
              {{ t('Common.continue') }}
              <v-icon end>mdi-arrow-right</v-icon>
            </v-btn>
          </div>
        </v-stepper-window-item>

        <!-- ═══ STEP 3: Cover Image ═══ -->
        <v-stepper-window-item :value="3">
          <v-card class="pa-4 mb-4" variant="outlined">
            <h3 class="text-subtitle-1 font-weight-bold mb-2">
              {{ t('CreateCollection.cover.heading') }}
            </h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
              {{ t('CreateCollection.cover.hint') }}
            </p>

            <!-- Cover preview -->
            <div
              v-if="coverPreviewUrl"
              class="position-relative rounded-lg overflow-hidden mb-4"
              style="max-width: 400px;"
            >
              <v-img
                aspect-ratio="16/9"
                cover
                :src="coverPreviewUrl"
              />
              <v-btn
                class="position-absolute"
                color="error"
                icon="mdi-close"
                size="small"
                style="top: 8px; right: 8px;"
                variant="elevated"
                @click="removeCover"
              />
            </div>

            <!-- File input -->
            <v-file-input
              v-if="!coverPreviewUrl"
              v-model="coverFile"
              accept="image/jpeg,image/png,image/webp"
              :label="t('CreateCollection.cover.fileLabel')"
              prepend-icon="mdi-image"
              variant="outlined"
              @update:model-value="onCoverSelected"
            />
          </v-card>

          <!-- Summary -->
          <v-card class="pa-4 mb-4" variant="outlined">
            <h3 class="text-subtitle-1 font-weight-bold mb-3">
              {{ t('CreateCollection.summary.heading') }}
            </h3>
            <v-list density="compact" lines="one">
              <v-list-item :subtitle="t('CreateCollection.details.title')" :title="form.title" />
              <v-list-item :subtitle="t('CreateCollection.details.type')" :title="form.collectionType" />
              <v-list-item
                :subtitle="t('CreateCollection.details.isPaid')"
                :title="form.isPaid ? `${form.priceCurrency} ${form.price}` : t('CreateCollection.summary.free')"
              />
              <v-list-item
                :subtitle="t('CreateCollection.items.heading')"
                :title="t('CreateCollection.items.count', { count: selectedEntries.length })"
              />
            </v-list>
          </v-card>

          <!-- Step 3 Actions -->
          <div class="d-flex flex-wrap justify-space-between ga-3">
            <v-btn
              prepend-icon="mdi-arrow-left"
              variant="text"
              @click="step = 2"
            >
              {{ t('Common.goBack') }}
            </v-btn>
            <div class="d-flex ga-3">
              <v-btn
                :disabled="isSaving"
                :loading="isSaving && createdAsDraft"
                variant="outlined"
                @click="handleCreate(false)"
              >
                <v-icon class="me-1">mdi-content-save-outline</v-icon>
                {{ t('CreateCollection.actions.saveDraft') }}
              </v-btn>
              <v-btn
                color="primary"
                :disabled="isSaving || selectedEntries.length === 0"
                :loading="isSaving && !createdAsDraft"
                variant="elevated"
                @click="handleCreate(true)"
              >
                <v-icon class="me-1">mdi-send</v-icon>
                {{ t('CreateCollection.actions.publish') }}
              </v-btn>
            </div>
          </div>
        </v-stepper-window-item>
      </v-stepper-window>
    </v-stepper>
  </v-container>

  <!-- ═══ Progress Overlay ═══ -->
  <v-overlay
    v-model="showProgressOverlay"
    class="align-center justify-center"
    persistent
  >
    <v-card class="pa-6 text-center" min-width="340">
      <v-progress-circular
        class="mb-4"
        color="primary"
        indeterminate
        size="56"
        width="4"
      />
      <div class="text-h6 mb-1">{{ progressMessage }}</div>
    </v-card>
  </v-overlay>

  <!-- ═══ Snackbar ═══ -->
  <v-snackbar
    v-model="snackbar.show"
    :color="snackbar.color"
    :timeout="4000"
  >
    {{ snackbar.text }}
    <template #actions>
      <v-btn
        variant="text"
        @click="snackbar.show = false"
      >
        {{ t('Common.close') }}
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
  import type { CreatorEntryModel } from '@/api/types/creator.types'

  import { computed, onMounted, reactive, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'

  import { api } from '@/api/api'
  import { accountExists } from '@/services/stellar'
  import { useWalletStore } from '@/stores/wallet'

  const router = useRouter()
  const { t } = useI18n()
  const walletStore = useWalletStore()

  // ── Phase & step ────────────────────────────────────────────

  const phase = ref<'form' | 'success'>('form')
  const step = ref(1)
  const createdCollectionId = ref<string | null>(null)
  const createdAsDraft = ref(false)

  // ── Form state ──────────────────────────────────────────────

  const form = reactive({
    title: '',
    description: '',
    collectionType: '' as string,
    isPaid: false,
    price: null as number | null,
    priceCurrency: 'XLM' as 'XLM' | 'USD',
  })

  const detailsFormRef = ref()

  // ── Collection types ────────────────────────────────────────

  const collectionTypeItems = [
    { value: 'SERIES', title: 'Series' },
    { value: 'COURSE', title: 'Course' },
    { value: 'ALBUM', title: 'Album' },
    { value: 'BUNDLE', title: 'Bundle' },
    { value: 'LIST', title: 'List' },
    { value: 'LIBRARY', title: 'Library' },
    { value: 'CATALOG', title: 'Catalog' },
    { value: 'VOLUME', title: 'Volume' },
    { value: 'ARCHIVE', title: 'Archive' },
  ]

  // ── Validation rules ───────────────────────────────────────

  const titleRules = [
    (v: string) => !!v?.trim() || t('CreateCollection.validation.titleRequired'),
    (v: string) => (v?.length ?? 0) <= 200 || t('CreateCollection.validation.titleMaxLength'),
  ]

  const descriptionRules = [
    (v: string) => !v || v.length <= 2000 || t('CreateCollection.validation.descriptionMaxLength'),
  ]

  const typeRules = [
    (v: string) => !!v || t('CreateCollection.validation.typeRequired'),
  ]

  const priceRules = [
    (v: number | null) => v !== null || t('CreateCollection.validation.priceRequired'),
    (v: number | null) => (v !== null && v > 0) || t('CreateCollection.validation.pricePositive'),
  ]

  // ── Wallet ──────────────────────────────────────────────────

  const isWalletUnfunded = ref(false)
  const selectedSellerWallet = ref(walletStore.activeAddress || '')

  const walletItems = computed(() =>
    walletStore.wallets.map(w => ({
      value: w.address,
      title: `${w.providerName} — ${w.address.slice(0, 7)}...${w.address.slice(-7)}`,
    })),
  )

  watch(
    () => walletStore.activeAddress,
    addr => {
      if (addr && !selectedSellerWallet.value) {
        selectedSellerWallet.value = addr
      }
    },
  )

  watch(
    () => [selectedSellerWallet.value, form.isPaid] as const,
    async ([address, isPaid]) => {
      if (!address || !isPaid) {
        isWalletUnfunded.value = false
        return
      }
      try {
        isWalletUnfunded.value = !(await accountExists(address))
      } catch {
        isWalletUnfunded.value = false
      }
    },
    { immediate: true },
  )

  const canProceedStep1 = computed(() => {
    if (!form.title.trim()) {
      return false
    }
    if (!form.collectionType) {
      return false
    }
    if (form.isPaid) {
      if (!walletStore.isConnected || !selectedSellerWallet.value || isWalletUnfunded.value) {
        return false
      }
      if (!form.price || form.price <= 0) {
        return false
      }
    }
    return true
  })

  async function connectWallet () {
    try {
      const result = await walletStore.connect()
      if (result) {
        selectedSellerWallet.value = result.address
        showSnackbar(t('Upload.wallet.connectSuccess'))
      }
    } catch (error) {
      console.error('Wallet connection failed:', error)
      showSnackbar(t('Upload.wallet.connectError'), 'error')
    }
  }

  async function goToStep2 () {
    const { valid } = await detailsFormRef.value?.validate()
    if (!valid) {
      return
    }
    step.value = 2
    if (!entriesFetched.value) {
      fetchEntries()
    }
  }

  // ── Entries (Step 2) ────────────────────────────────────────

  const entrySearch = ref('')
  const myEntries = ref<CreatorEntryModel[]>([])
  const entriesLoading = ref(false)
  const entriesFetched = ref(false)
  const selectedEntries = ref<CreatorEntryModel[]>([])

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  function debouncedFetchEntries () {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    debounceTimer = setTimeout(() => {
      fetchEntries()
    }, 300)
  }

  async function fetchEntries () {
    entriesLoading.value = true
    try {
      const result = await api.creator.getEntries({
        status: 'PUBLISHED',
        search: entrySearch.value || undefined,
        size: 50,
      })
      myEntries.value = result.items
      entriesFetched.value = true
    } catch (error) {
      console.error('Failed to load entries:', error)
      showSnackbar(t('CreateCollection.items.loadError'), 'error')
    } finally {
      entriesLoading.value = false
    }
  }

  const availableEntries = computed(() => myEntries.value)

  function isEntrySelected (id: string): boolean {
    return selectedEntries.value.some(e => e.id === id)
  }

  function toggleEntry (entry: CreatorEntryModel) {
    const index = selectedEntries.value.findIndex(e => e.id === entry.id)
    if (index === -1) {
      selectedEntries.value.push(entry)
    } else {
      selectedEntries.value.splice(index, 1)
    }
  }

  function removeEntry (index: number) {
    selectedEntries.value.splice(index, 1)
  }

  function moveEntry (index: number, direction: -1 | 1) {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= selectedEntries.value.length) {
      return
    }
    const items = [...selectedEntries.value]
    const moved = items.splice(index, 1)[0]
    if (moved) {
      items.splice(newIndex, 0, moved)
    }
    selectedEntries.value = items
  }

  function getEntryTypeIcon (type: string): string {
    const icons: Record<string, string> = {
      VIDEO: 'mdi-play-circle',
      AUDIO: 'mdi-music',
      IMAGE: 'mdi-image',
      RESOURCE: 'mdi-file-document',
      video: 'mdi-play-circle',
      audio: 'mdi-music',
      image: 'mdi-image',
      resource: 'mdi-file-document',
    }
    return icons[type] || 'mdi-file'
  }

  // ── Cover (Step 3) ──────────────────────────────────────────

  const coverFile = ref<File | null>(null)
  const coverPreviewUrl = ref<string | null>(null)

  function onCoverSelected (file: File | File[] | null) {
    const f = Array.isArray(file) ? file[0] : file
    if (f) {
      coverFile.value = f
      coverPreviewUrl.value = URL.createObjectURL(f)
    }
  }

  function removeCover () {
    if (coverPreviewUrl.value) {
      URL.revokeObjectURL(coverPreviewUrl.value)
    }
    coverFile.value = null
    coverPreviewUrl.value = null
  }

  // ── Save / Publish ──────────────────────────────────────────

  const isSaving = ref(false)
  const showProgressOverlay = ref(false)
  const progressMessage = ref('')

  const snackbar = reactive({
    show: false,
    text: '',
    color: 'success' as string,
  })

  function showSnackbar (text: string, color = 'success') {
    snackbar.text = text
    snackbar.color = color
    snackbar.show = true
  }

  async function handleCreate (publish: boolean) {
    createdAsDraft.value = !publish
    isSaving.value = true
    showProgressOverlay.value = true

    try {
      // 1. Create collection
      progressMessage.value = t('CreateCollection.progress.creating')
      const created = await api.collections.create({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        collectionType: form.collectionType,
        isPaid: form.isPaid,
        priceXlm: form.isPaid && form.priceCurrency === 'XLM' && form.price ? form.price : undefined,
        priceUsd: form.isPaid && form.priceCurrency === 'USD' && form.price ? form.price : undefined,
        priceCurrency: form.isPaid ? form.priceCurrency : undefined,
        sellerWallet: form.isPaid ? selectedSellerWallet.value : undefined,
      })

      createdCollectionId.value = created.id

      // 2. Add items
      if (selectedEntries.value.length > 0) {
        progressMessage.value = t('CreateCollection.progress.addingItems')
        for (const entry of selectedEntries.value) {
          await api.collections.addItem(created.id, entry.id)
        }
      }

      // 3. Upload cover
      if (coverFile.value) {
        progressMessage.value = t('CreateCollection.progress.uploadingCover')
        const initResp = await api.collections.initCoverUpload(
          created.id,
          coverFile.value.name,
          coverFile.value.type || 'image/jpeg',
        )

        // Upload directly to R2 presigned URL
        await fetch(initResp.presignedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': coverFile.value.type || 'image/jpeg' },
          body: coverFile.value,
        })

        await api.collections.finalizeCoverUpload(created.id, initResp.r2Key)
      }

      // 4. Publish if requested
      if (publish) {
        progressMessage.value = t('CreateCollection.progress.publishing')
        await api.collections.publish(created.id)
      }

      // Done
      phase.value = 'success'
    } catch (error) {
      console.error('Failed to create collection:', error)
      showSnackbar(t('CreateCollection.errors.createFailed'), 'error')
    } finally {
      isSaving.value = false
      showProgressOverlay.value = false
    }
  }

  function resetForm () {
    phase.value = 'form'
    step.value = 1
    form.title = ''
    form.description = ''
    form.collectionType = ''
    form.isPaid = false
    form.price = null
    form.priceCurrency = 'XLM'
    selectedEntries.value = []
    removeCover()
    createdCollectionId.value = null
    createdAsDraft.value = false
    entriesFetched.value = false
  }

  // ── Init ────────────────────────────────────────────────────

  onMounted(() => {
    // Pre-populate wallet if available
    if (walletStore.activeAddress) {
      selectedSellerWallet.value = walletStore.activeAddress
    }
  })
</script>

<route lang="json">
{
  "path": "/create-collection",
  "meta": { "requiresAuth": true }
}
</route>
