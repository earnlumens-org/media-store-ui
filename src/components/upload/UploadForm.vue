<template>
  <v-container class="upload-form" fluid>
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

        <v-form ref="formRef" @submit.prevent="handleSubmit">
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

                <!-- Post content (only for post type) -->
                <v-textarea
                  v-if="contentType === 'post'"
                  v-model="form.postContent"
                  class="mt-2"
                  :label="t('Upload.form.postContent')"
                  :placeholder="t('Upload.form.postContentPlaceholder')"
                  rows="8"
                  :rules="postContentRules"
                  variant="outlined"
                />

                <!-- Paid toggle + price -->
                <v-divider class="my-4" />

                <v-switch
                  v-model="form.isPaid"
                  color="primary"
                  :hint="t('Upload.form.isPaidHint')"
                  :label="t('Upload.form.isPaid')"
                  persistent-hint
                />

                <v-text-field
                  v-if="form.isPaid"
                  v-model="form.priceXlm"
                  class="mt-3"
                  :label="t('Upload.form.priceXlm')"
                  :placeholder="t('Upload.form.pricePlaceholder')"
                  prefix="XLM"
                  :rules="priceRules"
                  step="0.01"
                  type="number"
                  variant="outlined"
                />
              </v-card>
            </v-col>

            <!-- Right column: assets -->
            <v-col cols="12" md="5">
              <!-- Full content (not for post) -->
              <v-card v-if="contentType !== 'post'" class="pa-4 mb-4">
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
                    color="primary"
                    :disabled="!canUpload"
                    :loading="isUploading"
                    variant="elevated"
                    @click="handleSubmit"
                  >
                    <v-icon class="me-1">mdi-cloud-upload-outline</v-icon>
                    {{ isUploading ? t('Upload.actions.uploading') : t('Upload.actions.upload') }}
                  </v-btn>

                  <v-btn
                    color="success"
                    :disabled="!canSubmitForReview"
                    :loading="isSubmitting"
                    variant="elevated"
                    @click="handleSubmitForReview"
                  >
                    <v-icon class="me-1">mdi-send</v-icon>
                    {{ isSubmitting ? t('Upload.actions.submitting') : t('Upload.actions.submitForReview') }}
                  </v-btn>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-form>

        <!-- Progress overlay -->
        <v-overlay
          v-model="showProgressOverlay"
          class="align-center justify-center"
          persistent
        >
          <v-card class="pa-6 text-center" min-width="300">
            <v-progress-circular
              class="mb-4"
              color="primary"
              indeterminate
              size="48"
            />
            <div class="text-body-1">{{ progressMessage }}</div>
          </v-card>
        </v-overlay>

        <!-- Snackbar for feedback -->
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
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import type { AssetKind, UploadContentType } from '@/api/types/upload.types'
  import { computed, reactive, ref } from 'vue'
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

  const props = defineProps<{
    contentType: UploadContentType
  }>()

  const router = useRouter()
  const { t } = useI18n()
  const formRef = ref()

  // ── Form state ──────────────────────────────────────────────

  const form = reactive({
    title: '',
    description: '',
    postContent: '',
    isPaid: false,
    priceXlm: null as number | null,
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

  const canUpload = computed(() => {
    if (!form.title.trim()) return false
    if (props.contentType === 'post') {
      return !!form.postContent.trim()
    }
    return !!assets.full
  })

  // Entry was created and full asset uploaded successfully
  const entryCreated = ref(false)
  const fullAssetUploaded = ref(false)

  const canSubmitForReview = computed(() => {
    if (!entryCreated.value) return false
    if (props.contentType === 'post') return true
    return fullAssetUploaded.value
  })

  // ── Validation rules ───────────────────────────────────────

  const titleRules = [
    (v: string) => !!v.trim() || t('Upload.form.titleRequired'),
    (v: string) => v.length <= 200 || t('Upload.form.titleMaxLength'),
  ]

  const descriptionRules = [
    (v: string) => !v || v.length <= 2000 || t('Upload.form.descriptionMaxLength'),
  ]

  const postContentRules = [
    (v: string) => !!v.trim() || t('Upload.form.postContentRequired'),
  ]

  const priceRules = [
    (v: number | null) => v !== null || t('Upload.form.priceRequired'),
    (v: number | null) => (v !== null && v > 0) || t('Upload.form.pricePositive'),
  ]

  // ── Upload state ────────────────────────────────────────────

  const isUploading = ref(false)
  const isSubmitting = ref(false)
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

  // ── Upload flow ─────────────────────────────────────────────

  async function handleSubmit () {
    const { valid } = await formRef.value?.validate()
    if (!valid) return

    if (props.contentType !== 'post' && !assets.full) {
      showSnackbar(t('Upload.errors.noFullAsset'), 'error')
      return
    }

    isUploading.value = true
    showProgressOverlay.value = true

    try {
      // 1. Create entry
      progressMessage.value = t('Upload.progress.creatingEntry')
      const entry = await api.upload.createEntry({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        type: toEntryType(props.contentType),
        isPaid: form.isPaid,
        priceXlm: form.isPaid && form.priceXlm ? form.priceXlm : null,
      })

      createdEntryId.value = entry.id
      entryCreated.value = true

      // 2. Upload assets (full, thumbnail, preview)
      const uploadTasks: Array<{ file: File, kind: AssetKind }> = []
      if (assets.full) uploadTasks.push({ file: assets.full, kind: 'FULL' })
      if (assets.thumbnail) uploadTasks.push({ file: assets.thumbnail, kind: 'THUMBNAIL' })
      if (assets.preview) uploadTasks.push({ file: assets.preview, kind: 'PREVIEW' })

      for (const task of uploadTasks) {
        await uploadAsset(entry.id, task.file, task.kind)
      }

      if (assets.full) {
        fullAssetUploaded.value = true
      }

      showSnackbar(t('Upload.success.entryCreated'))
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
    await api.upload.finalizeUpload({
      uploadId: initResp.uploadId,
      entryId,
      r2Key: initResp.r2Key,
      contentType: file.type || 'application/octet-stream',
      fileName: file.name,
      fileSizeBytes: file.size,
      kind,
    })

    progress[progressKey] = 100
    showSnackbar(t('Upload.success.uploadComplete'))
  }

  async function handleSubmitForReview () {
    if (!createdEntryId.value) return

    isSubmitting.value = true
    showProgressOverlay.value = true
    progressMessage.value = t('Upload.actions.submitting')

    try {
      await api.upload.updateEntryStatus(createdEntryId.value, { status: 'IN_REVIEW' })
      showSnackbar(t('Upload.success.submittedForReview'))

      // Navigate away after successful submission
      setTimeout(() => {
        router.push('/ecosystem')
      }, 1500)
    } catch (error) {
      console.error('Submit for review failed:', error)
      showSnackbar(t('Upload.errors.submitForReviewFailed'), 'error')
    } finally {
      isSubmitting.value = false
      showProgressOverlay.value = false
    }
  }
</script>
