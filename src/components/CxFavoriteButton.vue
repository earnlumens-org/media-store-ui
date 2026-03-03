<!--
  CxFavoriteButton — Heart toggle backed by the favorites store / API.

  Usage:
    <CxFavoriteButton item-id="abc-123" item-type="ENTRY" />
    <CxFavoriteButton item-id="abc-123" item-type="COLLECTION" variant="icon" />

  Variants:
    • "pill"  (default) — rounded pill button with label  ❤ Favorite
    • "icon"  — icon-only button (useful in toolbars / compact spaces)
    • "tonal" — tonal pill with count (matches watch/view action rows)
-->
<template>
  <v-btn
    v-if="variant === 'icon'"
    :aria-label="ariaLabel"
    :color="isFav ? 'red' : undefined"
    :icon="isFav ? 'mdi-heart' : 'mdi-heart-outline'"
    :loading="toggling"
    :size="size"
    variant="text"
    @click.stop="onToggle"
  />

  <v-btn
    v-else
    :aria-label="ariaLabel"
    :color="isFav ? 'red' : undefined"
    :loading="toggling"
    :prepend-icon="isFav ? 'mdi-heart' : 'mdi-heart-outline'"
    rounded="pill"
    :size="size"
    :variant="variant === 'tonal' ? 'tonal' : 'tonal'"
    @click.stop="onToggle"
  >
    {{ label }}
  </v-btn>

  <v-snackbar
    v-model="snackbar"
    :timeout="2000"
  >
    {{ snackbarText }}
  </v-snackbar>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'

  import { useAuthStore } from '@/stores/auth'
  import { useFavoritesStore } from '@/stores/favorites'

  interface Props {
    /** The ID of the entry or collection */
    itemId: string
    /** Whether this is an ENTRY or COLLECTION */
    itemType: 'ENTRY' | 'COLLECTION'
    /** Visual variant: pill (default), icon, or tonal */
    variant?: 'pill' | 'icon' | 'tonal'
    /** Button size (Vuetify size prop) */
    size?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    variant: 'pill',
    size: 'default',
  })

  const { t } = useI18n()
  const auth = useAuthStore()
  const favoritesStore = useFavoritesStore()

  const snackbar = ref(false)
  const snackbarText = ref('')
  const toggling = ref(false)

  const isFav = computed(() => favoritesStore.isFavorite(props.itemId))

  const ariaLabel = computed(() =>
    isFav.value
      ? t('Common.removeFromFavorites')
      : t('Common.saveToFavorites'),
  )

  const label = computed(() =>
    isFav.value
      ? t('Common.removeFromFavorites')
      : t('Common.saveToFavorites'),
  )

  async function onToggle () {
    if (!auth.isAuthenticated) return

    toggling.value = true
    try {
      const result = await favoritesStore.toggleFavorite(props.itemId, props.itemType)

      if (result != null) {
        snackbarText.value = result
          ? t('Common.addedToFavorites')
          : t('Common.removedFromFavorites')
        snackbar.value = true
      }
    } finally {
      toggling.value = false
    }
  }
</script>
