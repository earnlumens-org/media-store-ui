/**
 * Critical-section registry.
 *
 * A process-wide, reactive count of "do-not-interrupt" operations currently in
 * flight: paying, connecting a wallet, signing a transaction, and any other
 * action where yanking the page out from under the user (e.g. an automatic
 * reload to ship a new app version) would lose money, sign the wrong thing, or
 * destroy unrecoverable state.
 *
 * Implemented as a module-level singleton so non-component code (the wallet
 * Pinia store, the checkout flow, interceptors, …) can mark a section without
 * needing access to a component instance. The app-update orchestrator
 * (`@/services/appUpdate`) watches {@link isCriticalOperationActive} and holds
 * any pending reload until it returns to `false`.
 *
 * Usage:
 *   const release = beginCriticalSection('checkout')
 *   try { … } finally { release() }
 *
 *   // or, for a promise-returning block:
 *   await withCriticalSection(() => doSomethingSensitive(), 'sign')
 */

import { computed, ref } from 'vue'

/**
 * Active critical-section tokens. A Set keyed by unique symbols so concurrent
 * and/or nested sections compose correctly: the app is "critical" while at
 * least one token is held, and each `release()` only removes its own token
 * (releasing twice, or out of order, is a no-op).
 */
const activeTokens = ref(new Set<symbol>())

/** True while at least one critical operation is in flight. */
export const isCriticalOperationActive = computed(() => activeTokens.value.size > 0)

/**
 * Marks the start of a critical section. Returns a release function that MUST
 * be called (ideally from a `finally`) when the operation completes, succeeds
 * or fails. The release is idempotent.
 */
export function beginCriticalSection (label?: string): () => void {
  const token = Symbol(label ?? 'critical')
  // Replace the Set instance so the computed dependency re-evaluates.
  const next = new Set(activeTokens.value)
  next.add(token)
  activeTokens.value = next

  let released = false
  return () => {
    if (released) {
      return
    }
    released = true
    const updated = new Set(activeTokens.value)
    updated.delete(token)
    activeTokens.value = updated
  }
}

/**
 * Runs `fn` inside a critical section, guaranteeing the section is released
 * even if `fn` throws.
 */
export async function withCriticalSection<T> (
  fn: () => Promise<T> | T,
  label?: string,
): Promise<T> {
  const release = beginCriticalSection(label)
  try {
    return await fn()
  } finally {
    release()
  }
}
