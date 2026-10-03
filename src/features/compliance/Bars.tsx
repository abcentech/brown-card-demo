import { useEffect, useState } from 'react'
import type { Cause, Channel, ReturnRow } from '../../shared/types'
import { causeSentence, channelSentence, fmtInt, fmtPct, lowestCoverage, type Bucket } from './helpers'
import { useMounted } from './hooks'

const STAGGER_MS = 40

/** Delay each bar on first paint only; after that, changes move together. */
function useStagger(count: number): (i: number) => string {
  const mounted = useMounted()
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setSettled(true), count * STAGGER_MS + 800)
    return () => clearTimeout(t)
  }, [count])
  return (i) => (mounted && !settled ? `${i * STAGGER_MS}ms` : '0ms')
}

interface InsurerProps {
  rows: ReturnRow[]
  activeInsurerId: string
  onPick: (insurerId: string) => void
}

/** Coverage per insurer (A to L). The lowest gets a clay marker and "Start here"; a click filters the exception list. */
export function InsurerBars({ rows, activeInsurerId, onPick }: InsurerProps) {
  const lowest = lowestCoverage(rows)
  const mounted = useMounted()
  const delay = useStagger(rows.length)
  // Zoom the scale so differences between insurers stay visible on a projector.
  const floor = Math.max(0, Math.floor(Math.min(...rows.map((r) => r.coveragePct)) / 5) * 5 - 5)
  const span = 100 - floor
  return (
    <section className="cc-card rounded-xl border border-line bg-paper p-6" aria-labelledby="by-insurer">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 id="by-insurer" className="text-xl font-semibold">Coverage by insurer</h3>
        <p className="text-base text-muted">Click an insurer to pick out its open batches below.</p>
      </div>
      <ol className="mt-4 space-y-1">
        {rows.map((r, i) => {
          const isLow = lowest?.insurerId === r.insurerId
          const active = activeInsurerId === r.insurerId
          const w = mounted ? Math.max(1, ((r.coveragePct - floor) / span) * 100) : 0
          const barCls = isLow ? 'bg-clay' : r.coveragePct >= 95 ? 'bg-mint' : 'bg-brown'
          return (
            <li key={r.insurerId}>
              <button
                type="button"
                onClick={() => onPick(r.insurerId)}
                aria-pressed={active}
                aria-label={`${r.insurerName}, ${fmtPct(r.coveragePct)} coverage${isLow ? ', lowest. Start here' : ''}`}
                className={`grid w-full grid-cols-[8.5rem_1fr_5.5rem] items-center gap-3 rounded-lg px-2 py-1.5 text-left text-base transition-colors hover:bg-stone/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                  active ? 'bg-stone shadow-[inset_3px_0_0_var(--color-brown)]' : ''
                }`}
              >
                <span className={`flex items-center gap-2 font-semibold ${isLow ? 'text-clay' : ''}`}>
                  {isLow && <span aria-hidden className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-clay" />}
                  {r.insurerName}
                </span>
                <span className="relative block h-6 overflow-hidden rounded-md bg-stone" aria-hidden>
                  <span
                    className={`cc-bar block h-full rounded-md ${barCls}`}
                    style={{ width: `${w}%`, transitionDelay: delay(i) }}
                  />
                  {isLow && (
                    <span className="cc-rise absolute inset-y-0 right-2 flex items-center text-base font-semibold text-clay">Start here</span>
                  )}
                </span>
                <span className={`text-right font-semibold tabular-nums ${isLow ? 'text-clay' : ''}`}>{fmtPct(r.coveragePct)}</span>
              </button>
            </li>
          )
        })}
      </ol>
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3 text-base text-muted">
        <p>Scale starts at {floor}% so the gaps stay visible. Target: 90 to 95%.</p>
        {lowest && (
          <p className="text-clay">
            Lowest: {lowest.insurerName} at {fmtPct(lowest.coveragePct)} ({fmtInt(lowest.motorPolicies - lowest.cardsGenerated)} policies without a card)
          </p>
        )}
      </div>
    </section>
  )
}

interface GapProps {
  channels: Bucket<Channel>[]
  causes: Bucket<Cause>[]
}

function BarSet<K extends string>({
  id,
  title,
  buckets,
  max,
  sentence,
  delay,
  offset,
  mounted,
}: {
  id: string
  title: string
  buckets: Bucket<K>[]
  max: number
  sentence: string
  delay: (i: number) => string
  offset: number
  mounted: boolean
}) {
  const total = buckets.reduce((a, b) => a + b.policies, 0)
  return (
    <div aria-labelledby={id} role="group">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h4 id={id} className="text-lg font-semibold">{title}</h4>
        <p className="text-base text-muted">{fmtInt(total)} policies open</p>
      </div>
      <ol className="mt-3 space-y-2.5">
        {buckets.map((b, i) => {
          const share = total ? Math.round((b.policies / total) * 100) : 0
          const w = mounted ? (b.policies / max) * 100 : 0
          return (
            <li key={b.key} className="text-base">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">{b.label}</span>
                <span className="tabular-nums">
                  <span className="font-semibold">{fmtInt(b.policies)}</span>
                  <span className="text-muted"> · {share}% · {b.batches} {b.batches === 1 ? 'batch' : 'batches'}</span>
                </span>
              </div>
              <div className="mt-1 h-5 overflow-hidden rounded-md bg-stone" role="img" aria-label={`${b.label}: ${fmtInt(b.policies)} policies`}>
                <div className="cc-bar h-full rounded-md bg-brown" style={{ width: `${w}%`, transitionDelay: delay(offset + i) }} />
              </div>
            </li>
          )
        })}
      </ol>
      <p className="mt-3 rounded-lg bg-stone/60 px-3 py-2 text-base font-medium text-ink">{sentence}</p>
    </div>
  )
}

/** Where the gap sits: channel and cause side by side on one shared scale, each with a plain sentence. */
export function GapPanel({ channels, causes }: GapProps) {
  const mounted = useMounted()
  const delay = useStagger(channels.length + causes.length)
  const max = Math.max(1, ...channels.map((b) => b.policies), ...causes.map((b) => b.policies))
  return (
    <section className="cc-card rounded-xl border border-line bg-paper p-6" aria-labelledby="gap-panel">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 id="gap-panel" className="text-xl font-semibold">Where the gap sits</h3>
        <p className="text-base text-muted">Open policies without a card. Both sets share one scale.</p>
      </div>
      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        <BarSet id="by-channel" title="By channel" buckets={channels} max={max} sentence={channelSentence(channels)} delay={delay} offset={0} mounted={mounted} />
        <BarSet id="by-cause" title="By cause" buckets={causes} max={max} sentence={causeSentence(causes)} delay={delay} offset={channels.length} mounted={mounted} />
      </div>
      <p className="mt-4 text-base text-muted">
        Channel is how the policy was sold. Causes are working hypotheses, to be measured against the real baseline once the operators' data is connected.
      </p>
    </section>
  )
}
