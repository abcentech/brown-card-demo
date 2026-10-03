import { describe, expect, it } from 'vitest'
import { INSURERS, UNCARDED_TOTAL, seedExceptions } from '../src/shared/seed'
import { returnRows } from '../src/shared/selectors'
import {
  EMPTY_FILTER, PAGE_SIZE, applyFilter, assigneeFor, byCause, byChannel, confirmationText, groupByInsurer,
  lowestCoverage, returnTotals, scalePosition,
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
