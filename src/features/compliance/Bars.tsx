import type { ReturnRow } from '../../shared/types'
import { fmtInt, fmtPct, lowestCoverage, type Bucket } from './helpers'

const BAR_TRANSITION = 'width 700ms cubic-bezier(.2,.8,.2,1)'

/** Coverage per insurer (A to L). The lowest coverage is highlighted in clay. */
export function InsurerBars({ rows }: { rows: ReturnRow[] }) {
  const lowest = lowestCoverage(rows)
  // Zoom the scale so differences between insurers stay visible on a projector.
  const floor = Math.max(0, Math.floor(Math.min(...rows.map((r) => r.coveragePct)) / 5) * 5 - 5)
  const span = 100 - floor
  return (
    <section className="rounded-xl border border-line bg-paper p-6" aria-labelledby="by-insurer">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 id="by-insurer" className="text-xl font-semibold">Coverage by insurer</h3>
        {lowest && (
          <p className="text-base text-clay">
            Lowest: {lowest.insurerName} at {fmtPct(lowest.coveragePct)} ({fmtInt(lowest.motorPolicies - lowest.cardsGenerated)} policies without a card)
          </p>
        )}
      </div>
      <ol className="mt-4 space-y-2">
        {rows.map((r) => {
          const isLow = lowest?.insurerId === r.insurerId
          const w = Math.max(1, ((r.coveragePct - floor) / span) * 100)
          return (
            <li key={r.insurerId} className="grid grid-cols-[7.5rem_1fr_5rem] items-center gap-3 text-base">
              <span className={`font-semibold ${isLow ? 'text-clay' : ''}`}>{r.insurerName}</span>
              <div className="relative h-6 overflow-hidden rounded bg-stone" role="img" aria-label={`${r.insurerName} ${fmtPct(r.coveragePct)}`}>
                <div
                  className={`h-full rounded ${isLow ? 'bg-clay' : r.coveragePct >= 95 ? 'bg-mint' : 'bg-brown'}`}
                  style={{ width: `${w}%`, transition: BAR_TRANSITION }}
                />
              </div>
              <span className={`text-right font-semibold tabular-nums ${isLow ? 'text-clay' : ''}`}>{fmtPct(r.coveragePct)}</span>
            </li>
          )
        })}
      </ol>
      <p className="mt-3 text-base text-muted">Scale starts at {floor}% so the gaps stay visible. Target: 90 to 95%.</p>
    </section>
  )
}

interface GroupProps<K extends string> {
  title: string
  id: string
  buckets: Bucket<K>[]
  note?: string
}

/** Horizontal bars for a grouping of open uncarded policies (by channel or by cause). */
export function GroupBars<K extends string>({ title, id, buckets, note }: GroupProps<K>) {
  const total = buckets.reduce((a, b) => a + b.policies, 0)
  const max = Math.max(1, ...buckets.map((b) => b.policies))
  return (
    <section className="rounded-xl border border-line bg-paper p-6" aria-labelledby={id}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 id={id} className="text-xl font-semibold">{title}</h3>
        <p className="text-base text-muted">{fmtInt(total)} policies open</p>
      </div>
      <ol className="mt-4 space-y-3">
        {buckets.map((b) => {
          const share = total ? Math.round((b.policies / total) * 100) : 0
          return (
            <li key={b.key} className="text-base">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">{b.label}</span>
                <span className="tabular-nums">
                  <span className="font-semibold">{fmtInt(b.policies)}</span>
                  <span className="text-muted"> policies · {share}% · {b.batches} {b.batches === 1 ? 'batch' : 'batches'}</span>
                </span>
              </div>
              <div className="mt-1 h-5 overflow-hidden rounded bg-stone" role="img" aria-label={`${b.label}: ${fmtInt(b.policies)} policies`}>
                <div className="h-full rounded bg-brown" style={{ width: `${(b.policies / max) * 100}%`, transition: BAR_TRANSITION }} />
              </div>
            </li>
          )
        })}
      </ol>
      {note && <p className="mt-3 text-base text-muted">{note}</p>}
    </section>
  )
}
