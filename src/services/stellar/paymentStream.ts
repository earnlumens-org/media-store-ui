/**
 * Horizon SSE payment stream for real-time balance updates.
 *
 * Opens an EventSource to Horizon's payments endpoint with cursor=now,
 * so the browser receives a server-sent event each time a new payment
 * touches the watched account.  EventSource automatically reconnects
 * on transient network errors, so no manual retry logic is needed.
 */

import { getStellarHorizonUrl } from '@/config/env'

const HORIZON_URL = getStellarHorizonUrl()

export type PaymentHandler = () => void

/**
 * Opens a streaming connection to Horizon for payments on the given address.
 * Returns a cleanup function that closes the stream.
 */
export function streamPayments (address: string, onPayment: PaymentHandler): () => void {
  const url = `${HORIZON_URL}/accounts/${address}/payments?cursor=now`
  const eventSource = new EventSource(url)

  eventSource.addEventListener('message', () => {
    onPayment()
  })

  eventSource.addEventListener('error', () => {
    // EventSource auto-reconnects on most transient errors.
    // Log only when the connection is fully closed.
    if (eventSource.readyState === EventSource.CLOSED) {
      console.warn('[PaymentStream] Connection closed — will not reconnect')
    }
  })

  return () => {
    eventSource.close()
  }
}
