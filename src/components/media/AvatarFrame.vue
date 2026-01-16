<template>
  <v-avatar :size="size">
    <v-img
      v-if="src"
      :src="src"
    >
      <template #placeholder>
        <v-sheet
          class="w-100 h-100 d-flex align-center justify-center"
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
      :color="fallbackColor"
    >
      <v-icon
        :color="fallbackIconColor"
        :size="fallbackIconSize"
      >
        {{ fallbackIcon }}
      </v-icon>
    </v-sheet>
  </v-avatar>
</template>

<script setup lang="ts">
  interface Props {
    src?: string
    size?: number | string
    fallbackColor?: string
    fallbackIcon?: string
    fallbackIconColor?: string
    fallbackIconSize?: number | string
  }

  withDefaults(defineProps<Props>(), {
    size: 48,
    fallbackColor: 'grey-lighten-3',
    fallbackIcon: 'mdi-account',
    fallbackIconColor: 'grey-darken-1',
    fallbackIconSize: 22,
  })
</script>
