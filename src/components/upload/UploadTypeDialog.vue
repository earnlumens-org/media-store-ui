<template>
  <v-dialog
    v-model="model"
    :fullscreen="smAndDown"
    max-width="520"
  >
    <v-card>
      <v-card-title class="d-flex align-center pa-4">
        <v-icon class="me-2">mdi-plus-circle-outline</v-icon>
        {{ t('Upload.createNew') }}
        <v-spacer />
        <v-btn
          icon="mdi-close"
          size="small"
          variant="text"
          @click="model = false"
        />
      </v-card-title>

      <v-card-subtitle class="px-4 pb-2">
        {{ t('Upload.selectContentType') }}
      </v-card-subtitle>

      <v-card-text class="pa-4 pt-0">
        <div class="type-grid">
          <v-card
            v-for="option in contentTypes"
            :key="option.value"
            class="type-card d-flex align-center pa-4"
            :color="hoveredType === option.value ? 'primary' : undefined"
            hover
            variant="outlined"
            @click="selectType(option.value)"
            @mouseenter="hoveredType = option.value"
            @mouseleave="hoveredType = null"
          >
            <v-icon
              class="me-3 flex-shrink-0"
              :color="hoveredType === option.value ? 'on-primary' : 'primary'"
              size="28"
            >
              {{ option.icon }}
            </v-icon>
            <div class="flex-grow-1 min-width-0">
              <div
                class="text-body-1 font-weight-medium"
                :class="{ 'text-on-primary': hoveredType === option.value }"
              >
                {{ t(`Upload.type.${option.value}`) }}
              </div>
              <div
                class="text-caption type-description"
                :class="hoveredType === option.value ? 'text-on-primary' : 'text-medium-emphasis'"
              >
                {{ t(`Upload.typeDescription.${option.value}`) }}
              </div>
            </div>
          </v-card>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { UploadContentType } from '@/api/types/upload.types'
  import { ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify'

  const model = defineModel<boolean>({ default: false })
  const router = useRouter()
  const { t } = useI18n()
  const { smAndDown } = useDisplay()

  const hoveredType = ref<string | null>(null)

  const contentTypes: Array<{ value: UploadContentType, icon: string }> = [
    { value: 'video', icon: 'mdi-video-outline' },
    { value: 'audio', icon: 'mdi-music-note' },
    { value: 'image', icon: 'mdi-image-outline' },
    { value: 'resource', icon: 'mdi-text-box-outline' },
  ]

  function selectType (type: UploadContentType) {
    model.value = false
    router.push({ path: '/upload', query: { type } })
  }
</script>

<style scoped>
  .type-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .type-card {
    height: 100%;
    min-height: 88px;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }

  .type-description {
    line-height: 1.35;
  }

  .min-width-0 {
    min-width: 0;
  }

  @media (max-width: 599.98px) {
    .type-grid {
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .type-card {
      min-height: 100px;
      flex-direction: column;
      align-items: center !important;
      justify-content: center;
      text-align: center;
      padding: 16px 12px !important;
    }

    .type-card .v-icon {
      margin-inline-end: 0 !important;
      margin-bottom: 8px;
    }

    .type-card .min-width-0 {
      width: 100%;
    }

    .type-description {
      display: none;
    }
  }

  @media (max-width: 359.98px) {
    .type-grid {
      grid-template-columns: 1fr;
    }

    .type-card {
      flex-direction: row !important;
      text-align: start !important;
      min-height: 64px;
    }

    .type-card .v-icon {
      margin-inline-end: 12px !important;
      margin-bottom: 0 !important;
    }

    .type-description {
      display: block;
    }
  }
</style>
