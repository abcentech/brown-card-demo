import { useEffect, useRef, useState } from 'react'
import { platform } from '../../../platform'
import { isWellFormed } from '../../../shared/cardNumber'
import { SAMPLE_BAD_CHECK, SAMPLE_COVERED, SAMPLE_LAPSED, SAMPLE_UNKNOWN } from '../../../shared/seed'
import type { VerifyResult } from '../../../shared/types'
import { STATUS_META, TONE_CLASSES } from '../model'
import { Actions, Button, Field, Notice } from '../ui'

const SAMPLES = [
  { label: 'Covered', number: SAMPLE_COVERED },
  { label: 'Lapsed', number: SAMPLE_LAPSED },
  { label: 'Not on register', number: SAMPLE_UNKNOWN },
  { label: 'Bad check digit', number: SAMPLE_BAD_CHECK },
] as const

export default function CardStep({
  cardNumber,
  verify,
  onChange,
  onNext,
}: {
  cardNumber: string
  verify: VerifyResult | null
  onChange: (cardNumber: string, verify: VerifyResult | null) => void
  onNext: () => void
}) {
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const seq = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Runs a live check against the platform. Stale replies are dropped via the sequence counter.
  const check = (value: string) => {
    const mine = ++seq.current
    const trimmed = value.trim()
    if (!trimmed) {
      setChecking(false)
      return
    }
    setChecking(true)
    setError('')
    platform
      .verifyCard(trimmed)
      .then((v) => {
        if (mine !== seq.current) return
        onChange(value, v)
        setChecking(false)
      })
      .catch(() => {
        if (mine !== seq.current) return
        setChecking(false)
        setError('Could not check the card just now. Try again.')
      })
  }

  // Auto-check once the number looks complete; typing clears the previous result.
  useEffect(() => {
    if (!isWellFormed(cardNumber)) return
    const t = window.setTimeout(() => check(cardNumber), 250)
    return () => window.clearTimeout(t)
  }, [cardNumber])

  useEffect(() => () => void (seq.current += 1), [])

  const setNumber = (value: string) => {
    seq.current += 1
    setChecking(false)
    setError('')
    onChange(value.toUpperCase(), null)
  }

  const meta = verify ? STATUS_META[verify.status] : null
  const tone = meta ? TONE_CLASSES[meta.tone] : null
  const canContinue = !!verify && !checking

  return (
    <div className="space-y-5">
      <Field label="Brown Card number" hint="Printed on the card. Format NG-26-XXXX-XXXX-X." htmlFor="card-number">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            id="card-number"
            value={cardNumber}
            onChange={(e) => setNumber(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && check(cardNumber)}
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            placeholder="NG-26-XXXX-XXXX-X"
            aria-describedby="card-result"
            className="min-h-12 min-w-0 flex-1 rounded-xl border border-line bg-paper px-3 font-mono text-base tracking-wide text-ink focus:border-ink focus:outline-2 focus:outline-brown"
          />
          <Button variant="secondary" onClick={() => check(cardNumber)} disabled={!cardNumber.trim() || checking}>
            Check
          </Button>
        </div>
      </Field>

      <div>
        <div className="mb-2 text-base text-muted">Sample cards for the demo</div>
        <div className="grid grid-cols-2 gap-2">
          {SAMPLES.map((s) => (
            <button
              type="button"
              key={s.label}
              onClick={() => {
                onChange(s.number, null)
                check(s.number)
              }}
              aria-pressed={cardNumber === s.number}
              className={`min-h-12 rounded-xl border px-3 text-left text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown ${
                cardNumber === s.number ? 'border-brown bg-brown/10' : 'border-line bg-paper hover:border-ink'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div id="card-result" aria-live="polite" className="min-h-6">
        {checking && <Notice tone="stone">Checking the card with the register…</Notice>}
        {!checking && error && <Notice tone="clay">{error}</Notice>}
        {!checking && !error && verify && meta && tone && (
          <div className={`space-y-2 rounded-xl border p-4 ${tone.panel}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-base font-bold ${tone.badge}`}>{meta.label}</span>
              <span className="font-mono text-base">{verify.cardNumber}</span>
            </div>
            <p className="text-base">{verify.message}</p>
            {verify.holder && (
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-base">
                <dt className="text-muted">Holder</dt>
                <dd className="font-semibold">{verify.holder}</dd>
                <dt className="text-muted">Vehicle</dt>
                <dd className="font-semibold">{verify.vehicle}</dd>
                <dt className="text-muted">Cover</dt>
                <dd className="font-semibold">
                  {verify.cover}
                  {verify.insurerId ? `, Insurer ${verify.insurerId}` : ''}
                </dd>
                {verify.validTo && (
                  <>
                    <dt className="text-muted">Valid to</dt>
                    <dd className="font-semibold">{verify.validTo}</dd>
                  </>
                )}
              </dl>
            )}
            {verify.status !== 'covered' && (
              <p className="text-base font-semibold">You can still send this report. It will be flagged for the bureau to check.</p>
            )}
          </div>
        )}
        {!checking && !error && !verify && cardNumber.trim() && !isWellFormed(cardNumber) && (
          <p className="text-base text-muted">Keep typing, or tap Check.</p>
        )}
      </div>

      <Actions>
        <Button onClick={onNext} disabled={!canContinue} className="w-full">
          {verify && verify.status !== 'covered' ? 'Continue anyway' : 'Next'}
        </Button>
      </Actions>
    </div>
  )
}
