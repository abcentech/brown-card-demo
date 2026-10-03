import { useEffect, useMemo, useRef, useState } from 'react'
import { useDemo } from '../../state/store'
import { STAGES } from '../../shared/types'
import ClaimsTable from './ClaimsTable'
import HandshakePanel, { EmptyPanel } from './HandshakePanel'
import SummaryStrip from './SummaryStrip'
import { summarise } from './claimLogic'
import './claims.css'

const HIGHLIGHT_MS = 3000
const BANNER_MS = 5000

/** True when opened on its own at /?view=claims (no Shell, so no Shell banner). */
const isStandalone = () =>
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('view') === 'claims'
const TICK_MS = 30_000

interface Arrival {
  id: number
  ref: string
  stage: number
}

/** Claims dashboard stand-in. Reads the store through useDemo; writes only through the platform adapter. */
export default function ClaimsScreen() {
  const claims = useDemo((s) => s.claims)
  const revision = useDemo((s) => s.revision)

  // A clock that ticks every 30 s so the turnaround rings stay honest during a long session.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(id)
  }, [])

  // Live arrivals: the refs seen on the previous render. Any ref not in that set is new and gets the highlight.
  // The store already prepends new claims, so an arrival is at the top without sorting.
  const seenRefs = useRef<Set<string> | null>(null)
  const [freshRefs, setFreshRefs] = useState<ReadonlySet<string>>(() => new Set())
  const [arrival, setArrival] = useState<Arrival | null>(null)
  // Each arrival keeps its own fade timer; a second arrival inside 3 s must not cancel the first one's clean-up.
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  useEffect(() => {
    const current = new Set(claims.map((c) => c.ref))
    const seen = seenRefs.current
    seenRefs.current = current
    if (seen === null) return // first paint: nothing is "new"
    const arrived = [...current].filter((ref) => !seen.has(ref))
    if (arrived.length === 0) return
    setFreshRefs((prev) => new Set([...prev, ...arrived]))
    setNow(Date.now())
    const first = claims.find((c) => c.ref === arrived[0])
    const id = Date.now()
    if (first) setArrival({ id, ref: first.ref, stage: first.stage })
    const fade = setTimeout(() => {
      timers.current.delete(fade)
      setFreshRefs((prev) => {
        const next = new Set(prev)
        arrived.forEach((r) => next.delete(r))
        return next
      })
    }, HIGHLIGHT_MS)
    const banner = setTimeout(() => {
      timers.current.delete(banner)
      setArrival((cur) => (cur?.id === id ? null : cur))
    }, BANNER_MS)
    timers.current.add(fade)
    timers.current.add(banner)
  }, [claims, revision])

  // Selection tolerates a vanished ref (for example after Reset demo): the panel simply shows the prompt.
  const [selectedRef, setSelectedRef] = useState<string | null>(null)
  const selected = useMemo(() => claims.find((c) => c.ref === selectedRef) ?? null, [claims, selectedRef])

  const summary = useMemo(() => summarise(claims, now), [claims, now])

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 text-base text-ink">
      {isStandalone() && (
        <div className="rounded-lg bg-gold px-4 py-2 text-center text-base font-semibold text-ink">
          Illustrative data · Demo of the operators' platform · Not a live system
        </div>
      )}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="inline-block rounded-full border border-gold bg-gold/15 px-3 py-1 text-base font-semibold text-brown">
            Stand-in for the operators' claims system
          </div>
          <h2 className="mt-2 text-4xl font-bold leading-tight">Claims dashboard</h2>
          <p className="mt-1 text-lg text-muted">
            Claims on cards issued by the Nigeria Bureau, handled by the bureau where the accident happened.
          </p>
        </div>
        <div className="flex items-center gap-2 text-base text-muted" aria-live="polite">
          <span aria-hidden className="relative inline-flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full rounded-full bg-mint opacity-60 motion-safe:animate-ping" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-mint" />
          </span>
          Live feed · update {revision}
          {freshRefs.size > 0 && <span className="font-semibold text-brown">· new: {[...freshRefs].join(', ')}</span>}
        </div>
      </header>

      <SummaryStrip summary={summary} />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_400px] 2xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="min-w-0 space-y-3">
          {arrival && (
            <div
              key={arrival.id}
              className="claim-banner flex items-center gap-3 rounded-xl bg-mint px-4 py-2.5 text-base font-semibold text-paper shadow-[0_10px_24px_-14px_rgba(47,107,74,0.8)]"
              aria-live="polite"
            >
              <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full bg-paper" />
              New report from the crossing · <span className="font-mono">{arrival.ref}</span> · stage {STAGES[arrival.stage] ?? 'Notified'}
            </div>
          )}
          <ClaimsTable
            claims={claims}
            now={now}
            selectedRef={selected?.ref ?? null}
            freshRefs={freshRefs}
            onSelect={(ref) => setSelectedRef((cur) => (cur === ref ? null : ref))}
          />
        </div>
        {selected ? (
          <HandshakePanel key={selected.ref} claim={selected} now={now} onClose={() => setSelectedRef(null)} />
        ) : (
          <EmptyPanel />
        )}
      </div>
    </div>
  )
}
