<template>
  <!-- Inline type selector when no query param -->
  <v-container v-if="!resolvedType" class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" md="6">
        <v-card class="pa-6 text-center">
          <v-icon class="mb-3" color="primary" size="48">mdi-plus-circle-outline</v-icon>
          <h2 class="text-h5 mb-2">{{ t('Upload.createNew') }}</h2>
          <p class="text-body-2 text-medium-emphasis mb-6">
            {{ t('Upload.selectContentType') }}
          </p>

          <v-row dense>
            <v-col
              v-for="option in contentTypes"
              :key="option.value"
              cols="12"
              sm="6"
            >
              <v-card
                class="pa-3 d-flex align-center"
                hover
                variant="outlined"
                @click="selectType(option.value)"
              >
                <v-icon class="me-3" color="primary" size="28">
                  {{ option.icon }}
                </v-icon>
                <div class="text-left">
                  <div class="text-body-1 font-weight-medium">
                    {{ t(`Upload.type.${option.value}`) }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ t(`Upload.typeDescription.${option.value}`) }}
                  </div>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>

  <!-- Upload form when type is known -->
  <UploadForm v-else :content-type="resolvedType" />
</template>

<script setup lang="ts">
  import type { UploadContentType } from '@/api/types/upload.types'
  import { UPLOAD_CONTENT_TYPES } from '@/api/types/upload.types'
  import UploadForm from '@/components/upload/UploadForm.vue'
  import { computed } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'

  const route = useRoute()
  const router = useRouter()
  const { t } = useI18n()

  const contentTypes: { value: UploadContentType; icon: string }[] = [
    { value: 'video', icon: 'mdi-video-outline' },
    { value: 'audio', icon: 'mdi-music-note' },
    { value: 'image', icon: 'mdi-image-outline' },
    { value: 'post', icon: 'mdi-text-box-outline' },
    { value: 'file', icon: 'mdi-file-outline' },
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

<route lang="json">
{
  "path": "/upload",
  "meta": { "requiresAuth": true }
}
</route>
