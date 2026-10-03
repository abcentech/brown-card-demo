import { describe, expect, it } from 'vitest'
import { mockPlatform } from '../src/platform/platform.mock'
import { useDemo } from '../src/state/store'
import { compliancePct } from '../src/shared/selectors'
import { SAMPLE_BAD_CHECK, SAMPLE_COVERED, SAMPLE_LAPSED, SAMPLE_UNKNOWN, STARTING_COMPLIANCE_PCT } from '../src/shared/seed'

describe('mock platform', () => {
  it('verifies the four outcomes', async () => {
    expect((await mockPlatform.verifyCard(SAMPLE_COVERED)).status).toBe('covered')
    expect((await mockPlatform.verifyCard(SAMPLE_LAPSED)).status).toBe('lapsed')
    expect((await mockPlatform.verifyCard(SAMPLE_UNKNOWN)).status).toBe('not_found')
    expect((await mockPlatform.verifyCard(SAMPLE_BAD_CHECK)).status).toBe('invalid')
  })

  it('creates a claim from an incident report, in the store', async () => {
    useDemo.getState().reset()
    const before = useDemo.getState().claims.length
    const r = await mockPlatform.createIncident({
      cardNumber: SAMPLE_COVERED, crossing: 'Seme–Krake', country: 'Benin', parties: 2, injuries: true, narrative: 'test', photoCount: 1,
    })
    const claims = useDemo.getState().claims
    expect(claims).toHaveLength(before + 1)
    expect(claims[0].ref).toBe(r.claimRef)
    expect(claims[0].stage).toBe(0) // every new record starts as Notified (CONTRACT.md)
    expect(claims[0].source).toBe('reporter')
  })

  it('moves the compliance figure when exceptions are back-filled, and reset restores it', async () => {
    useDemo.getState().reset()
    const ids = useDemo.getState().exceptions.slice(0, 40).map((e) => e.id)
    const cleared = await mockPlatform.applyExceptionAction(ids, 'backfill')
    expect(cleared).toBeGreaterThan(0)
    expect(compliancePct({ exceptions: useDemo.getState().exceptions })).toBeGreaterThan(STARTING_COMPLIANCE_PCT)
    useDemo.getState().reset()
    expect(compliancePct({ exceptions: useDemo.getState().exceptions })).toBe(STARTING_COMPLIANCE_PCT)
  })

  it('issues a policy and the new card then verifies as covered', async () => {
    const issued = await mockPlatform.issuePolicy({ holder: 'Test', vehicle: 'XYZ-1', insurerId: 'B', cover: 'third_party', termMonths: 12 })
    expect((await mockPlatform.verifyCard(issued.cardNumber)).status).toBe('covered')
  })
})
