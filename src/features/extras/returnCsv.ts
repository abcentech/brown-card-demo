// NAICOM quarterly return as CSV. Pure builder (testable) plus a browser download helper.
import { platform } from '../../platform'
import type { ReturnRow } from '../../shared/types'

export const RETURN_CSV_FILENAME = 'quarterly_return.csv'
export const RETURN_CSV_HEADER = ['insurer_id', 'insurer_name', 'motor_policies', 'cards_generated', 'coverage_pct'] as const

/** Quote a cell when it contains a comma, quote or line break (RFC 4180). */
export function csvCell(value: string | number): string {
  const s = String(value)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Build the CSV text. Rows are written in the order given; coverage is kept to one decimal. */
export function buildReturnCsv(rows: ReturnRow[]): string {
  const lines = [RETURN_CSV_HEADER.join(',')]
  for (const r of rows) {
    lines.push(
      [r.insurerId, r.insurerName, r.motorPolicies, r.cardsGenerated, r.coveragePct.toFixed(1)].map(csvCell).join(','),
    )
  }
  return lines.join('\r\n') + '\r\n'
}

/** Download quarterly_return.csv. Fetches the rows from the platform when none are passed. */
export async function downloadReturnCsv(rows?: ReturnRow[]): Promise<string> {
  const data = rows ?? (await platform.getQuarterlyReturn())
  const csv = buildReturnCsv(data)
  if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return csv
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = RETURN_CSV_FILENAME
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return csv
}
