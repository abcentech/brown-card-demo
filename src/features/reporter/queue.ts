// Offline queue for the reporter. Reports are held in localStorage (key prefixed 'bcd-reporter-')
// while the phone is offline and sent through the platform adapter once the 'online' event fires.
// Pure functions with an injectable storage so they can be unit-tested without a browser.
import type { IncidentInput, IncidentResult } from '../../shared/types'

export const QUEUE_KEY = 'bcd-reporter-queue-v1'
/** The last reset marker this phone saw; lets us drop the queue after a reset that happened while the screen was closed. */
export const RESET_KEY = 'bcd-reporter-reset-v1'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface QueuedReport {
  id: string
  input: IncidentInput
  queuedAt: string // ISO time
}

export interface FlushOutcome {
  sent: { id: string; input: IncidentInput; result: IncidentResult }[]
  failed: QueuedReport[]
}

function defaultStorage(): StorageLike | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null
  } catch {
    return null
  }
}

export function readQueue(storage: StorageLike | null = defaultStorage()): QueuedReport[] {
  if (!storage) return []
  try {
    const raw = storage.getItem(QUEUE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as QueuedReport[]) : []
  } catch {
    return []
  }
}

export function writeQueue(items: QueuedReport[], storage: StorageLike | null = defaultStorage()): void {
  if (!storage) return
  try {
    if (items.length === 0) storage.removeItem(QUEUE_KEY)
    else storage.setItem(QUEUE_KEY, JSON.stringify(items))
  } catch {
    // Storage full or blocked: the report is still held in component state for this session.
  }
}

export function clearQueue(storage: StorageLike | null = defaultStorage()): void {
  writeQueue([], storage)
}

/**
 * Records the current reset marker. Returns true (and empties the queue) when the marker changed
 * since the last visit, i.e. "Reset demo" ran while this screen was not mounted.
 */
export function syncResetMarker(marker: string, storage: StorageLike | null = defaultStorage()): boolean {
  if (!storage) return false
  try {
    const seen = storage.getItem(RESET_KEY)
    storage.setItem(RESET_KEY, marker)
    if (seen !== null && seen !== marker) {
      clearQueue(storage)
      return true
    }
  } catch {
    // Storage blocked: nothing to reconcile.
  }
  return false
}

/** True for the adapter's "demo was reset while this request was in flight" rejection. */
export const isResetError = (e: unknown): boolean => e instanceof Error && /reset/i.test(e.message)

export function enqueue(
  input: IncidentInput,
  storage: StorageLike | null = defaultStorage(),
  now = new Date(),
): QueuedReport {
  const item: QueuedReport = {
    id: `q-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    input,
    queuedAt: now.toISOString(),
  }
  writeQueue([...readQueue(storage), item], storage)
  return item
}

export function removeFromQueue(id: string, storage: StorageLike | null = defaultStorage()): void {
  writeQueue(readQueue(storage).filter((q) => q.id !== id), storage)
}

/**
 * Sends every queued report in order. Each success is removed from storage straight away,
 * so a failure part-way through leaves only the unsent ones behind for the next attempt.
 */
export async function flushQueue(
  send: (input: IncidentInput) => Promise<IncidentResult>,
  storage: StorageLike | null = defaultStorage(),
): Promise<FlushOutcome> {
  const outcome: FlushOutcome = { sent: [], failed: [] }
  for (const item of readQueue(storage)) {
    try {
      const result = await send(item.input)
      removeFromQueue(item.id, storage)
      outcome.sent.push({ id: item.id, input: item.input, result })
    } catch {
      outcome.failed.push(item)
    }
  }
  return outcome
}
