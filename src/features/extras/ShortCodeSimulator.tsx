import { useRef, useState, type FormEvent } from 'react'
import { platform } from '../../platform'
import { useDemo } from '../../state/store'
import { SAMPLE_BAD_CHECK, SAMPLE_COVERED, SAMPLE_LAPSED, SAMPLE_UNKNOWN } from '../../shared/seed'
import type { VerifyResult } from '../../shared/types'

/** PLACEHOLDER short code. The real code is the operators' to confirm. */
export const SHORT_CODE = '*000#'

type Phase = 'dial' | 'enter' | 'checking' | 'result'

const SAMPLE_CHIPS: { label: string; card: string }[] = [
  { label: 'Covered', card: SAMPLE_COVERED },
  { label: 'Lapsed', card: SAMPLE_LAPSED },
  { label: 'Not found', card: SAMPLE_UNKNOWN },
  { label: 'Invalid', card: SAMPLE_BAD_CHECK },
]

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#']

/** Render the verify result the way a USSD screen would: short lines, plain text. */
export function ussdText(r: VerifyResult): string {
  const head: Record<VerifyResult['status'], string> = {
    covered: 'COVERED',
    lapsed: 'LAPSED',
    not_found: 'NOT FOUND',
    invalid: 'INVALID NUMBER',
  }
  const lines = ['Brown Card check', r.cardNumber, `Status: ${head[r.status]}`]
  if (r.holder) lines.push(`Holder: ${r.holder}`)
  if (r.vehicle) lines.push(`Vehicle: ${r.vehicle}`)
  if (r.insurerId) lines.push(`Insurer: Insurer ${r.insurerId}`)
  if (r.cover) lines.push(`Cover: ${r.cover}`)
  if (r.validTo) lines.push(`Valid to: ${r.validTo}`)
  lines.push('', r.message, '', '0 Back')
  return lines.join('\n')
}

