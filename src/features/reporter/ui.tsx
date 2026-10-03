// Small presentational pieces shared by the reporter steps. Every tap target is at least 44px
// tall (min-h-12 = 48px) and all text is at least 16px (text-base).
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { STEP_TITLES, type StepIndex } from './model'

type Variant = 'primary' | 'secondary' | 'ghost'
const VARIANT: Record<Variant, string> = {
  primary: 'bg-ink text-paper hover:bg-ink2 disabled:bg-ink/40',
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
      className={`min-h-12 rounded-xl px-4 text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown disabled:cursor-not-allowed ${VARIANT[variant]} ${className}`}
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
            className={`min-h-12 rounded-xl border px-3 py-2 text-left text-base leading-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown ${
              on ? 'border-ink bg-ink text-paper' : 'border-line bg-paper text-ink hover:border-ink'
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

export function Progress({ step }: { step: StepIndex }) {
  return (
    <div role="group" aria-label={`Step ${step + 1} of ${STEP_TITLES.length}: ${STEP_TITLES[step]}`}>
      <div className="flex items-baseline justify-between gap-2 text-base">
        <h2 className="text-xl font-bold">{STEP_TITLES[step]}</h2>
        <span className="shrink-0 text-muted">
          Step {step + 1} of {STEP_TITLES.length}
        </span>
      </div>
      <ol className="mt-2 grid grid-cols-4 gap-1.5" aria-hidden="true">
        {STEP_TITLES.map((t, i) => (
          <li key={t} className={`h-1.5 rounded-full ${i <= step ? 'bg-brown' : 'bg-line'}`} />
        ))}
      </ol>
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

/** Bottom action bar: optional Back on the left, the main action filling the rest. */
export function Actions({ onBack, children }: { onBack?: () => void; children: ReactNode }) {
  return (
    <div className="flex gap-3 border-t border-line pt-4">
      {onBack && (
        <Button variant="secondary" onClick={onBack} className="min-w-24">
          Back
        </Button>
      )}
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  )
}
