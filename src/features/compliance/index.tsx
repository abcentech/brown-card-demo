import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDemo } from '../../state/store'
import { TOTAL_POLICIES } from '../../shared/seed'
import { compliancePct, openUncarded, returnRows } from '../../shared/selectors'
import Headline, { DeltaChip } from './Headline'
import { GapPanel, InsurerBars } from './Bars'
import ExceptionList, { type ActionSummary, type InsurerPick } from './ExceptionList'
import ReturnTable, { type LogEntry } from './ReturnTable'
import { byCause, byChannel, clockText, fmtPct, isOpen, sessionLogText } from './helpers'
import { useTweened } from './hooks'
import './compliance.css'

/** True when the screen is opened on its own at /?view=compliance (no Shell, so no Shell banner). */
function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('view') === 'compliance'
}

interface Toast {
  id: number
  text: string
  success: boolean
}

function Tick() {
  return (
    <svg viewBox="0 0 28 28" className="h-7 w-7 shrink-0" aria-hidden focusable="false">
      <circle cx="14" cy="14" r="12" fill="none" className="cc-tick-ring stroke-mint" strokeWidth="2.5" />
      <path d="M8 14.5l4 4 8-9" fill="none" className="cc-tick-check stroke-mint" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Slim live figure shown while the gauge is scrolled out of view, so the climb is seen from the exception list. */
function MiniHeadline({ pct }: { pct: number }) {
  const shown = useTweened(pct)
  return (
    <div className="cc-mini-in pointer-events-none fixed left-1/2 top-[3.25rem] z-20 flex -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-full bg-ink px-4 py-2 text-paper shadow-[0_18px_40px_-18px_rgba(18,38,30,0.8)]">
      <span className="text-base font-medium text-stone">Carrying a card</span>
      <span className="text-2xl font-semibold tabular-nums">{fmtPct(shown)}</span>
      <DeltaChip pct={pct} compact />
    </div>
  )
}

/** Compliance console: the "last 5%" story. Reads the store, acts only through the platform adapter. */
export default function ComplianceScreen() {
  const exceptions = useDemo((s) => s.exceptions)
  const revision = useDemo((s) => s.revision)
  const resetCount = useDemo((s) => s.resetCount)

  const pct = compliancePct({ exceptions })
  const open = openUncarded({ exceptions })
  const openBatches = exceptions.filter(isOpen).length
  const rows = useMemo(() => returnRows({ exceptions }), [exceptions])
  const channels = useMemo(() => byChannel(exceptions), [exceptions])
  const causes = useMemo(() => byCause(exceptions), [exceptions])

  // Session log: component state, cleared when the demo is reset (resetCount) or the store goes backwards.
  const [log, setLog] = useState<LogEntry[]>([])
  const seenReset = useRef(resetCount)
  const seenRevision = useRef(revision)
  useEffect(() => {
    if (resetCount !== seenReset.current || revision < seenRevision.current) setLog([])
    seenReset.current = resetCount
    seenRevision.current = revision
  }, [resetCount, revision])

  const [toast, setToast] = useState<Toast | null>(null)
  const confirm = useCallback((text: string, summary?: ActionSummary) => {
    setToast({ id: Date.now(), text, success: !!summary })
    if (summary) {
      setLog((prev) => [{ id: Date.now(), text: sessionLogText(summary.action, summary.batches, summary.policies), time: clockText(new Date()) }, ...prev].slice(0, 8))
    }
  }, [])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3600)
    return () => clearTimeout(t)
  }, [toast])

  // Insurer bar clicks drive the exception list; the list reports its own insurer filter back.
  const [pick, setPick] = useState<InsurerPick | null>(null)
  const [activeInsurerId, setActiveInsurerId] = useState('')
  const pickInsurer = useCallback((insurerId: string) => {
    setActiveInsurerId((cur) => {
      const next = cur === insurerId ? '' : insurerId
      setPick({ insurerId: next, seq: Date.now() })
      return next
    })
  }, [])

  // Mini headline when the hero gauge is out of view.
  const heroRef = useRef<HTMLDivElement>(null)
  const [heroVisible, setHeroVisible] = useState(true)
  useEffect(() => {
    const el = heroRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => setHeroVisible(entry.isIntersecting), { threshold: 0.1 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const standalone = isStandalone()

  return (
    <div className="mx-auto max-w-7xl space-y-5 text-base text-ink">
      {standalone && (
        <div className="rounded-lg bg-gold px-4 py-2 text-center text-base font-semibold text-ink">
          Illustrative data · Demo of the operators' platform · Not a live system
        </div>
      )}

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-semibold">Compliance console</h2>
          <p className="text-lg text-muted">Nigeria Bureau · motor policies and Brown Card numbers · Insurers A to L (anonymised)</p>
        </div>
        <p className="text-base text-muted">Store revision {revision}</p>
      </header>

      <div ref={heroRef}>
        <Headline pct={pct} openPolicies={open} totalPolicies={TOTAL_POLICIES} openBatches={openBatches} />
      </div>

      <InsurerBars rows={rows} activeInsurerId={activeInsurerId} onPick={pickInsurer} />

      <GapPanel channels={channels} causes={causes} />

      <ExceptionList exceptions={exceptions} onConfirm={confirm} insurerPick={pick} onInsurerFilterChange={setActiveInsurerId} />

      <ReturnTable revision={revision} log={log} />

      <p className="text-base text-muted">
        Causes shown here are working hypotheses. They will be measured against the real baseline from the operators' platform before any target is set.
      </p>

      {!heroVisible && <MiniHeadline pct={pct} />}

      {toast && (
        <div
          key={toast.id}
          role="status"
          aria-live="polite"
          className="cc-toast fixed bottom-6 left-1/2 z-30 flex items-center gap-3 rounded-xl bg-ink px-6 py-3 text-lg font-semibold text-paper shadow-[0_24px_50px_-20px_rgba(18,38,30,0.8)]"
        >
          {toast.success && <Tick />}
          {toast.text}
        </div>
      )}
    </div>
  )
}
