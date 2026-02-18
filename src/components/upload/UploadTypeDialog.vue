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
        <v-row dense>
          <v-col
            v-for="option in contentTypes"
            :key="option.value"
            cols="12"
            sm="6"
          >
            <v-card
              class="pa-3 d-flex align-center"
              :color="hoveredType === option.value ? 'primary' : undefined"
              hover
              variant="outlined"
              @click="selectType(option.value)"
              @mouseenter="hoveredType = option.value"
              @mouseleave="hoveredType = null"
            >
              <v-icon
                class="me-3"
                :color="hoveredType === option.value ? 'on-primary' : 'primary'"
                size="28"
              >
                {{ option.icon }}
              </v-icon>
              <div>
                <div
                  class="text-body-1 font-weight-medium"
                  :class="{ 'text-on-primary': hoveredType === option.value }"
                >
                  {{ t(`Upload.type.${option.value}`) }}
                </div>
                <div
                  class="text-caption"
                  :class="hoveredType === option.value ? 'text-on-primary' : 'text-medium-emphasis'"
                >
                  {{ t(`Upload.typeDescription.${option.value}`) }}
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
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
    { value: 'post', icon: 'mdi-text-box-outline' },
    { value: 'file', icon: 'mdi-file-outline' },
  ]

  function selectType (type: UploadContentType) {
    model.value = false
    router.push({ path: '/upload', query: { type } })
  }
</script>
