import { useEffect, type ReactNode } from 'react'
import { useDemo } from '../../state/store'
import { STEP_LABELS, type DemoStep } from '../../shared/types'

const SHORT_LABELS = ['Issue and check', 'Incident report', 'Claims dashboard', 'Compliance console', 'Close'] as const

/** Presenter shell: sticky banner, large stepper, reset, keyboard shortcuts (1 to 5, Shift+R). */
export default function Shell({ children }: { children: ReactNode }) {
  const step = useDemo((s) => s.step)
  const setStep = useDemo((s) => s.setStep)
  const reset = useDemo((s) => s.reset)

  // Hidden control: keys 1 to 5 jump to a step; Shift+R resets. Ignored while typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"]') || e.ctrlKey || e.altKey || e.metaKey) return
      if (e.key >= '1' && e.key <= '5') {
        e.preventDefault()
        setStep((Number(e.key) - 1) as DemoStep)
      }
      if (e.key.toLowerCase() === 'r' && e.shiftKey) {
        e.preventDefault()
        reset()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setStep, reset])

  return (
    <div className="flex min-h-full flex-col text-base text-ink">
      <div className="sticky top-0 z-30 bg-gold px-4 py-2 text-center text-base font-semibold text-ink shadow-sm">
        Illustrative data · Mock of the operators' platform · Not a live system
      </div>

      <header className="border-b border-line bg-paper px-4 py-4 sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-2xl font-bold leading-tight">The Brown Card as a service</div>
            <div className="mt-0.5 text-base text-muted">ArkBuilders Consulting · ECOWAS Brown Card demo</div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="?view=claims"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-line px-4 py-2 text-base font-semibold hover:bg-stone"
            >
              Open claims window
            </a>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-brown px-4 py-2 text-base font-semibold text-brown hover:bg-brown hover:text-paper"
            >
              Reset demo
            </button>
          </div>
        </div>

        <nav className="mt-4 grid gap-2 sm:grid-cols-5" aria-label="Demo steps">
          {STEP_LABELS.map((label, i) => {
            const current = step === i
            const done = i < step
            return (
              <button
                key={label}
                type="button"
                onClick={() => setStep(i as DemoStep)}
                aria-current={current ? 'step' : undefined}
                title={label}
                className={`flex items-center gap-3 rounded-xl border-2 px-3 py-3 text-left transition-colors ${
                  current
                    ? 'border-ink bg-ink text-paper shadow-md'
                    : done
                      ? 'border-mint/50 bg-mint/10 text-ink hover:bg-mint/20'
                      : 'border-line bg-stone/50 text-ink hover:bg-stone'
                }`}
              >
                <span
                  aria-hidden
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl font-bold ${
                    current ? 'bg-gold text-ink' : done ? 'bg-mint text-paper' : 'bg-line/60 text-ink'
                  }`}
                >
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className={`block text-lg font-semibold leading-tight ${current ? 'text-paper' : 'text-ink'}`}>
                    {SHORT_LABELS[i]}
                  </span>
                  <span className={`block text-sm ${current ? 'text-paper/80' : 'text-muted'}`}>
                    {current ? 'Current step' : done ? 'Done' : `Step ${i + 1}`}
                  </span>
                </span>
              </button>
            )
          })}
        </nav>

        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-base text-muted">
          <span>
            Step {step + 1} of 5: <span className="font-semibold text-ink">{STEP_LABELS[step]}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>1</Kbd>…<Kbd>5</Kbd> jump to a step
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>Shift</Kbd>+<Kbd>R</Kbd> reset
          </span>
        </p>
      </header>

      <main className="flex-1 p-4 sm:p-7">{children}</main>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-paper px-4 py-4 sm:px-7">
        <span className="text-base text-muted">Illustrative demo · works offline · operator API to be confirmed</span>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setStep(Math.max(0, step - 1) as DemoStep)}
            disabled={step === 0}
            className="rounded-lg border border-line px-4 py-2 text-base font-semibold disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setStep(Math.min(4, step + 1) as DemoStep)}
            disabled={step === 4}
            className="rounded-lg bg-ink px-5 py-2 text-base font-semibold text-paper disabled:opacity-40"
          >
            Next step
          </button>
        </div>
      </footer>
    </div>
  )
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-line bg-paper px-1.5 py-0.5 font-mono text-sm font-semibold text-ink shadow-[0_1px_0_#c6c0ae]">
      {children}
    </kbd>
  )
}
