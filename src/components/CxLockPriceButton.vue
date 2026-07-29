<template>
  <v-btn
    v-if="variant === 'button'"
    class="cx-lock-price-btn"
    color="white"
    prepend-icon="mdi-lock"
    rounded="pill"
    :to="to"
    variant="elevated"
  >
    {{ label }}
  </v-btn>
  <v-chip
    v-else
    class="cx-lock-price-chip"
    color="white"
    rounded="pill"
    size="small"
    variant="elevated"
  >
    <v-icon class="me-1" size="14">mdi-lock</v-icon>
    {{ label }}
  </v-chip>
</template>

<script setup lang="ts">
  /**
   * Standardized lock indicator for paid content cards.
   *
   * Shows the item price (already present in every feed payload — no extra
   * API calls) instead of a generic "Blocked" label, falling back to
   * `Common.blocked` when price data is unavailable. A fixed minimum width
   * keeps buttons the same size regardless of how long the price is.
   *
   * `variant="button"` → overlay pill on grid cards.
   * `variant="chip"`   → compact pill for recommendation side lists.
   */
  import type { RouteLocationRaw } from 'vue-router'

  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'

  import { type CardPriceFields, formatCardPrice } from '@/lib/cardPrice'

  interface Props {
    /** Item carrying priceXlm / priceUsd / priceCurrency (feed models qualify structurally). */
    price?: CardPriceFields | null
    /** Navigation target (button variant only). */
    to?: RouteLocationRaw
    variant?: 'button' | 'chip'
  }

  const props = withDefaults(defineProps<Props>(), {
    price: null,
    to: undefined,
    variant: 'button',
  })

  const { t } = useI18n()

  const label = computed(() => formatCardPrice(props.price) || t('Common.blocked'))
</script>

<style scoped>
/* Standardized minimum sizes so differing prices never produce differing buttons. */
.cx-lock-price-btn {
  min-width: 110px;
}

.cx-lock-price-chip {
  min-width: 90px;
  justify-content: center;
}
</style>
