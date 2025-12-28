<template>
  <v-card
    class="cursor-pointer"
    hover
    rounded="xl"
    :variant="selected ? 'tonal' : 'flat'"
    @click="$emit('apply', themeKey)"
  >
    <v-card-text class="pa-4">
      <v-sheet
        class="position-relative overflow-hidden"
        height="88"
        rounded="lg"
      >
        <v-row class="ma-0 fill-height" no-gutters>
          <v-col class="pa-0" cols="6">
            <v-sheet
              :color="colors.background"
              height="44"
            />
          </v-col>
          <v-col class="pa-0" cols="6">
            <v-sheet
              :color="colors.primary"
              height="44"
            />
          </v-col>
          <v-col class="pa-0" cols="6">
            <v-sheet
              :color="colors.secondary"
              height="44"
            />
          </v-col>
          <v-col class="pa-0" cols="6">
            <v-sheet
              :color="colors.accent"
              height="44"
            />
          </v-col>
        </v-row>
      </v-sheet>

      <v-card-title class="px-0 pt-3 pb-1 text-subtitle-1">
        {{ name }}
      </v-card-title>
      <v-card-subtitle class="px-0 pb-0 text-body-2">
        {{ description }}
      </v-card-subtitle>
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
    (e: 'apply', themeKey: string): void
  }>()
</script>
