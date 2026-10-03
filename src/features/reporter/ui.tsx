// Small presentational pieces shared by the reporter steps. Every tap target is at least 44px
// tall (min-h-12 = 48px) and all text is at least 16px (text-base).
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { STEP_TITLES, type StepIndex } from './model'

type Variant = 'primary' | 'secondary' | 'ghost'
const VARIANT: Record<Variant, string> = {
  primary: 'rp-primary bg-ink text-paper hover:bg-ink2 disabled:bg-ink/40 disabled:shadow-none',
  secondary: 'border border-ink bg-paper text-ink hover:bg-stone disabled:opacity-40',
  ghost: 'text-ink underline-offset-4 hover:underline disabled:opacity-40',
}

export function Button({
  variant = 'primary',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      {...rest}
      className={`min-h-12 rounded-xl px-4 text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown disabled:cursor-not-allowed ${VARIANT[variant]} ${className}`}
    />
  )
}

/** A grid of large tappable choices that behaves like a radio group. */
export function OptionGrid<T extends string | number>({
  options,
  value,
  onChange,
  columns = 2,
  label,
}: {
  options: readonly { value: T; label: string; hint?: string }[]
  value: T | null
  onChange: (v: T) => void
  columns?: 2 | 5
  label: string
}) {
  const cols = columns === 5 ? 'grid-cols-5' : 'grid-cols-2'
  return (
    <div role="radiogroup" aria-label={label} className={`grid ${cols} gap-2`}>
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            type="button"
            key={String(o.value)}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`min-h-12 rounded-xl border px-3 py-2 text-left text-base leading-tight transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown ${
              on ? 'rp-primary border-ink bg-ink text-paper' : 'border-line bg-paper text-ink hover:border-ink'
            } ${columns === 5 ? 'text-center' : ''}`}
          >
            <span className="block font-semibold">{o.label}</span>
            {o.hint && <span className={`block ${on ? 'text-paper/80' : 'text-muted'}`}>{o.hint}</span>}
          </button>
        )
      })}
    </div>
  )
}

export function Field({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div>
        <label htmlFor={htmlFor} className="block text-base font-semibold">
          {label}
        </label>
        {hint && <div className="text-base text-muted">{hint}</div>}
      </div>
      {children}
    </div>
  )
}

const svgProps = { viewBox: '0 0 24 24', width: 22, height: 22, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

/** One small line icon per step: card, place, what happened, review. */
export function StepIcon({ step }: { step: StepIndex }) {
  switch (step) {
    case 0:
      return (
        <svg {...svgProps} aria-hidden>
          <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
          <path d="M2.5 10h19M6 15h4" />
        </svg>
      )
    case 1:
      return (
        <svg {...svgProps} aria-hidden>
          <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
          <circle cx="12" cy="10" r="2.4" />
        </svg>
      )
    case 2:
      return (
        <svg {...svgProps} aria-hidden>
          <path d="M10.3 4.2 2.9 17a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z" />
          <path d="M12 9v4.5M12 17h.01" />
        </svg>
      )
    default:
      return (
        <svg {...svgProps} aria-hidden>
          <rect x="4" y="3.5" width="16" height="17" rx="2.5" />
          <path d="M8 3.5V6h8V3.5M8.5 13l2.3 2.3L15.5 10.5" />
        </svg>
      )
  }
}

export function Progress({ step }: { step: StepIndex }) {
  const pct = ((step + 1) / STEP_TITLES.length) * 100
  return (
    <div role="group" aria-label={`Step ${step + 1} of ${STEP_TITLES.length}: ${STEP_TITLES[step]}`}>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brown/10 text-brown">
          <StepIcon step={step} />
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <h2 className="truncate text-xl font-bold">{STEP_TITLES[step]}</h2>
          <div className="text-base text-muted">
            Step {step + 1} of {STEP_TITLES.length}
          </div>
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <div className="rp-progress h-full rounded-full bg-brown" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function Banner() {
  return (
    <div role="note" className="bg-gold px-4 py-2 text-center text-base font-semibold text-ink">
      Illustrative data. Demo only, not a live system.
    </div>
  )
}

export function Notice({ tone, children }: { tone: 'mint' | 'gold' | 'clay' | 'stone'; children: ReactNode }) {
  const cls =
    tone === 'mint'
      ? 'border-mint bg-mint/10'
      : tone === 'gold'
        ? 'border-gold bg-gold/15'
        : tone === 'clay'
          ? 'border-clay bg-clay/10'
          : 'border-line bg-stone'
  return <div className={`rounded-xl border p-3 text-base ${cls}`}>{children}</div>
}

/**
 * Bottom action bar: optional Back on the left, the main action filling the rest.
 * Sticks to the bottom of the phone screen so the primary button is always under the thumb.
 */
export function Actions({ onBack, children }: { onBack?: () => void; children: ReactNode }) {
  return (
    <div className="rp-actions sticky bottom-0 z-10 -mx-4 mt-auto flex gap-3 border-t border-line px-4 pb-4 pt-3">
      {onBack && (
        <Button variant="secondary" onClick={onBack} className="min-w-24">
          Back
        </Button>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2">{children}</div>
    </div>
  )
}