export default function ShortCodeSimulator() {
  const issued = useDemo((s) => s.issued)
  const [phase, setPhase] = useState<Phase>('dial')
  const [dialled, setDialled] = useState('')
  const [card, setCard] = useState('')
  const [screen, setScreen] = useState('')
  const [lastStatus, setLastStatus] = useState<VerifyResult['status'] | null>(null)
  const sequence = useRef(0)

  const chips = [...issued.map((p) => ({ label: 'Issued just now', card: p.cardNumber })), ...SAMPLE_CHIPS]

  const press = (k: string) => {
    if (phase !== 'dial') return
    setDialled((d) => (d.length < 12 ? d + k : d))
  }

  const call = () => {
    if (dialled === SHORT_CODE) {
      setPhase('enter')
      setScreen('Brown Card check\n\nEnter the card number\nas printed on the card:\n\n(Demo short code)')
    } else {
      setScreen(`${dialled || '(nothing dialled)'}\n\nUnknown short code.\nDial ${SHORT_CODE} to check a card.`)
    }
  }

  const hangUp = () => {
    sequence.current += 1
    setPhase('dial')
    setDialled('')
    setCard('')
    setScreen('')
    setLastStatus(null)
  }

  const send = async (e?: FormEvent) => {
    e?.preventDefault()
    if (!card.trim() || phase === 'checking') return
    const request = ++sequence.current
    setPhase('checking')
    setScreen('Checking…\n\nPlease wait.')
    try {
      const r = await platform.verifyCard(card)
      if (request !== sequence.current) return
      setScreen(ussdText(r))
      setLastStatus(r.status)
    } catch (err) {
      if (request !== sequence.current) return
      setScreen(`Network error.\n${err instanceof Error ? err.message : ''}\n\n0 Back`)
      setLastStatus(null)
    } finally {
      if (request === sequence.current) setPhase('result')
    }
  }

  const back = () => {
    setPhase('enter')
    setCard('')
    setLastStatus(null)
    setScreen('Brown Card check\n\nEnter the card number\nas printed on the card:')
  }

  // Plain paper text on the dark screen for projector contrast; the outcome colours the frame, not the words.
  const tone =
    lastStatus === 'covered' ? 'ring-4 ring-mint' : lastStatus === 'lapsed' ? 'ring-4 ring-gold' : lastStatus ? 'ring-4 ring-clay' : ''

  return (
    <section aria-labelledby="ussd-title" data-testid="short-code-simulator" className="rounded-xl border border-line bg-paper p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="ussd-title" className="text-xl font-semibold">Check a card by short code</h3>
        <span className="rounded-full border border-brown px-3 py-0.5 text-base font-medium text-brown">
          Placeholder short code <span className="font-mono font-bold">{SHORT_CODE}</span>
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        {/* Phone (pure CSS) */}
        <div className="mx-auto w-full max-w-[320px] rounded-[2rem] border-[8px] border-ink bg-ink2 p-3 shadow-xl" aria-label="Feature phone">
          <div className="mx-auto mb-2 h-1.5 w-16 rounded-full bg-ink" aria-hidden />
          <pre
            data-testid="ussd-screen"
            data-status={lastStatus ?? undefined}
            aria-live="polite"
            className={`min-h-[190px] whitespace-pre-wrap break-words rounded-lg bg-ink p-3 font-mono text-base leading-snug text-paper ${tone}`}
          >
            {phase === 'dial' ? (screen || `Dial ${SHORT_CODE}\nthen press Call`) : screen}
            {phase === 'dial' && dialled && `\n\n> ${dialled}`}
          </pre>

          {phase === 'dial' ? (
            <>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {KEYS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => press(k)}
                    aria-label={`Key ${k}`}
                    className="h-12 min-h-[44px] rounded-lg bg-stone text-xl font-semibold text-ink active:bg-line"
                  >
                    {k}
                  </button>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <button type="button" onClick={() => setDialled(SHORT_CODE)} className="h-12 rounded-lg border border-line text-base text-paper">
                  Fill {SHORT_CODE}
                </button>
                <button type="button" onClick={call} className="h-12 rounded-lg bg-mint text-lg font-semibold text-paper">
                  Call
                </button>
                <button type="button" onClick={() => setDialled((d) => d.slice(0, -1))} aria-label="Delete" className="h-12 rounded-lg border border-line text-lg text-paper">
                  ⌫
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={send} className="mt-3 space-y-2">
              <label htmlFor="ussd-card" className="sr-only">Card number</label>
              <input
                id="ussd-card"
                value={card}
                onChange={(e) => setCard(e.target.value.toUpperCase())}
                placeholder="NG-26-XXXX-XXXX-C"
                autoComplete="off"
                spellCheck={false}
                disabled={phase === 'checking'}
                className="h-12 w-full rounded-lg border border-line bg-paper px-3 font-mono text-base uppercase text-ink"
              />
              <div className="grid grid-cols-2 gap-2">
                {phase === 'result' ? (
                  <button type="button" onClick={back} className="h-12 rounded-lg border border-line text-base text-paper">
                    0 Back
                  </button>
                ) : (
                  <button type="submit" aria-label="Verify card" disabled={phase === 'checking' || !card.trim()} className="h-12 rounded-lg bg-mint text-lg font-semibold text-paper disabled:opacity-50">
                    Send
                  </button>
                )}
                <button type="button" onClick={hangUp} className="h-12 rounded-lg bg-clay text-lg font-semibold text-paper">
                  End
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Helper panel */}
        <div className="space-y-4 text-base">
          <ol className="list-decimal space-y-1 pl-5">
            <li>Dial <span className="font-mono font-semibold">{SHORT_CODE}</span> on the keypad and press <b>Call</b>.</li>
            <li>Type a card number, or pick one below, then press <b>Send</b>.</li>
            <li>The reply is what a driver, police officer or border agent would see on any phone.</li>
          </ol>
          <div>
            <div className="mb-2 font-semibold">Sample cards</div>
            <div className="flex flex-wrap gap-2">
              {chips.map((c) => (
                <button
                  key={c.card + c.label}
                  type="button"
                  aria-label={c.label}
                  disabled={phase === 'checking'}
                  onClick={() => {
                    if (phase === 'dial') {
                      setDialled(SHORT_CODE)
                      setPhase('enter')
                    }
                    if (phase === 'result') setLastStatus(null)
                    setCard(c.card)
                    setPhase('enter')
                    setScreen('Brown Card check\n\nEnter the card number\nas printed on the card:')
                  }}
                  className={`min-h-[44px] rounded-full border px-4 py-2 text-left leading-tight ${c.label === 'Issued just now' ? 'border-mint bg-mint/10' : 'border-line bg-stone'} hover:border-ink`}
                >
                  <span className="block text-base text-muted">{c.label}</span>
                  <span className="font-mono font-semibold">{c.card}</span>
                </button>
              ))}
            </div>
          </div>
          <p className="text-muted">
            The short code is a placeholder. The operators own the real code; the demo only shows that one verification call
            serves the phone, the reporter and the dashboard alike.
          </p>
        </div>
      </div>
    </section>
  )
}
