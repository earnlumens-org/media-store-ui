<template>
  <div class="py-3">
    <div :class="isMobile ? 'text-subtitle-2 mb-2 px-5' : 'text-subtitle-2 mb-2'">{{ $t('Themes.categories') }}</div>

    <v-list
      v-if="!isMobile"
      density="comfortable"
      nav
    >
      <v-list-item
        v-for="category in categories"
        :key="category.key"
        :active="category.key === modelValue"
        rounded="lg"
        @click="$emit('update:modelValue', category.key)"
      >
        <v-list-item-title>{{ category.label }}</v-list-item-title>
      </v-list-item>
    </v-list>

    <v-slide-group
      v-else
      show-arrows
    >
      <v-slide-group-item
        v-for="category in categories"
        :key="category.key"
      >
        <v-btn
          class="me-2"
          :color="category.key === modelValue ? 'primary' : undefined"
          rounded="lg"
          :variant="category.key === modelValue ? 'flat' : 'outlined'"
          @click="$emit('update:modelValue', category.key)"
        >
          {{ category.label }}
        </v-btn>
      </v-slide-group-item>
    </v-slide-group>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useDisplay } from 'vuetify'

  type Category = {
    key: string
    label: string
  }

  defineProps<{ categories: Category[], modelValue: string }>()
  defineEmits<{ (e: 'update:modelValue', value: string): void }>()

  const display = useDisplay()
  const isMobile = computed(() => display.smAndDown.value)
</script>
