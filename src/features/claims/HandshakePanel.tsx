import { useState } from 'react'
import { platform } from '../../platform'
import { STAGES, type Claim } from '../../shared/types'
import { formatDate, formatFcfa, HANDSHAKE, insurerName, readClock } from './claimLogic'
import StageTracker from './StageTracker'
import TurnaroundClock from './TurnaroundClock'

interface Props {
  claim: Claim
  now: number
  escalationRequested: boolean
  onToggleEscalation: () => void
  onClose: () => void
}

/** Side panel for one claim: the two bureaux, documents, escalation and the stage control. */
export default function HandshakePanel({ claim, now, escalationRequested, onToggleEscalation, onClose }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const status = HANDSHAKE[claim.stage]
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

  return (
    <aside className="flex flex-col gap-5 rounded-xl border border-line bg-paper p-5" aria-label={`Claim ${claim.ref}`}>
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

      <section aria-labelledby={`${claim.ref}-stage`}>
        <h4 id={`${claim.ref}-stage`} className="mb-2 text-base font-medium text-muted">
          Stage {claim.stage + 1} of {STAGES.length}: <span className="font-semibold text-ink">{STAGES[claim.stage]}</span>
        </h4>
        <StageTracker stage={claim.stage} labelled />
      </section>

      <section>
        <h4 className="mb-2 text-base font-medium text-muted">Turnaround clock</h4>
        <TurnaroundClock reading={reading} large />
        <div className="mt-1 text-base text-muted">Notified {formatDate(claim.notifiedAt)}</div>
      </section>

      <section aria-label="Bureau handshake" className="grid grid-cols-2 gap-3">
        <BureauCard title="Issuing bureau" name={claim.issuingBureau} status={status.issuing} />
        <BureauCard title="Handling bureau" name={claim.handlingBureau} status={status.handling} />
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

      <section className="rounded-lg border border-line bg-stone/60 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-base font-semibold text-ink">Council of Bureaux</div>
            <div className="text-base text-muted">
              {claim.escalated
                ? 'Escalated. The Council is following this claim.'
                : escalationRequested
                  ? 'Escalation requested (demo note, not sent).'
                  : 'Not escalated.'}
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-base font-semibold ${
              claim.escalated || escalationRequested ? 'bg-clay text-paper' : 'bg-paper text-muted'
            }`}
          >
            {claim.escalated ? 'Escalated' : escalationRequested ? 'Requested' : 'Clear'}
          </span>
        </div>
        {!claim.escalated && (
          <button
            type="button"
            onClick={onToggleEscalation}
            className="mt-3 w-full rounded-lg border border-clay px-4 py-2 text-base font-semibold text-clay hover:bg-clay hover:text-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            {escalationRequested ? 'Withdraw escalation request' : 'Request escalation to the Council'}
          </button>
        )}
      </section>

      {error && (
        <p role="alert" className="text-base font-semibold text-clay">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={advance}
        disabled={atEnd || busy}
        className="w-full rounded-lg bg-brown px-4 py-3 text-lg font-semibold text-paper hover:bg-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
      >
        {atEnd ? 'Claim paid. No further stage' : busy ? 'Moving...' : `Move to next stage: ${STAGES[claim.stage + 1]}`}
      </button>
    </aside>
  )
}

function BureauCard({ title, name, status }: { title: string; name: string; status: string }) {
  return (
    <div className="rounded-lg border border-line bg-stone/60 p-3">
      <div className="text-sm font-medium uppercase tracking-wide text-muted">{title}</div>
      <div className="text-lg font-semibold text-ink">{name}</div>
      <div className="mt-1 inline-block rounded-full bg-mint px-2.5 py-0.5 text-base font-semibold text-paper">{status}</div>
    </div>
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
