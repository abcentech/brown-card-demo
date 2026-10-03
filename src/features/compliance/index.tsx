import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDemo } from '../../state/store'
import { TOTAL_POLICIES } from '../../shared/seed'
import { compliancePct, openUncarded, returnRows } from '../../shared/selectors'
import Headline from './Headline'
import { GroupBars, InsurerBars } from './Bars'
import ExceptionList from './ExceptionList'
import ReturnTable from './ReturnTable'
import { byCause, byChannel, isOpen } from './helpers'

/** True when the screen is opened on its own at /?view=compliance (no Shell, so no Shell banner). */
function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('view') === 'compliance'
}

interface Toast {
  id: number
  text: string
}

/** Compliance console: the "last 5%" story. Reads the store, acts only through the platform adapter. */
export default function ComplianceScreen() {
  const exceptions = useDemo((s) => s.exceptions)
  const revision = useDemo((s) => s.revision)

  const pct = compliancePct({ exceptions })
  const open = openUncarded({ exceptions })
  const openBatches = exceptions.filter(isOpen).length
  const rows = useMemo(() => returnRows({ exceptions }), [exceptions])
  const channels = useMemo(() => byChannel(exceptions), [exceptions])
  const causes = useMemo(() => byCause(exceptions), [exceptions])

  const [toast, setToast] = useState<Toast | null>(null)
  const confirm = useCallback((text: string) => setToast({ id: Date.now(), text }), [])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3600)
    return () => clearTimeout(t)
  }, [toast])

  const standalone = isStandalone()

  return (
    <div className="mx-auto max-w-7xl space-y-5 text-base text-ink">
      {/* Keyframes for the confirmation; kept local because src/index.css is frozen. */}
      <style>{`
        @keyframes bcd-toast { 0% { opacity: 0; transform: translateY(8px) } 10% { opacity: 1; transform: none } 80% { opacity: 1 } 100% { opacity: 0 } }
      `}</style>

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

      <Headline pct={pct} openPolicies={open} totalPolicies={TOTAL_POLICIES} openBatches={openBatches} />

      <InsurerBars rows={rows} />

      <div className="grid gap-5 lg:grid-cols-2">
        <GroupBars id="by-channel" title="Where the gap sits: by channel" buckets={channels} note="Channel is how the policy was sold." />
        <GroupBars
          id="by-cause"
          title="Why the card is missing: by cause"
          buckets={causes}
          note="Causes are working hypotheses, to be measured against the real baseline once the operators' data is connected."
        />
      </div>

      <ExceptionList exceptions={exceptions} onConfirm={confirm} />

      <ReturnTable revision={revision} />

      <p className="text-base text-muted">
        Causes shown here are working hypotheses. They will be measured against the real baseline from the operators' platform before any target is set.
      </p>

      {toast && (
        <div
          key={toast.id}
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-xl bg-ink px-6 py-3 text-lg font-semibold text-paper shadow-lg"
          style={{ animation: 'bcd-toast 3.6s ease forwards' }}
        >
          {toast.text}
        </div>
      )}
    </div>
  )
}
