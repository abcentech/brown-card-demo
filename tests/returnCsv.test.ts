import { describe, expect, it } from 'vitest'
import { buildReturnCsv, csvCell, RETURN_CSV_HEADER } from '../src/features/extras/returnCsv'
import { returnRows } from '../src/shared/selectors'
import { INSURERS, seedExceptions, TOTAL_POLICIES } from '../src/shared/seed'
import type { ReturnRow } from '../src/shared/types'

const sample: ReturnRow[] = [
  { insurerId: 'A', insurerName: 'Insurer A', motorPolicies: 14000, cardsGenerated: 13020, coveragePct: 93 },
  { insurerId: 'B', insurerName: 'Insurer B', motorPolicies: 12000, cardsGenerated: 11244, coveragePct: 93.7 },
]

describe('buildReturnCsv', () => {
  it('writes the header in the agreed column order', () => {
    const [header] = buildReturnCsv(sample).split('\r\n')
    expect(header).toBe('insurer_id,insurer_name,motor_policies,cards_generated,coverage_pct')
    expect(header.split(',')).toEqual([...RETURN_CSV_HEADER])
  })

  it('writes one line per row with coverage to one decimal, CRLF-terminated', () => {
    const csv = buildReturnCsv(sample)
    const lines = csv.split('\r\n')
    expect(lines).toHaveLength(sample.length + 2) // header + rows + trailing empty
    expect(lines[1]).toBe('A,Insurer A,14000,13020,93.0')
    expect(lines[2]).toBe('B,Insurer B,12000,11244,93.7')
    expect(csv.endsWith('\r\n')).toBe(true)
  })

  it('handles an empty list', () => {
    expect(buildReturnCsv([])).toBe('insurer_id,insurer_name,motor_policies,cards_generated,coverage_pct\r\n')
  })

  it('quotes cells with commas or quotes', () => {
    expect(csvCell('Insurer "X", Ltd')).toBe('"Insurer ""X"", Ltd"')
    expect(csvCell(42)).toBe('42')
    const csv = buildReturnCsv([{ ...sample[0], insurerName: 'A, co' }])
    expect(csv.split('\r\n')[1]).toBe('A,"A, co",14000,13020,93.0')
  })

  it('covers all twelve anonymised insurers from the seed and no real names', () => {
    const csv = buildReturnCsv(returnRows({ exceptions: seedExceptions() }))
    const lines = csv.trim().split('\r\n')
    expect(lines).toHaveLength(INSURERS.length + 1)
    for (const ins of INSURERS) expect(csv).toContain(`${ins.id},Insurer ${ins.id},`)
    const totalPolicies = lines.slice(1).reduce((a, l) => a + Number(l.split(',')[2]), 0)
    expect(totalPolicies).toBe(TOTAL_POLICIES)
  })
})
