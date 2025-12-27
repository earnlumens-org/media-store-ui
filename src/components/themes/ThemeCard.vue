<template>
  <v-card
    class="theme-card"
    :class="{ 'theme-card--selected': selected }"
    rounded="xl"
    variant="outlined"
    @click="$emit('apply', themeKey)"
    @mouseenter="$emit('preview', themeKey)"
    @mouseleave="$emit('stop-preview')"
  >
    <v-card-text class="pa-4">
      <div aria-hidden="true" class="preview-tile">
        <div class="swatch" :style="{ backgroundColor: colors.background }" />
        <div class="swatch" :style="{ backgroundColor: colors.primary }" />
        <div class="swatch" :style="{ backgroundColor: colors.secondary }" />
        <div class="swatch" :style="{ backgroundColor: colors.accent }" />

        <div
          v-if="selected"
          class="selected-indicator"
        >
          <v-icon size="20">mdi-check-circle</v-icon>
        </div>
      </div>

      <div class="mt-3">
        <div class="text-subtitle-1 font-weight-semibold">
          {{ name }}
        </div>
        <div class="text-body-2 text-medium-emphasis">
          {{ description }}
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
  type SwatchColors = {
    background: string
    primary: string
    secondary: string
    accent: string
  }

  defineProps<{
    themeKey: string
    name: string
    description: string
    colors: SwatchColors
    selected: boolean
  }>()

  defineEmits<{
    (e: 'preview' | 'apply', themeKey: string): void
    (e: 'stop-preview'): void
  }>()
</script>

<style scoped>
.theme-card {
  cursor: pointer;
}

.theme-card--selected {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 0;
}

.preview-tile {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  height: 88px;
}

.swatch {
  width: 100%;
  height: 100%;
}

.selected-indicator {
  position: absolute;
  top: 10px;
  right: 10px;
  color: rgb(var(--v-theme-primary));
}
</style>
