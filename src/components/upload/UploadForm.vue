<template>
  <!-- ═══ Success Screen ═══ -->
  <v-container v-if="uploadPhase === 'success'" class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="5">
        <v-card class="pa-8 text-center" elevation="2">
          <div class="success-icon-wrapper mb-5">
            <v-icon color="success" size="72">mdi-check-circle</v-icon>
          </div>

          <h2 class="text-h5 font-weight-bold mb-2">
            {{ t('Upload.success.title') }}
          </h2>

          <p class="text-body-1 text-medium-emphasis mb-2">
            {{ savedAsDraft
              ? t('Upload.success.draftMessage', { type: t(`Upload.type.${contentType}`) })
              : t('Upload.success.reviewMessage', { type: t(`Upload.type.${contentType}`) })
            }}
          </p>

          <v-chip
            class="mb-6"
            :color="savedAsDraft ? 'warning' : 'info'"
            size="small"
            variant="tonal"
          >
            {{ savedAsDraft ? t('Upload.status.draft') : t('Upload.status.inReview') }}
          </v-chip>

          <div class="d-flex flex-column ga-3">
            <v-btn
              block
              color="primary"
              size="large"
              variant="elevated"
              @click="router.push('/creator-studio')"
            >
              <v-icon class="me-2">mdi-view-dashboard-outline</v-icon>
              {{ t('Upload.actions.goToStudio') }}
            </v-btn>

            <v-btn
              block
              size="large"
              variant="outlined"
              @click="uploadAnother"
            >
              <v-icon class="me-2">mdi-plus</v-icon>
              {{ t('Upload.actions.uploadAnother') }}
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>

  <!-- ═══ Upload Form ═══ -->
  <v-container v-else class="upload-form" fluid>
    <v-row justify="center">
      <v-col cols="12" lg="8" md="10">
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
              {{ t('Upload.pageTitle', { type: t(`Upload.type.${contentType}`) }) }}
            </h1>
            <v-chip
              class="mt-1"
              color="warning"
              size="small"
              variant="tonal"
            >
              {{ t('Upload.status.draft') }}
            </v-chip>
          </div>
        </div>

        <v-form ref="formRef" @submit.prevent>
          <v-row>
            <!-- Left column: metadata -->
            <v-col cols="12" md="7">
              <v-card class="pa-4 mb-4">
                <!-- Title -->
                <v-text-field
                  v-model="form.title"
                  class="mb-2"
                  counter="200"
                  :label="t('Upload.form.title')"
                  :placeholder="t('Upload.form.titlePlaceholder')"
                  :rules="titleRules"
                  variant="outlined"
                />

                <!-- Description -->
                <v-textarea
                  v-model="form.description"
                  counter="2000"
                  :label="t('Upload.form.description')"
                  :placeholder="t('Upload.form.descriptionPlaceholder')"
                  rows="3"
                  :rules="descriptionRules"
                  variant="outlined"
                />

                <!-- Resource content (optional text for resource type) -->
                <v-textarea
                  v-if="contentType === 'resource'"
                  v-model="form.resourceContent"
                  class="mt-2"
                  :label="t('Upload.form.resourceContent')"
                  :placeholder="t('Upload.form.resourceContentPlaceholder')"
                  rows="8"
                  variant="outlined"
                />

                <!-- Paid toggle + price -->
                <v-divider class="my-4" />

                <!-- Content Language -->
                <v-select
                  v-model="form.contentLanguage"
                  :items="contentLanguageItems"
                  :label="t('Upload.form.contentLanguage')"
                  prepend-inner-icon="mdi-translate"
                  variant="outlined"
                />

                <v-switch
                  v-model="form.isPaid"
                  color="primary"
                  :hint="t('Upload.form.isPaidHint')"
                  :label="t('Upload.form.isPaid')"
                  persistent-hint
                />

                <v-text-field
                  v-if="form.isPaid"
                  v-model="form.price"
                  class="mt-3"
                  :label="form.priceCurrency === 'USD' ? t('Upload.form.priceUsd') : t('Upload.form.priceXlm')"
                  :placeholder="t('Upload.form.pricePlaceholder')"
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
                  <!-- No wallet connected: warning alert -->
                  <v-alert
                    v-if="!walletStore.isConnected"
                    class="mt-3"
                    closable
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

                  <!-- Wallet connected and funded: show public key (read-only) -->
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
                    <v-text-field
                      class="mt-2"
                      density="compact"
                      hide-details
                      :label="t('Upload.wallet.sellerWallet')"
                      :model-value="walletStore.activeAddress"
                      readonly
                      variant="outlined"
                    >
                      <template #prepend-inner>
                        <v-icon color="success" size="small">mdi-check-circle</v-icon>
                      </template>
                    </v-text-field>
                    <div class="text-caption text-medium-emphasis mt-1">
                      {{ t('Upload.wallet.sellerWalletHint') }}
                    </div>
                  </v-alert>
                </template>
              </v-card>
            </v-col>

            <!-- Right column: assets -->
            <v-col cols="12" md="5">
              <!-- Full content (always shown, optional for resource) -->
              <v-card class="pa-4 mb-4">
                <div class="text-subtitle-2 mb-1">
                  {{ t('Upload.assets.fullContent') }}
                  <span class="text-error">*</span>
                </div>
                <div class="text-caption text-medium-emphasis mb-3">
                  {{ t('Upload.assets.fullContentHint') }}
                </div>
                <UploadAssetPicker
                  v-model:file="assets.full"
                  v-model:progress="progress.full"
                  :accept="acceptedMimes"
                  :max-size="maxFileSize"
                />
              </v-card>

              <!-- Thumbnail -->
              <v-card class="pa-4 mb-4">
                <div class="text-subtitle-2 mb-1">
                  {{ t('Upload.assets.thumbnail') }}
                </div>
                <div class="text-caption text-medium-emphasis mb-3">
                  {{ t('Upload.assets.thumbnailHint') }}
                </div>
                <UploadAssetPicker
                  v-model:file="assets.thumbnail"
                  v-model:progress="progress.thumbnail"
                  :accept="THUMBNAIL_MIMES"
                  :max-size="MAX_THUMBNAIL_SIZE"
                />
              </v-card>

              <!-- Preview -->
              <v-card class="pa-4 mb-4">
                <div class="text-subtitle-2 mb-1">
                  {{ t('Upload.assets.preview') }}
                </div>
                <div class="text-caption text-medium-emphasis mb-3">
                  {{ t('Upload.assets.previewHint') }}
                </div>
                <UploadAssetPicker
                  v-model:file="assets.preview"
                  v-model:progress="progress.preview"
                  :accept="acceptedMimes || THUMBNAIL_MIMES"
                  :max-size="maxFileSize || MAX_THUMBNAIL_SIZE"
                />
              </v-card>
            </v-col>
          </v-row>

          <!-- Action buttons -->
          <v-row class="mt-2">
            <v-col cols="12">
              <v-card class="pa-4">
                <div class="d-flex flex-wrap ga-3 justify-end">
                  <v-btn
                    variant="text"
                    @click="router.back()"
                  >
                    {{ t('Upload.actions.cancel') }}
                  </v-btn>

                  <v-btn
                    :disabled="!canUpload || isUploading"
                    :loading="isUploading && savedAsDraft"
                    variant="outlined"
                    @click="handleUpload(false)"
                  >
                    <v-icon class="me-1">mdi-content-save-outline</v-icon>
                    {{ t('Upload.actions.saveDraft') }}
                  </v-btn>

                  <v-btn
                    color="primary"
                    :disabled="!canUpload || isUploading"
                    :loading="isUploading && !savedAsDraft"
                    variant="elevated"
                    @click="handleUpload(true)"
                  >
                    <v-icon class="me-1">mdi-send</v-icon>
                    {{ t('Upload.actions.submitForReview') }}
                  </v-btn>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-form>
      </v-col>
    </v-row>
  </v-container>

  <!-- ═══ Progress Overlay (shared) ═══ -->
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

  <!-- ═══ Snackbar (shared) ═══ -->
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
  import type { AssetKind, UploadContentType } from '@/api/types/upload.types'
  import { computed, reactive, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'
  import { api } from '@/api/api'
  import {
    ACCEPTED_MIMES,
    MAX_FILE_SIZES,
    MAX_THUMBNAIL_SIZE,
    THUMBNAIL_MIMES,
    toEntryType,
  } from '@/api/types/upload.types'
  import UploadAssetPicker from '@/components/upload/UploadAssetPicker.vue'
  import { CONTENT_LANGUAGES } from '@/config/contentLanguages'
  import { accountExists } from '@/services/stellar'
  import { useWalletStore } from '@/stores/wallet'

  const props = defineProps<{
    contentType: UploadContentType
  }>()

  const router = useRouter()
  const { t, locale } = useI18n()
  const formRef = ref()
  const walletStore = useWalletStore()

  const contentLanguageItems = CONTENT_LANGUAGES.map(l => ({ value: l.value, title: l.title }))

  // ── Form state ──────────────────────────────────────────────

  const form = reactive({
    title: '',
    description: '',
    resourceContent: '',
    isPaid: false,
    price: null as number | null,
    priceCurrency: 'XLM' as 'XLM' | 'USD',
    contentLanguage: locale.value,
  })

  const assets = reactive({
    full: null as File | null,
    thumbnail: null as File | null,
    preview: null as File | null,
  })

  const progress = reactive({
    full: null as number | null,
    thumbnail: null as number | null,
    preview: null as number | null,
  })

  // ── Computed ────────────────────────────────────────────────

  const acceptedMimes = computed(() => ACCEPTED_MIMES[props.contentType])
  const maxFileSize = computed(() => MAX_FILE_SIZES[props.contentType])

  const isWalletUnfunded = ref(false)
  const isCheckingWallet = ref(false)

  // Check if wallet is funded whenever wallet connects or paid toggle changes
  watch(
    () => [walletStore.activeAddress, form.isPaid] as const,
    async ([address, isPaid]) => {
      if (!address || !isPaid) {
        isWalletUnfunded.value = false
        return
      }
      isCheckingWallet.value = true
      try {
        isWalletUnfunded.value = !(await accountExists(address))
      } catch {
        isWalletUnfunded.value = false
      } finally {
        isCheckingWallet.value = false
      }
    },
    { immediate: true },
  )

  const canUpload = computed(() => {
    if (!form.title.trim()) return false
    // Paid content requires a connected AND funded wallet
    if (form.isPaid && !walletStore.isConnected) return false
    if (form.isPaid && isWalletUnfunded.value) return false
    if (props.contentType === 'resource') {
      // Resource requires text content OR a file (at least one)
      return !!form.resourceContent.trim() || !!assets.full
    }
    return !!assets.full
  })

  // ── Upload phase & post-upload state ─────────────────────

  const uploadPhase = ref<'form' | 'success'>('form')
  const savedAsDraft = ref(false)

  // ── Validation rules ───────────────────────────────────────

  const titleRules = [
    (v: string) => !!v.trim() || t('Upload.form.titleRequired'),
    (v: string) => v.length <= 200 || t('Upload.form.titleMaxLength'),
  ]

  const descriptionRules = [
    (v: string) => !v || v.length <= 2000 || t('Upload.form.descriptionMaxLength'),
  ]

  const priceRules = [
    (v: number | null) => v !== null || t('Upload.form.priceRequired'),
    (v: number | null) => (v !== null && v > 0) || t('Upload.form.pricePositive'),
  ]

  // ── Upload state ────────────────────────────────────────────

  const isUploading = ref(false)
  const showProgressOverlay = ref(false)
  const progressMessage = ref('')
  const createdEntryId = ref<string | null>(null)

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

  // ── Wallet ──────────────────────────────────────────────────

  /**
   * Extracts media metadata from a File using the browser's HTMLVideoElement/HTMLAudioElement/HTMLImageElement.
   * Returns null values for anything that can't be determined (best-effort).
   * This runs entirely client-side — no upload or server call needed.
   */
  async function extractMediaMetadata (file: File): Promise<{
    widthPx: number | null
    heightPx: number | null
    durationSec: number | null
    bitrateBps: number | null
  }> {
    const result = { widthPx: null as number | null, heightPx: null as number | null, durationSec: null as number | null, bitrateBps: null as number | null }
    const mime = file.type || ''

    if (mime.startsWith('video/') || mime.startsWith('audio/')) {
      try {
        const url = URL.createObjectURL(file)
        const el = document.createElement(mime.startsWith('video/') ? 'video' : 'audio') as HTMLVideoElement | HTMLAudioElement
        await new Promise<void>((resolve, reject) => {
          el.preload = 'metadata'
          el.onloadedmetadata = () => resolve()
          el.onerror = () => reject(new Error('Failed to load media metadata'))
          el.src = url
        })

        if (Number.isFinite(el.duration) && el.duration > 0) {
          result.durationSec = Math.round(el.duration)
          result.bitrateBps = Math.round((file.size * 8) / el.duration)
        }
        if ('videoWidth' in el && (el as HTMLVideoElement).videoWidth > 0) {
          result.widthPx = (el as HTMLVideoElement).videoWidth
          result.heightPx = (el as HTMLVideoElement).videoHeight
        }

        URL.revokeObjectURL(url)
      } catch (err) {
        console.warn('extractMediaMetadata: could not probe file', err)
      }
    } else if (mime.startsWith('image/')) {
      try {
        const url = URL.createObjectURL(file)
        const img = new Image()
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject(new Error('Failed to load image'))
          img.src = url
        })
        result.widthPx = img.naturalWidth
        result.heightPx = img.naturalHeight
        URL.revokeObjectURL(url)
      } catch (err) {
        console.warn('extractMediaMetadata: could not probe image', err)
      }
    }

    return result
  }

  async function connectWallet () {
    try {
      const result = await walletStore.connect()
      if (result) {
        showSnackbar(t('Upload.wallet.connectSuccess'))
      }
    } catch (error) {
      console.error('Wallet connection failed:', error)
      showSnackbar(t('Upload.wallet.connectError'), 'error')
    }
  }

  // ── Upload flow ─────────────────────────────────────────────

  async function handleUpload (submitForReview: boolean) {
    const { valid } = await formRef.value?.validate()
    if (!valid) return

    // Double-check wallet for paid content (defensive)
    if (form.isPaid && !walletStore.isConnected) {
      showSnackbar(t('Upload.wallet.required'), 'error')
      return
    }

    if (props.contentType === 'resource' && !assets.full && !form.resourceContent.trim()) {
      showSnackbar(t('Upload.errors.noFullAsset'), 'error')
      return
    }

    if (props.contentType !== 'resource' && !assets.full) {
      showSnackbar(t('Upload.errors.noFullAsset'), 'error')
      return
    }

    savedAsDraft.value = !submitForReview
    isUploading.value = true
    showProgressOverlay.value = true

    try {
      // 1. Create entry
      progressMessage.value = t('Upload.progress.creatingEntry')
      const entry = await api.upload.createEntry({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        resourceContent: props.contentType === 'resource' && form.resourceContent.trim()
          ? form.resourceContent.trim()
          : undefined,
        type: toEntryType(props.contentType),
        isPaid: form.isPaid,
        priceXlm: form.isPaid && form.priceCurrency === 'XLM' && form.price ? form.price : null,
        priceUsd: form.isPaid && form.priceCurrency === 'USD' && form.price ? form.price : null,
        priceCurrency: form.isPaid ? form.priceCurrency : null,
        sellerWallet: form.isPaid ? walletStore.activeAddress : null,
        contentLanguage: form.contentLanguage || null,
      })

      createdEntryId.value = entry.id

      // 2. Upload assets (full, thumbnail, preview)
      const uploadTasks: Array<{ file: File, kind: AssetKind }> = []
      if (assets.full) uploadTasks.push({ file: assets.full, kind: 'FULL' })
      if (assets.thumbnail) uploadTasks.push({ file: assets.thumbnail, kind: 'THUMBNAIL' })
      if (assets.preview) uploadTasks.push({ file: assets.preview, kind: 'PREVIEW' })

      for (const task of uploadTasks) {
        await uploadAsset(entry.id, task.file, task.kind)
      }

      // 3. Submit for review if requested
      if (submitForReview) {
        progressMessage.value = t('Upload.progress.submittingForReview')
        await api.upload.updateEntryStatus(entry.id, { status: 'IN_REVIEW' })
      }

      // 4. Transition to success screen
      uploadPhase.value = 'success'
    } catch (error) {
      console.error('Upload failed:', error)
      showSnackbar(t('Upload.errors.uploadFailed'), 'error')
    } finally {
      isUploading.value = false
      showProgressOverlay.value = false
    }
  }

  async function uploadAsset (entryId: string, file: File, kind: AssetKind) {
    const progressKey = kind === 'FULL' ? 'full' : (kind === 'THUMBNAIL' ? 'thumbnail' : 'preview')

    // Init upload
    progressMessage.value = t('Upload.progress.initializingUpload')
    const initResp = await api.upload.initUpload({
      entryId,
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      kind,
      fileSizeBytes: file.size,
    })

    // Upload to R2
    progressMessage.value = t('Upload.progress.uploadingFile', { name: file.name })
    await api.upload.uploadToR2(initResp.presignedUrl, file, percent => {
      progress[progressKey] = percent
    })

    // Finalize
    progressMessage.value = t('Upload.progress.finalizingUpload')

    // Extract media metadata from the browser (best-effort, runs client-side)
    const meta = await extractMediaMetadata(file)

    await api.upload.finalizeUpload({
      uploadId: initResp.uploadId,
      entryId,
      r2Key: initResp.r2Key,
      contentType: file.type || 'application/octet-stream',
      fileName: file.name,
      fileSizeBytes: file.size,
      kind,
      widthPx: meta.widthPx,
      heightPx: meta.heightPx,
      durationSec: meta.durationSec,
      bitrateBps: meta.bitrateBps,
    })

    progress[progressKey] = 100
    showSnackbar(t('Upload.success.uploadComplete'))
  }

  function uploadAnother () {
    router.push({ path: '/upload' })
  }
</script>

<style scoped>
  .success-icon-wrapper {
    animation: success-pop 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  }

  @keyframes success-pop {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    60% {
      transform: scale(1.15);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
</style>
