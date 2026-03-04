/**
 * Horizon SSE payment stream for real-time balance updates.
 *
 * Opens an EventSource to Horizon's payments endpoint with cursor=now,
 * so the browser receives a server-sent event each time a new payment
 * touches the watched account.  EventSource automatically reconnects
 * on transient network errors, so no manual retry logic is needed.
 */

import { getStellarHorizonUrl } from '@/config/env'
import { accountExists } from '@/services/stellar/balance'

const HORIZON_URL = getStellarHorizonUrl()

export type PaymentHandler = () => void

/**
 * Opens a streaming connection to Horizon for payments on the given address.
 * If the account doesn't exist on the ledger yet (unfunded), the stream is
 * deferred — it polls every 30 s until the account is created, then opens
 * the EventSource.
 * Returns a cleanup function that closes the stream / stops the polling.
 */
export function streamPayments (address: string, onPayment: PaymentHandler): () => void {
  let eventSource: EventSource | null = null
  let pollTimer: ReturnType<typeof setInterval> | null = null
  let stopped = false

  function openStream () {
    const url = `${HORIZON_URL}/accounts/${address}/payments?cursor=now`
    eventSource = new EventSource(url)

    eventSource.addEventListener('message', () => {
      onPayment()
    })

    eventSource.addEventListener('error', () => {
      if (eventSource && eventSource.readyState === EventSource.CLOSED) {
        console.warn('[PaymentStream] Connection closed — will not reconnect')
      }
    })
  }

  // Check if the account exists before opening the stream
  accountExists(address).then((exists) => {
    if (stopped) return
    if (exists) {
      openStream()
    } else {
      // Poll until the account is funded
      pollTimer = setInterval(async () => {
        if (stopped) {
          if (pollTimer) clearInterval(pollTimer)
          return
        }
        const funded = await accountExists(address)
        if (funded) {
          if (pollTimer) clearInterval(pollTimer)
          pollTimer = null
          if (!stopped) openStream()
        }
      }, 30_000)
    }
  })

  return () => {
    stopped = true
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
  }
}
