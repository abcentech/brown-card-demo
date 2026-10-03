import { useState } from 'react'
import { platform } from '../../platform'
import { STAGES, type Claim } from '../../shared/types'
import CorridorDiagram from './CorridorDiagram'
import { formatDate, formatFcfa, insurerName, readClock } from './claimLogic'
import StageTracker from './StageTracker'
import TurnaroundClock from './TurnaroundClock'

interface Props {
  claim: Claim
  now: number
  onClose: () => void
}

/** Shared frame for the side panel so the empty state and the claim view line up. */
export const PANEL_CLASS =
  'cl-card flex flex-col gap-5 rounded-xl border border-line bg-paper p-5 xl:sticky xl:top-14 xl:max-h-[calc(100vh-4.5rem)] xl:overflow-y-auto'

/** Side panel for one claim: actions first, then the stage, the corridor, the clock, documents and the Council. */
export default function HandshakePanel({ claim, now, onClose }: Props) {
  const [busy, setBusy] = useState(false)
  const [escalating, setEscalating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const atEnd = claim.stage >= 4
  const reading = readClock(claim, now)

  const advance = async () => {
    if (atEnd || busy) return
    setBusy(true)
    setError(null)
    try {
      await platform.advanceClaim(claim.ref)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not move the claim. Try again.')
    } finally {
      setBusy(false)
    }
  }

  // Escalation is a real platform call: the flag persists in the store and syncs to the other window.
  const escalate = async () => {
    if (claim.escalated || escalating) return
    setEscalating(true)
    setError(null)
    try {
      await platform.escalateClaim(claim.ref)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not escalate the claim. Try again.')
    } finally {
      setEscalating(false)
    }
  }

  return (
    <aside className={PANEL_CLASS} aria-label={`Claim ${claim.ref}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-medium text-muted">Claim</div>
          <h3 className="font-mono text-3xl font-bold text-brown">{claim.ref}</h3>
          {claim.incidentRef && <div className="text-base text-muted">From report {claim.incidentRef}</div>}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-line px-3 py-1.5 text-base text-muted hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          Close
        </button>
      </div>

      {/* Actions sit at the top so they stay in reach on a short screen. */}
      <div className="grid gap-2">
        <button
          type="button"
          onClick={advance}
          disabled={atEnd || busy}
          className="w-full rounded-xl bg-brown px-4 py-3 text-lg font-semibold text-paper shadow-[0_8px_20px_-10px_rgba(122,70,32,0.7)] hover:bg-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:cursor-not-allowed disabled:bg-line disabled:text-muted disabled:shadow-none"
        >
          {atEnd ? 'Claim paid. No further stage' : busy ? 'Moving...' : `Move to next stage: ${STAGES[claim.stage + 1]}`}
        </button>
        {!claim.escalated && (
          <button
            type="button"
            onClick={escalate}
            disabled={escalating}
            className="w-full rounded-xl border border-clay px-4 py-2 text-base font-semibold text-clay hover:bg-clay hover:text-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:cursor-wait disabled:opacity-60"
          >
            {escalating ? 'Escalating...' : 'Escalate to the Council of Bureaux'}
          </button>
        )}
        {error && (
          <p role="alert" className="text-base font-semibold text-clay">
            {error}
          </p>
        )}
      </div>

      <section aria-labelledby={`${claim.ref}-stage`}>
        <h4 id={`${claim.ref}-stage`} className="mb-3 text-base font-medium text-muted">
          Stage {claim.stage + 1} of {STAGES.length}: <span className="font-semibold text-ink">{STAGES[claim.stage]}</span>
        </h4>
        <StageTracker stage={claim.stage} labelled />
      </section>

      <section aria-label="Bureau handshake">
        <h4 className="mb-2 text-base font-medium text-muted">The corridor</h4>
        <CorridorDiagram claim={claim} />
      </section>

      <section className="rounded-xl bg-stone/60 p-4">
        <h4 className="mb-2 text-base font-medium text-muted">Turnaround clock</h4>
        <TurnaroundClock reading={reading} large />
        <div className="mt-2 text-base text-muted">Notified {formatDate(claim.notifiedAt)}</div>
      </section>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-base">
        <Field label="Insurer" value={insurerName(claim.insurerId)} />
        <Field label="Reserve" value={claim.reserveFcfa > 0 ? formatFcfa(claim.reserveFcfa) : 'Not yet set'} />
        <Field label="Card" value={claim.cardNumber} mono />
        <Field label="Injuries" value={claim.injuries ? 'Yes' : 'None reported'} tone={claim.injuries ? 'text-clay' : undefined} />
      </dl>

      <section>
        <h4 className="mb-2 text-base font-medium text-muted">Documents</h4>
        {claim.documents.length === 0 ? (
          <p className="text-base text-muted">No documents yet.</p>
        ) : (
          <ul className="space-y-1 text-base">
            {claim.documents.map((d, i) => (
              <li key={`${d}-${i}`} className="flex items-center gap-2 text-ink">
                <span aria-hidden className="inline-block h-2 w-2 rounded-full bg-mint" />
                {d}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-line bg-stone/60 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-base font-semibold text-ink">Council of Bureaux</div>
            <div className="text-base text-muted">
              {claim.escalated ? 'Escalated. The Council is following this claim.' : 'Not escalated.'}
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-base font-semibold ${
              claim.escalated ? 'bg-clay text-paper' : 'bg-paper text-muted'
            }`}
          >
            {claim.escalated ? 'Escalated' : 'Clear'}
          </span>
        </div>
      </section>
    </aside>
  )
}

/** Shown when nothing is selected: a prompt and the corridor in its neutral state. */
export function EmptyPanel() {
  return (
    <aside className={PANEL_CLASS} aria-label="No claim selected">
      <div>
        <div className="text-base font-medium text-muted">Handshake</div>
        <h3 className="text-2xl font-bold text-ink">Select a claim</h3>
        <p className="mt-1 text-base text-muted">
          Click a reference to see the two bureaux, the insurer's clock and the documents for that claim.
        </p>
      </div>
      <CorridorDiagram claim={null} />
      <p className="text-base text-muted">
        Every claim runs between the bureau that issued the card and the bureau where the accident happened. The insurer carries the clock.
      </p>
    </aside>
  )
}

function Field({ label, value, mono = false, tone }: { label: string; value: string; mono?: boolean; tone?: string }) {
  return (
    <div>
      <dt className="text-base text-muted">{label}</dt>
      <dd className={`font-semibold ${mono ? 'font-mono' : ''} ${tone ?? 'text-ink'}`}>{value}</dd>
    </div>
  )
}
