import type { DemoData } from '../state/store'
import { INSURERS, TOTAL_POLICIES } from './seed'
import type { ReturnRow } from './types'

export function openUncarded(d: Pick<DemoData, 'exceptions'>, insurerId?: string): number {
  return d.exceptions
    .filter((e) => e.status !== 'resolved' && (!insurerId || e.insurerId === insurerId))
    .reduce((a, e) => a + e.policiesAffected, 0)
}

/** Share of motor policies carrying a valid card number, as a percentage with one decimal. */
export function compliancePct(d: Pick<DemoData, 'exceptions'>): number {
  return Math.round(((TOTAL_POLICIES - openUncarded(d)) / TOTAL_POLICIES) * 1000) / 10
}

export function returnRows(d: Pick<DemoData, 'exceptions'>): ReturnRow[] {
  return INSURERS.map((ins) => {
    const cards = ins.motorPolicies - openUncarded(d, ins.id)
    return {
      insurerId: ins.id,
      insurerName: ins.name,
      motorPolicies: ins.motorPolicies,
      cardsGenerated: cards,
      coveragePct: Math.round((cards / ins.motorPolicies) * 1000) / 10,
    }
  })
}
