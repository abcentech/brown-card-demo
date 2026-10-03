// The end states after the final tap: sending, the report was received, or it is held on the phone.
import { useEffect, useRef, useState } from 'react'
import type { IncidentInput, IncidentResult } from '../../../shared/types'
import type { QueuedReport } from '../queue'
import { Actions, Button, Notice } from '../ui'

const timeLabel = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

/** Copies `text` to the clipboard where the browser allows it; says so briefly either way. */
function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<'idle' | 'done' | 'fail'>('idle')
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const copy = async () => {
    try {
      const clip = typeof navigator !== 'undefined' ? navigator.clipboard : undefined
      if (!clip || typeof clip.writeText !== 'function') throw new Error('Clipboard unavailable')
      await clip.writeText(text)
      setState('done')
    } catch {
      setState('fail')
    }
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setState('idle'), 1600)
  }
  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label={label}
      className={`min-h-11 shrink-0 rounded-xl border px-3 text-base font-semibold transition-colors ${
        state === 'done' ? 'border-mint bg-mint text-paper' : state === 'fail' ? 'border-clay text-clay' : 'border-line bg-paper text-ink hover:border-ink'
      }`}
    >
      {state === 'done' ? 'Copied' : state === 'fail' ? 'Select it' : 'Copy'}
    </button>
  )
}

function Reference({ title, value, tone }: { title: string; value: string; tone: 'mint' | 'paper' }) {
  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl border p-4 ${tone === 'mint' ? 'border-mint bg-mint/10' : 'border-line bg-paper'}`}>
      <div className="min-w-0">
        <div className="text-base text-muted">{title}</div>
        <div className="font-mono text-[1.75rem] font-bold leading-tight tracking-wide">{value}</div>
      </div>
      <CopyButton text={value} label={`Copy ${title.toLowerCase()}`} />
    </div>
  )
}

/** Shown while the platform opens the claim; the mock takes about a second. */
export function SendingScreen() {
  const steps = ['Checking the card on the register', 'Opening the claim', 'Notifying the bureaux and the insurer']
  return (
    <div className="flex flex-1 flex-col gap-5" role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brown/10 text-brown">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </span>
        <div>
          <h2 className="text-xl font-bold">Sending…</h2>
          <p className="text-base text-muted">One moment.</p>
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <div className="rp-sending-bar h-full rounded-full bg-brown" />
      </div>
      <ol className="space-y-2 text-base">
        {steps.map((s, i) => (
          <li key={s} className="rp-fade-up flex items-center gap-2" style={{ animationDelay: `${i * 320}ms` }}>
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-brown" />
            {s}
          </li>
        ))}
      </ol>
    </div>
  )
}

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
  const [receivedAt] = useState(timeLabel)
  return (
    <div className="flex flex-1 flex-col gap-5" role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 52 52" width="52" height="52" aria-hidden="true" className="rp-pop shrink-0 text-mint">
          <circle className="rp-check-circle" cx="26" cy="26" r="24" fill="none" stroke="currentColor" strokeWidth="3" />
          <path className="rp-check-mark" d="M15 27l7.5 7.5L37.5 19" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div>
          <h2 className="text-xl font-bold">Report received</h2>
          <p className="text-base text-muted">Keep these references.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Reference title="Incident reference" value={result.incidentRef} tone="mint" />
        <div className="space-y-1">
          <Reference title="Claim reference" value={result.claimRef} tone="paper" />
          <div className="px-1 text-base text-muted">
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
        <div className="mb-3 flex items-center justify-between gap-2 text-base">
          <span className="font-semibold">Message to the reporter</span>
          <span aria-hidden="true" className="rounded-md bg-stone px-2 py-0.5 text-muted">SMS</span>
        </div>
        <div className="flex flex-col items-start">
          <div className="mb-1 pl-2 text-base text-muted">Brown Card Bureau</div>
          <p className="rp-bubble max-w-[90%] rounded-2xl rounded-bl-md bg-stone px-4 py-3 text-base leading-snug">{result.smsPreview}</p>
          <time className="mt-1 pl-2 text-base text-muted">Today {receivedAt}</time>
        </div>
        <p className="mt-3 text-base text-muted">Preview only. No message is sent in the demo.</p>
      </div>

      <Notice tone="stone">
        <strong>What happens next.</strong> The {input.country} Bureau (handling), the Nigeria Bureau (issuing) and {insurer} have been
        notified. The claim is now on the dashboard as Notified and the insurer's clock has started.
      </Notice>

      <Actions>
        <Button onClick={onRestart} className="w-full">
          Start another report
        </Button>
      </Actions>
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
    <div className="flex flex-1 flex-col gap-5" role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold text-ink">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="13" r="8" />
            <path d="M12 9v4l2.5 2M9 2h6" />
          </svg>
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
        <div className="font-mono text-xl font-semibold">{item.input.cardNumber}</div>
        <div>
          {item.input.crossing} · {item.input.country} · {item.input.parties} {item.input.parties === 1 ? 'party' : 'parties'}
          {item.input.injuries ? ' · injuries' : ''}
        </div>
      </div>

      {error && <Notice tone="clay">{error}</Notice>}

      <Actions>
        {online && (
          <Button onClick={onRetry} disabled={sending} className="w-full">
            {sending ? 'Sending…' : 'Try again now'}
          </Button>
        )}
        <Button variant="secondary" onClick={onRestart} className="w-full">
          Start another report
        </Button>
      </Actions>
    </div>
  )
}
