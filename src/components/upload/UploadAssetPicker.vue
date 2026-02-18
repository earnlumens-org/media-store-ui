<template>
  <div>
    <!-- File selected state -->
    <v-card
      v-if="selectedFile"
      class="pa-3"
      variant="tonal"
    >
      <div class="d-flex align-center">
        <v-icon class="me-2" color="success">mdi-check-circle</v-icon>
        <div class="flex-grow-1 text-truncate">
          <div class="text-body-2 font-weight-medium text-truncate">
            {{ selectedFile.name }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ formatFileSize(selectedFile.size) }}
          </div>
        </div>
        <v-btn
          color="primary"
          size="small"
          variant="text"
          @click="openFileDialog"
        >
          {{ t('Upload.assets.changeFile') }}
        </v-btn>
        <v-btn
          icon="mdi-close"
          size="x-small"
          variant="text"
          @click="clearFile"
        />
      </div>

      <!-- Upload progress -->
      <v-progress-linear
        v-if="uploadProgress !== null && uploadProgress < 100"
        class="mt-2"
        color="primary"
        :model-value="uploadProgress"
        rounded
      />
    </v-card>

    <!-- Empty state: drop zone -->
    <v-card
      v-else
      class="pa-6 text-center"
      :class="{ 'border-primary': isDragOver }"
      variant="outlined"
      @click="openFileDialog"
      @dragenter.prevent="isDragOver = true"
      @dragleave.prevent="isDragOver = false"
      @dragover.prevent
      @drop.prevent="handleDrop"
    >
      <v-icon class="mb-2" color="primary" size="40">mdi-cloud-upload-outline</v-icon>
      <div class="text-body-2">{{ t('Upload.assets.dragOrClick') }}</div>
      <div class="text-caption text-medium-emphasis mt-1">
        {{ t('Upload.assets.maxSize', { size: formatFileSize(maxSize) }) }}
      </div>
    </v-card>

    <!-- Validation error -->
    <div v-if="errorMessage" class="text-caption text-error mt-1">
      {{ errorMessage }}
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      :accept="accept"
      hidden
      type="file"
      @change="handleFileChange"
    >
  </div>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { formatFileSize } from '@/api/types/upload.types'

  const props = defineProps<{
    accept: string
    maxSize: number
  }>()

  const selectedFile = defineModel<File | null>('file', { default: null })
  const uploadProgress = defineModel<number | null>('progress', { default: null })

  const { t } = useI18n()
  const fileInput = ref<HTMLInputElement | null>(null)
  const isDragOver = ref(false)
  const errorMessage = ref<string | null>(null)

  function openFileDialog () {
    fileInput.value?.click()
  }

  function validateFile (file: File): boolean {
    errorMessage.value = null

    // Check size
    if (file.size > props.maxSize) {
      errorMessage.value = t('Upload.assets.fileTooLarge', { size: formatFileSize(props.maxSize) })
      return false
    }

    // Check MIME type (if accept is specified and not wildcard)
    if (props.accept && props.accept !== '*/*') {
      const allowedTypes = props.accept.split(',').map(m => m.trim())
      const fileType = file.type || ''
      const matches = allowedTypes.some(allowed => {
        if (allowed.endsWith('/*')) {
          return fileType.startsWith(allowed.replace('/*', '/'))
        }
        return fileType === allowed
      })
      if (!matches) {
        errorMessage.value = t('Upload.assets.invalidType', { types: props.accept })
        return false
      }
    }

    return true
  }

  function setFile (file: File) {
    if (validateFile(file)) {
      selectedFile.value = file
      uploadProgress.value = null
    }
  }

  function clearFile () {
    selectedFile.value = null
    uploadProgress.value = null
    errorMessage.value = null
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }

  function handleFileChange (event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) {
      setFile(file)
    }
  }

  function handleDrop (event: DragEvent) {
    isDragOver.value = false
    const file = event.dataTransfer?.files?.[0]
    if (file) {
      setFile(file)
    }
  }

  // Reset error when file changes externally
  watch(selectedFile, newFile => {
    if (newFile) {
      errorMessage.value = null
    }
  })
</script>
