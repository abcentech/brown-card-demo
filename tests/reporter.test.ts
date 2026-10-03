import { describe, expect, it } from 'vitest'
import {
  enqueue, flushQueue, isResetError, QUEUE_KEY, readQueue, removeFromQueue, RESET_KEY, syncResetMarker, type StorageLike,
} from '../src/features/reporter/queue'
import { emptyDraft, toIncidentInput } from '../src/features/reporter/model'
import { SAMPLE_COVERED } from '../src/shared/seed'
import type { IncidentInput, IncidentResult } from '../src/shared/types'

const fakeStorage = (): StorageLike & { map: Map<string, string> } => {
  const map = new Map<string, string>()
  return {
    map,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  }
}

const input = (country: string): IncidentInput => ({
  cardNumber: SAMPLE_COVERED, crossing: 'Seme–Krake', country, parties: 2, injuries: false, narrative: 'test', photoCount: 1,
})

const okSend = async (i: IncidentInput): Promise<IncidentResult> => ({
  incidentRef: `IR-${i.country}`, claimRef: `CL-${i.country}`, verified: true, smsPreview: 'demo',
})

describe('reporter offline queue', () => {
  it('holds reports under a bcd-reporter- key and reads them back', () => {
    const s = fakeStorage()
    expect(QUEUE_KEY.startsWith('bcd-reporter-')).toBe(true)
    const a = enqueue(input('Benin'), s)
    const b = enqueue(input('Togo'), s)
    expect(readQueue(s).map((q) => q.id)).toEqual([a.id, b.id])
    removeFromQueue(a.id, s)
    expect(readQueue(s)).toHaveLength(1)
  })

  it('flushes in order and removes sent items; failures stay queued', async () => {
    const s = fakeStorage()
    enqueue(input('Benin'), s)
    enqueue(input('Ghana'), s)
    enqueue(input('Niger'), s)
    const outcome = await flushQueue(async (i) => {
      if (i.country === 'Ghana') throw new Error('offline again')
      return okSend(i)
    }, s)
    expect(outcome.sent.map((x) => x.result.incidentRef)).toEqual(['IR-Benin', 'IR-Niger'])
    expect(outcome.failed.map((x) => x.input.country)).toEqual(['Ghana'])
    expect(readQueue(s).map((x) => x.input.country)).toEqual(['Ghana'])
  })

  it('removes the storage key when the queue empties', async () => {
    const s = fakeStorage()
    enqueue(input('Benin'), s)
    await flushQueue(okSend, s)
    expect(s.map.has(QUEUE_KEY)).toBe(false)
  })

  it('survives corrupt storage', () => {
    const s = fakeStorage()
    s.setItem(QUEUE_KEY, '{not json')
    expect(readQueue(s)).toEqual([])
  })

  it('drops the queue when the reset marker changed while the screen was closed', () => {
    const s = fakeStorage()
    expect(syncResetMarker('seed-1', s)).toBe(false) // first visit: nothing to compare
    enqueue(input('Benin'), s)
    expect(syncResetMarker('seed-1', s)).toBe(false) // same demo run: queue kept
    expect(readQueue(s)).toHaveLength(1)
    expect(syncResetMarker('seed-2', s)).toBe(true) // Reset demo ran in between
    expect(readQueue(s)).toEqual([])
    expect(s.map.get(RESET_KEY)).toBe('seed-2')
  })

  it('recognises the adapter\'s mid-flight reset rejection', () => {
    expect(isResetError(new Error('The demo was reset while this request was in flight.'))).toBe(true)
    expect(isResetError(new Error('Network down'))).toBe(false)
    expect(isResetError('reset')).toBe(false)
  })
})

describe('reporter draft mapping', () => {
  it('builds a valid IncidentInput with clamped values and defaults', () => {
    const d = { ...emptyDraft(), cardNumber: ' ng-26-4a7c-1180-9 ', parties: 9, photoCount: 7, narrative: '  Bumped  ', injuries: null }
    const out = toIncidentInput(d)
    expect(out.cardNumber).toBe('NG-26-4A7C-1180-9')
    expect(out.parties).toBe(5)
    expect(out.photoCount).toBe(3)
    expect(out.narrative).toBe('Bumped')
    expect(out.injuries).toBe(false)
    expect(out.crossing).toBe('Other')
  })
})
