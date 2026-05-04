<template>
  <div :class="isMobile ? '' : 'py-3'">
    <!-- Desktop: vertical list with section label -->
    <template v-if="!isMobile">
      <div class="text-subtitle-2 mb-2">
        {{ $t('Themes.categories') }}
      </div>

      <v-list density="comfortable" nav>
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
    </template>

    <!-- Mobile: sticky Material tabs (centered, scrollable, animated indicator) -->
    <v-tabs
      v-else
      :model-value="modelValue"
      align-tabs="start"
      bg-color="surface"
      center-active
      color="primary"
      density="compact"
      grow
      show-arrows
      @update:model-value="(v: unknown) => $emit('update:modelValue', String(v))"
    >
      <v-tab
        v-for="category in categories"
        :key="category.key"
        class="text-none"
        :value="category.key"
      >
        {{ category.label }}
      </v-tab>
    </v-tabs>
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
