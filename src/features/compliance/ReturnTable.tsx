import { useEffect, useState } from 'react'
import { platform } from '../../platform'
import type { ReturnRow } from '../../shared/types'
import { buildReturnCsv, fmtInt, fmtPct, lowestCoverage, returnTotals } from './helpers'

/**
 * Trigger a browser download of the quarterly return as CSV.
 * NOTE for the architect: the extras lane exports downloadReturnCsv() with the same columns from
 * src/features/extras/. This local version avoids a cross-lane import; swap it at merge time if preferred.
 */
export function downloadQuarterlyReturnCsv(rows: ReturnRow[], filename = 'quarterly_return.csv') {
  const blob = new Blob([buildReturnCsv(rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Preview of the NAICOM quarterly return from platform.getQuarterlyReturn(), refreshed on every store revision. */
export default function ReturnTable({ revision }: { revision: number }) {
  const [rows, setRows] = useState<ReturnRow[] | null>(null)
  const [stale, setStale] = useState(false)

  useEffect(() => {
    let cancelled = false
    setStale(true)
    platform
      .getQuarterlyReturn()
      .then((r) => {
        if (cancelled) return
        setRows(r)
        setStale(false)
      })
      .catch(() => {
        if (!cancelled) setStale(false)
      })
    return () => {
      cancelled = true
    }
  }, [revision])

  const totals = rows ? returnTotals(rows) : null
  const lowest = rows ? lowestCoverage(rows) : undefined

  return (
    <section className="rounded-xl border border-line bg-paper p-6" aria-labelledby="naicom-return">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 id="naicom-return" className="text-xl font-semibold">NAICOM quarterly return (preview)</h3>
          <p className="text-base text-muted">Generated from the platform. {stale ? 'Refreshing…' : 'Up to date with the exception list.'}</p>
        </div>
        <button
          type="button"
          disabled={!rows}
          onClick={() => rows && downloadQuarterlyReturnCsv(rows)}
          className="rounded-lg bg-ink px-4 py-2 text-base font-semibold text-paper disabled:opacity-40"
        >
          Download CSV
        </button>
      </div>

      <div className="mt-4 overflow-auto rounded-lg border border-line">
        <table className="w-full border-collapse text-base">
          <thead className="bg-stone text-left">
            <tr className="border-b border-line">
              <th className="px-3 py-2 font-semibold">Insurer</th>
              <th className="px-3 py-2 text-right font-semibold">Motor policies</th>
              <th className="px-3 py-2 text-right font-semibold">Cards generated</th>
              <th className="px-3 py-2 text-right font-semibold">Coverage</th>
            </tr>
          </thead>
          <tbody className={stale ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            {!rows && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-muted">Loading the return…</td>
              </tr>
            )}
            {rows?.map((r) => {
              const isLow = lowest?.insurerId === r.insurerId
              return (
                <tr key={r.insurerId} className={`border-b border-line/60 ${isLow ? 'text-clay' : ''}`}>
                  <td className="px-3 py-2 font-semibold">{r.insurerName}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtInt(r.motorPolicies)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtInt(r.cardsGenerated)}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{fmtPct(r.coveragePct)}</td>
                </tr>
              )
            })}
          </tbody>
          {totals && (
            <tfoot className="bg-stone font-semibold">
              <tr>
                <td className="px-3 py-2">All insurers</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmtInt(totals.motorPolicies)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmtInt(totals.cardsGenerated)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmtPct(totals.coveragePct)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  )
}
