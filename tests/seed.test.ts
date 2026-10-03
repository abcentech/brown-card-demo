import { describe, expect, it } from 'vitest'
import { EXCEPTION_COUNT, INSURERS, STARTING_COMPLIANCE_PCT, TOTAL_POLICIES, UNCARDED_TOTAL, seedExceptions } from '../src/shared/seed'
import { compliancePct, openUncarded } from '../src/shared/selectors'

describe('seed data', () => {
  const exceptions = seedExceptions()
  it('is deterministic', () => {
    expect(seedExceptions()).toEqual(exceptions)
  })
  it('has the agreed shape', () => {
    expect(exceptions).toHaveLength(EXCEPTION_COUNT)
    expect(INSURERS.reduce((a, i) => a + i.motorPolicies, 0)).toBe(TOTAL_POLICIES)
    expect(openUncarded({ exceptions })).toBe(UNCARDED_TOTAL)
  })
  it('starts at the agreed compliance figure', () => {
    expect(compliancePct({ exceptions })).toBe(STARTING_COMPLIANCE_PCT)
  })
  it('never gives an insurer more uncarded policies than it can plausibly have', () => {
    for (const ins of INSURERS) {
      expect(openUncarded({ exceptions }, ins.id)).toBeLessThan(ins.motorPolicies * 0.3)
    }
  })
  it('climbs when exceptions are resolved', () => {
    const half = exceptions.map((e, i) => (i % 2 === 0 ? { ...e, status: 'resolved' as const } : e))
    expect(compliancePct({ exceptions: half })).toBeGreaterThan(STARTING_COMPLIANCE_PCT)
  })
})
