// The two end states after the final tap: the report was received, or it is held on the phone.
import type { IncidentInput, IncidentResult } from '../../../shared/types'
import type { QueuedReport } from '../queue'
import { Button, Notice } from '../ui'

export function ResultScreen({
  input,
  result,
  insurerId,
  onRestart,
}: {
  input: IncidentInput
  result: IncidentResult
  insurerId?: string
  onRestart: () => void
}) {
  const insurer = insurerId ? `Insurer ${insurerId}` : 'the insurer on the card'
  return (
    <div className="space-y-5" role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-mint text-2xl font-bold text-paper">
          ✓
        </span>
        <div>
          <h2 className="text-xl font-bold">Report received</h2>
          <p className="text-base text-muted">Keep these references.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="rounded-xl border border-mint bg-mint/10 p-4">
          <div className="text-base text-muted">Incident reference</div>
          <div className="font-mono text-2xl font-bold">{result.incidentRef}</div>
        </div>
        <div className="rounded-xl border border-line bg-paper p-4">
          <div className="text-base text-muted">Claim reference</div>
          <div className="font-mono text-2xl font-bold">{result.claimRef}</div>
          <div className="text-base text-muted">
            {result.verified ? 'Card verified. Claim opened.' : 'Claim opened. Card flagged for checking.'}
          </div>
        </div>
      </div>

      {!result.verified && (
        <Notice tone="gold">
          <strong>Cover not confirmed.</strong> The {input.country} Bureau will check the card before assessing.
        </Notice>
      )}

      <div className="rounded-xl border border-line bg-paper p-4">
        <div className="mb-2 flex items-center gap-2 text-base font-semibold">
          <span aria-hidden="true" className="rounded-md bg-stone px-2 py-0.5">SMS</span>
          Message to the reporter
        </div>
        <p className="rounded-xl bg-stone px-3 py-2 text-base">{result.smsPreview}</p>
        <p className="mt-2 text-base text-muted">Preview only. No message is sent in the demo.</p>
      </div>

      <Notice tone="stone">
        <strong>What happens next.</strong> The {input.country} Bureau (handling), the Nigeria Bureau (issuing) and {insurer} have been
        notified. The claim is now on the dashboard as Notified and the insurer's clock has started.
      </Notice>

      <Button onClick={onRestart} className="w-full">
        Start another report
      </Button>
    </div>
  )
}

export function QueuedScreen({
  item,
  online,
  sending,
  error,
  onRetry,
  onRestart,
}: {
  item: QueuedReport
  online: boolean
  sending: boolean
  error: string
  onRetry: () => void
  onRestart: () => void
}) {
  return (
    <div className="space-y-5" role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold text-2xl font-bold text-ink">
          ⏱
        </span>
        <div>
          <h2 className="text-xl font-bold">{sending ? 'Sending…' : 'Saved on this phone'}</h2>
          <p className="text-base text-muted">
            {sending ? 'Please wait a moment.' : online ? 'Ready to send.' : 'Waiting for a connection.'}
          </p>
        </div>
      </div>

      <Notice tone="gold">
        {online
          ? 'The report could not be sent just now. It is saved here and will be retried.'
          : 'You are offline. The report is saved here and will be sent automatically as soon as the phone is back online. You can close this screen.'}
      </Notice>

      <div className="rounded-xl border border-line bg-paper p-4 text-base">
        <div className="text-muted">Held report</div>
        <div className="font-mono font-semibold">{item.input.cardNumber}</div>
        <div>
          {item.input.crossing} · {item.input.country} · {item.input.parties} {item.input.parties === 1 ? 'party' : 'parties'}
          {item.input.injuries ? ' · injuries' : ''}
        </div>
      </div>

      {error && <Notice tone="clay">{error}</Notice>}

      {online && (
        <Button onClick={onRetry} disabled={sending} className="w-full">
          {sending ? 'Sending…' : 'Try again now'}
        </Button>
      )}
      <Button variant="secondary" onClick={onRestart} className="w-full">
        Start another report
      </Button>
    </div>
  )
}
