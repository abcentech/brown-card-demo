import { useEffect, type ReactNode } from 'react'
import { useDemo } from '../../state/store'
import { STEP_LABELS, type DemoStep } from '../../shared/types'

/** Presenter shell: stepper, reset, banners. Gemini lane: polish this (see LANE.md). */
export default function Shell({ children }: { children: ReactNode }) {
  const step = useDemo((s) => s.step)
  const setStep = useDemo((s) => s.setStep)
  const reset = useDemo((s) => s.reset)

  // Hidden control: keys 1 to 5 jump to a step; Shift+R resets.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key >= '1' && e.key <= '5') setStep((Number(e.key) - 1) as DemoStep)
      if (e.key.toLowerCase() === 'r' && e.shiftKey) reset()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setStep, reset])

  return (
    <div className="flex min-h-full flex-col">
      <div className="bg-gold px-4 py-1 text-center text-xs font-semibold text-ink">
        Illustrative data. Mock of the operators' platform. Not a live system.
      </div>
      <header className="flex flex-wrap items-center gap-4 border-b border-line bg-stone px-5 py-3">
        <div className="leading-tight">
          <div className="font-semibold">The Brown Card as a service</div>
          <div className="text-xs text-muted">ArkBuilders Consulting · demo</div>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="Demo steps">
          {STEP_LABELS.map((label, i) => (
            <button
              key={label}
              onClick={() => setStep(i as DemoStep)}
              aria-current={step === i ? 'step' : undefined}
              className={`rounded px-3 py-1.5 text-sm font-medium ${step === i ? 'bg-ink text-paper' : 'border border-line text-muted hover:text-ink'}`}
            >
              {i + 1}. {label}
            </button>
          ))}
        </nav>
        <button onClick={reset} className="ml-auto rounded border border-line px-3 py-1.5 text-sm text-muted hover:text-ink">
          Reset demo
        </button>
      </header>
      <main className="flex-1 p-5">{children}</main>
    </div>
  )
}
