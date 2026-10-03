import { useEffect, useState } from 'react'
import { platform } from '../../platform'
import type { ReturnRow } from '../../shared/types'
import { downloadReturnCsv } from '../extras/returnCsv'
import { fmtInt, fmtPct, lowestCoverage, returnTotals } from './helpers'

export interface LogEntry {
  id: number
  text: string
  time: string
}

interface Props {
  revision: number
  log: LogEntry[]
}

/** Preview of the NAICOM quarterly return from platform.getQuarterlyReturn(), refreshed on every store revision. */
export default function ReturnTable({ revision, log }: Props) {
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
    <section className="cc-card rounded-xl border border-line bg-paper p-6" aria-labelledby="naicom-return">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 id="naicom-return" className="text-xl font-semibold">NAICOM quarterly return (preview)</h3>
          <p className="text-base text-muted">Generated from the platform. {stale ? 'Refreshing…' : 'Up to date with the exception list.'}</p>
        </div>
        <button
          type="button"
          disabled={!rows}
          onClick={() => rows && void downloadReturnCsv(rows)}
          className="rounded-lg bg-ink px-4 py-2 text-base font-semibold text-paper hover:bg-ink2 disabled:opacity-40"
        >
          Download quarterly return
        </button>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="overflow-auto rounded-lg border border-line">
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

        {/* Session log: what this return now reflects. Component state only; cleared by Reset demo. */}
        <aside className="rounded-xl bg-stone/60 p-4" aria-labelledby="session-log">
          <h4 id="session-log" className="text-lg font-semibold">This session</h4>
          <p className="text-base text-muted">Actions already in the return above.</p>
          {log.length === 0 ? (
            <p className="mt-3 rounded-lg border border-dashed border-line px-3 py-3 text-base text-muted">No actions yet. Clear a batch and it is logged here.</p>
          ) : (
            <ol className="mt-3 space-y-2 text-base">
              {log.map((entry) => (
                <li key={entry.id} className="cc-rise flex items-start gap-2">
                  <span aria-hidden className="mt-2 inline-block h-2 w-2 shrink-0 rounded-full bg-mint" />
                  <span>
                    <span className="font-medium text-ink">{entry.text}</span>
                    <span className="text-muted"> · {entry.time}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>
    </section>
  )
}
