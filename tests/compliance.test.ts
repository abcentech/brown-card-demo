import { describe, expect, it } from 'vitest'
import { INSURERS, UNCARDED_TOTAL, seedExceptions } from '../src/shared/seed'
import { returnRows } from '../src/shared/selectors'
import {
  DEFAULT_FILTER, EMPTY_FILTER, PAGE_SIZE, applyFilter, assigneeFor, byCause, byChannel, causeSentence, channelSentence,
  confirmationText, groupByInsurer, lowestCoverage, returnTotals, scalePosition, sessionLogText, sortResolvedLast, topBucket,
} from '../src/features/compliance/helpers'

describe('compliance helpers', () => {
  const exceptions = seedExceptions()

  it('groups open uncarded policies by channel and by cause, summing to the total', () => {
    const ch = byChannel(exceptions)
    const ca = byCause(exceptions)
    expect(ch.map((b) => b.key)).toEqual(['direct', 'agent', 'broker', 'bank'])
    expect(ca.map((b) => b.key)).toEqual(['data_error', 'late_entry', 'system_not_calling_api', 'intermediary'])
    expect(ch.reduce((a, b) => a + b.policies, 0)).toBe(UNCARDED_TOTAL)
    expect(ca.reduce((a, b) => a + b.policies, 0)).toBe(UNCARDED_TOTAL)
    expect(ch.reduce((a, b) => a + b.batches, 0)).toBe(exceptions.length)
  })

  it('ignores resolved rows when grouping', () => {
    const resolved = exceptions.map((e) => ({ ...e, status: 'resolved' as const }))
    expect(byChannel(resolved).every((b) => b.policies === 0 && b.batches === 0)).toBe(true)
  })

  it('filters by insurer, channel, cause and status', () => {
    expect(applyFilter(exceptions, EMPTY_FILTER)).toHaveLength(exceptions.length)
    const f = applyFilter(exceptions, { ...EMPTY_FILTER, insurerId: 'A', channel: 'agent' })
    expect(f.length).toBeGreaterThan(0)
    expect(f.every((e) => e.insurerId === 'A' && e.channel === 'agent')).toBe(true)
    expect(applyFilter(exceptions, { ...EMPTY_FILTER, status: 'resolved' })).toHaveLength(0)
  })

  it('opens on batches still to resolve and keeps reminded and assigned rows in that view', () => {
    const mixed = exceptions.map((e, i) => ({ ...e, status: (['open', 'reminded', 'assigned', 'resolved'] as const)[i % 4] }))
    const shown = applyFilter(mixed, DEFAULT_FILTER)
    expect(shown.every((e) => e.status !== 'resolved')).toBe(true)
    expect(shown.some((e) => e.status === 'reminded')).toBe(true)
    expect(shown.some((e) => e.status === 'assigned')).toBe(true)
    expect(applyFilter(mixed, { ...EMPTY_FILTER, status: '' })).toHaveLength(mixed.length)
  })

  it('sorts resolved rows last without reordering the rest', () => {
    const mixed = exceptions.slice(0, 6).map((e, i) => ({ ...e, status: i % 2 ? ('resolved' as const) : ('open' as const) }))
    const sorted = sortResolvedLast(mixed)
    expect(sorted.slice(0, 3).map((e) => e.status)).toEqual(['open', 'open', 'open'])
    expect(sorted.slice(0, 3).map((e) => e.id)).toEqual(['EX-001', 'EX-003', 'EX-005'])
    expect(sorted.slice(3).every((e) => e.status === 'resolved')).toBe(true)
  })

  it('writes a plain sentence about where the gap sits', () => {
    const ch = byChannel(exceptions)
    const top = topBucket(ch)!
    expect(channelSentence(ch)).toMatch(/^Most missing cards come through (direct sales|agents|brokers|banks) \(\d+%\)\.$/)
    expect(ch.every((b) => b.policies <= top.policies)).toBe(true)
    expect(causeSentence(byCause(exceptions))).toMatch(/^The main cause is .+ \(\d+%\)\.$/)
    expect(channelSentence(byChannel(exceptions.map((e) => ({ ...e, status: 'resolved' as const }))))).toBe('No open gaps by channel.')
  })

  it('writes the session log line', () => {
    expect(sessionLogText('backfill', 4, 189)).toBe('Back-filled 4 batches · 189 policies')
    expect(sessionLogText('remind', 1, 40)).toBe('Reminded 1 batch · 40 policies')
    expect(sessionLogText('assign', 2, 1240)).toBe('Assigned 2 batches · 1,240 policies')
  })

  it('finds the lowest coverage insurer', () => {
    const rows = returnRows({ exceptions })
    const low = lowestCoverage(rows)!
    expect(rows.every((r) => r.coveragePct >= low.coveragePct)).toBe(true)
  })

  it('positions the figure on the 85 to 100 scale', () => {
    expect(scalePosition(85)).toBe(0)
    expect(scalePosition(100)).toBe(100)
    expect(scalePosition(92.5)).toBe(50)
    expect(scalePosition(50)).toBe(0)
  })

  it('groups selected batches by insurer for the assign action with an illustrative contact', () => {
    const groups = groupByInsurer(exceptions.slice(0, 20))
    const ids = [...groups.values()].flat()
    expect(ids).toHaveLength(20)
    for (const [insurerId, batch] of groups) {
      expect(batch.every((id) => exceptions.find((e) => e.id === id)?.insurerId === insurerId)).toBe(true)
      expect(assigneeFor(insurerId)).toBe(`Compliance desk, Insurer ${insurerId}`)
    }
    expect(INSURERS.map((i) => i.id)).toEqual(expect.arrayContaining([...groups.keys()]))
  })

  it('pages the table at 25 rows', () => {
    expect(PAGE_SIZE).toBe(25)
  })

  it('totals the return to 100,000 policies at the starting figure', () => {
    const t = returnTotals(returnRows({ exceptions }))
    expect(t.motorPolicies).toBe(100000)
    expect(t.cardsGenerated).toBe(100000 - UNCARDED_TOTAL)
    expect(t.coveragePct).toBe(93.4)
  })

  it('writes plain-English confirmations', () => {
    expect(confirmationText('backfill', 3, 1240, ['B'])).toBe('Cleared 1,240 policies in 3 batches')
    expect(confirmationText('remind', 1, 40, ['C'])).toBe('Reminder sent for 1 batch (40 policies)')
    expect(confirmationText('assign', 2, 90, ['D'])).toBe('Assigned 2 batches (90 policies) to Compliance desk, Insurer D')
  })
})
