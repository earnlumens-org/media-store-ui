/**
 * API module for the Publishing Block queue.
 *
 * Entities publish immediately on the creator's profile; visibility inside a
 * Space goes through per-space publishing blocks (48 base slots, released
 * every 10 minutes by default). These endpoints power the "publish to
 * spaces" dialog and the live queue status panel.
 *
 * All instants on the wire are epoch millis UTC.
 */

import { apiRequest } from '../apiRequest'

const BASE_PATH = '/api/publishing'

export type PublishingEntityType = 'ENTRY' | 'COLLECTION'

export interface SpaceQueuePreviewDto {
  spaceId: string
  spaceName: string | null
  spaceIcon: string | null
  nextBlockSequence: number
  nextBlockPublishAtEpochMs: number | null
  nextBlockLockAtEpochMs: number | null
  baseCapacity: number
  baseSlotsUsed: number
  fastPassSlots: number
  /** Publications ahead across the whole space queue. */
  waitingAhead: number
  /** FastPass purchasable (base slots of the next open block are full). */
  fastPassAvailable: boolean
  fastPassPriceUsd: number
  alreadyPublished: boolean
  alreadyQueued: boolean
  queueItemId: string | null
}

export interface QueueItemStatusDto {
  itemId: string
  spaceId: string
  spaceName: string | null
  blockId: string
  blockSequence: number
  blockStatus: 'OPEN' | 'LOCKED' | 'PUBLISHED' | null
  blockPublishAtEpochMs: number | null
  blockLockAtEpochMs: number | null
  status: 'QUEUED' | 'LOCKED' | 'PUBLISHED' | 'CANCELLED'
  fastPass: boolean
  priorityFeeXlm: number
  /** 1-based position in the block (frozen when LOCKED, provisional while QUEUED). */
  position: number | null
  totalInBlock: number
  aheadInSpace: number
  canCancel: boolean
  canBoostFee: boolean
}

/** Pre-enqueue preview for every candidate space of an entity. */
export async function getPublishingSpaces (
  entityType: PublishingEntityType,
  entityId: string,
): Promise<SpaceQueuePreviewDto[]> {
  const d = await apiRequest<{ spaces: SpaceQueuePreviewDto[] }>(
    `${BASE_PATH}/spaces?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`,
  )
  return d.spaces ?? []
}

/** Enqueue an entity into the queues of the selected spaces. */
export async function enqueueToSpaces (
  entityType: PublishingEntityType,
  entityId: string,
  spaceIds: string[],
): Promise<QueueItemStatusDto[]> {
  const d = await apiRequest<{ items: QueueItemStatusDto[] }>(
    `${BASE_PATH}/queue`,
    {
      method: 'POST',
      body: JSON.stringify({ entityType, entityId, spaceIds }),
    },
  )
  return d.items ?? []
}

/** Live status of every queue item of the caller's entity. */
export async function getPublishingQueueStatus (
  entityType: PublishingEntityType,
  entityId: string,
): Promise<QueueItemStatusDto[]> {
  const d = await apiRequest<{ items: QueueItemStatusDto[] }>(
    `${BASE_PATH}/queue?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`,
  )
  return d.items ?? []
}

/** Cancel a QUEUED item (only while its block is OPEN). Frees the slot. */
export async function cancelQueueItem (itemId: string): Promise<void> {
  await apiRequest<{ cancelled: boolean }>(
    `${BASE_PATH}/queue/${encodeURIComponent(itemId)}`,
    { method: 'DELETE' },
  )
}
