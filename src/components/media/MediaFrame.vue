<template>
  <v-responsive :aspect-ratio="aspectRatio">
    <div class="position-absolute top-0 left-0 w-100 h-100">
      <v-img
        v-if="src"
        class="w-100 h-100"
        :class="[roundedClass, grayscale ? 'grayscale opacity-60' : '']"
        cover
        height="100%"
        :src="src"
        width="100%"
      >
        <template #placeholder>
          <v-sheet
            class="w-100 h-100 d-flex align-center justify-center"
            :class="[roundedClass, grayscale ? 'grayscale opacity-60' : '']"
            :color="fallbackColor"
          >
            <v-icon
              :color="fallbackIconColor"
              :size="fallbackIconSize"
            >
              {{ fallbackIcon }}
            </v-icon>
          </v-sheet>
        </template>

        <template #error>
          <v-sheet
            class="w-100 h-100 d-flex align-center justify-center"
            :class="[roundedClass, grayscale ? 'grayscale opacity-60' : '']"
            :color="fallbackColor"
          >
            <v-icon
              :color="fallbackIconColor"
              :size="fallbackIconSize"
            >
              {{ fallbackIcon }}
            </v-icon>
          </v-sheet>
        </template>
      </v-img>

      <v-sheet
        v-else
        class="w-100 h-100 d-flex align-center justify-center"
        :class="[roundedClass, grayscale ? 'grayscale opacity-60' : '']"
        :color="fallbackColor"
      >
        <v-icon
          :color="fallbackIconColor"
          :size="fallbackIconSize"
        >
          {{ fallbackIcon }}
        </v-icon>
      </v-sheet>

      <slot name="overlay" />
    </div>
  </v-responsive>
</template>

<script setup lang="ts">
  interface Props {
    src?: string
    aspectRatio?: number
    roundedClass?: string
    grayscale?: boolean
    fallbackColor?: string
    fallbackIcon?: string
    fallbackIconColor?: string
    fallbackIconSize?: number | string
  }

  withDefaults(defineProps<Props>(), {
    aspectRatio: 16 / 9,
    roundedClass: 'rounded-lg',
    grayscale: false,
    fallbackColor: 'grey-lighten-3',
    fallbackIcon: 'mdi-image-outline',
    fallbackIconColor: 'grey',
    fallbackIconSize: 64,
  })
</script>
