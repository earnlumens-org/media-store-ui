/**
 * Shared price-label formatting for content cards (entries + collections).
 *
 * Every feed endpoint already ships `priceXlm` / `priceUsd` / `priceCurrency`
 * alongside the item, so cards can render the price without any extra API
 * round-trips. Any card surface (grids, recommendation lists, favorites…)
 * should go through {@link formatCardPrice} so the label stays consistent
 * platform-wide and new currencies only need to be added here.
 */

export interface CardPriceFields {
  priceXlm?: number
  priceUsd?: number
  priceCurrency?: string
}

/**
 * Compact price label for card overlays:
 * - USD → `$2.50`
 * - XLM → `12.5 XLM` (up to 2 decimals, trailing zeros trimmed)
 * - unknown/missing price data → `''` (callers fall back to a generic label)
 */
export function formatCardPrice (price?: CardPriceFields | null): string {
  if (!price) {
    return ''
  }
  if (price.priceCurrency === 'USD' && price.priceUsd != null) {
    return `$${price.priceUsd.toFixed(2)}`
  }
  if (price.priceXlm != null) {
    return `${Number(price.priceXlm.toFixed(2))} XLM`
  }
  return ''
}
