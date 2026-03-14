<template>
  <!-- Inline type selector when no query param -->
  <v-container v-if="!resolvedType" class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" lg="5" md="6" sm="8">
        <v-card class="picker-card pa-6">
          <div class="d-flex align-center mb-1">
            <v-icon class="me-2" color="primary" size="28">mdi-plus-circle-outline</v-icon>
            <h2 class="text-h5">{{ t('Upload.createNew') }}</h2>
          </div>

          <p class="text-body-2 text-medium-emphasis mb-5">
            {{ t('Upload.selectContentType') }}
          </p>

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
        </v-card>
      </v-col>
    </v-row>
  </v-container>

  <!-- Upload form when type is known -->
  <UploadForm v-else :content-type="resolvedType" />
</template>

<script setup lang="ts">
  import type { UploadContentType } from '@/api/types/upload.types'

  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRoute, useRouter } from 'vue-router'

  import { UPLOAD_CONTENT_TYPES } from '@/api/types/upload.types'
  import UploadForm from '@/components/upload/UploadForm.vue'

  const route = useRoute()
  const router = useRouter()
  const { t } = useI18n()

  const hoveredType = ref<string | null>(null)

  const contentTypes: { value: UploadContentType, icon: string }[] = [
    { value: 'video', icon: 'mdi-video-outline' },
    { value: 'audio', icon: 'mdi-music-note' },
    { value: 'image', icon: 'mdi-image-outline' },
    { value: 'resource', icon: 'mdi-text-box-outline' },
  ]

  const resolvedType = computed<UploadContentType | null>(() => {
    const raw = route.query.type as string | undefined
    if (raw && UPLOAD_CONTENT_TYPES.includes(raw as UploadContentType)) {
      return raw as UploadContentType
    }
    return null
  })

  function selectType (type: UploadContentType) {
    router.replace({ path: '/upload', query: { type } })
  }
</script>

<style scoped>
  .type-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 10px;
  }

  .type-card {
    height: 100%;
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

<route lang="json">
{
  "path": "/upload",
  "meta": { "requiresAuth": true }
}
</route>
