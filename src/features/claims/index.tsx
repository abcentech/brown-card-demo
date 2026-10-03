import { useEffect, useMemo, useRef, useState } from 'react'
import { useDemo } from '../../state/store'
import ClaimsTable from './ClaimsTable'
import HandshakePanel from './HandshakePanel'
import SummaryStrip from './SummaryStrip'
import { summarise } from './claimLogic'
import './claims.css'

const HIGHLIGHT_MS = 3000

/** True when opened on its own at /?view=claims (no Shell, so no Shell banner). */
const isStandalone = () =>
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('view') === 'claims'
const TICK_MS = 30_000

/** Claims dashboard stand-in. Reads the store through useDemo; writes only through the platform adapter. */
export default function ClaimsScreen() {
  const claims = useDemo((s) => s.claims)
  const revision = useDemo((s) => s.revision)

  // A clock that ticks every 30 s so the turnaround bars stay honest during a long session.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(id)
  }, [])

  // Live arrivals: the refs seen on the previous render. Any ref not in that set is new and gets the highlight.
  // The store already prepends new claims, so an arrival is at the top without sorting.
  const seenRefs = useRef<Set<string> | null>(null)
  const [freshRefs, setFreshRefs] = useState<ReadonlySet<string>>(() => new Set())
  useEffect(() => {
    const current = new Set(claims.map((c) => c.ref))
    const seen = seenRefs.current
    seenRefs.current = current
    if (seen === null) return // first paint: nothing is "new"
    const arrived = [...current].filter((ref) => !seen.has(ref))
    if (arrived.length === 0) return
    setFreshRefs((prev) => new Set([...prev, ...arrived]))
    setNow(Date.now())
    const timer = setTimeout(() => {
      setFreshRefs((prev) => {
        const next = new Set(prev)
        arrived.forEach((r) => next.delete(r))
        return next
      })
    }, HIGHLIGHT_MS)
    return () => clearTimeout(timer)
  }, [claims, revision])

  // Selection tolerates a vanished ref (for example after Reset demo): the panel simply closes.
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
          <span aria-hidden className="inline-block h-3 w-3 rounded-full bg-mint" />
          Live feed · update {revision}
          {freshRefs.size > 0 && <span className="font-semibold text-brown">· new: {[...freshRefs].join(', ')}</span>}
        </div>
      </header>

      <SummaryStrip summary={summary} />

      <div className={`grid items-start gap-5 ${selected ? 'xl:grid-cols-[minmax(0,1fr)_420px]' : ''}`}>
        <ClaimsTable
          claims={claims}
          now={now}
          selectedRef={selected?.ref ?? null}
          freshRefs={freshRefs}
          onSelect={(ref) => setSelectedRef((cur) => (cur === ref ? null : ref))}
        />
        {selected && (
          <HandshakePanel
            key={selected.ref}
            claim={selected}
            now={now}
            onClose={() => setSelectedRef(null)}
          />
        )}
      </div>
    </div>
  )
}
