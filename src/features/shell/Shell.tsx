import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useDemo } from '../../state/store'
import { STEP_LABELS, type DemoStep } from '../../shared/types'
import ArrivalToast from './ArrivalToast'
import JourneyStrip from './JourneyStrip'
import Opening from './Opening'
import { useClockLabel } from './useClock'

const OPENED_KEY = 'bcd-opened'
const readOpened = () => {
  try {
    return sessionStorage.getItem(OPENED_KEY) === '1'
  } catch {
    return false
  }
}
const writeOpened = (v: boolean) => {
  try {
    if (v) sessionStorage.setItem(OPENED_KEY, '1')
    else sessionStorage.removeItem(OPENED_KEY)
  } catch {
    /* private mode: ignore */
  }
}

/**
 * Presenter shell: sticky banner, header with clock and controls, the journey strip, animated step content,
 * an opening title card on a fresh load, a live-arrival toast, and keyboard shortcuts (1 to 5, Shift+R, F).
 */
export default function Shell({ children }: { children: ReactNode }) {
  const step = useDemo((s) => s.step)
  const resetCount = useDemo((s) => s.resetCount)
  const setStep = useDemo((s) => s.setStep)
  const reset = useDemo((s) => s.reset)
  const time = useClockLabel()

  const chromeRef = useRef<HTMLDivElement>(null)
  const [opened, setOpened] = useState(readOpened)
  const showOpening = step === 0 && !opened

  const start = useCallback(() => {
    setOpened(true)
    writeOpened(true)
  }, [])
  const pick = useCallback(
    (s: DemoStep) => {
      start()
      setStep(s)
    },
    [start, setStep],
  )
  const doReset = useCallback(() => {
    reset()
    setOpened(false)
    writeOpened(false)
  }, [reset])

  // Any step change dismisses the opening and shows the new screen from the top; a reset from another window brings the opening back.
  useEffect(() => {
    if (step !== 0) start()
    // Screens may focus a field on mount, which can nudge the page; settle back to the top.
    window.scrollTo(0, 0)
    const raf = requestAnimationFrame(() => window.scrollTo(0, 0))
    const id = setTimeout(() => window.scrollTo(0, 0), 180)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(id)
    }
  }, [step, start])
  const firstReset = useRef(resetCount)
  useEffect(() => {
    if (resetCount !== firstReset.current) {
      firstReset.current = resetCount
      setOpened(false)
      writeOpened(false)
    }
  }, [resetCount])

  // Full screen
  const [fullscreen, setFullscreen] = useState(false)
  useEffect(() => {
    const on = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', on)
    return () => document.removeEventListener('fullscreenchange', on)
  }, [])
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen?.().catch(() => {})
    else void document.documentElement.requestFullscreen?.().catch(() => {})
  }, [])

  // Hidden controls: 1 to 5 jump to a step; Shift+R resets; F toggles full screen; Enter/Space starts the demo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"]') || e.ctrlKey || e.altKey || e.metaKey) return
      if (e.key >= '1' && e.key <= '5') {
        e.preventDefault()
        pick((Number(e.key) - 1) as DemoStep)
        return
      }
      if (e.key.toLowerCase() === 'r' && e.shiftKey) {
        e.preventDefault()
        doReset()
        return
      }
      if (e.key.toLowerCase() === 'f' && !e.shiftKey) {
        if (target?.closest('button, a')) return
        e.preventDefault()
        toggleFullscreen()
        return
      }
      if (showOpening && (e.key === 'Enter' || e.key === ' ') && !target?.closest('button, a')) {
        e.preventDefault()
        start()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pick, doReset, toggleFullscreen, showOpening, start])

  return (
    <div className="flex min-h-full flex-col text-base text-ink">
      <div ref={chromeRef}>
        <div className="sticky top-0 z-30 bg-gold px-4 py-2 text-center text-base font-semibold text-ink shadow-sm">
          Illustrative data · Mock of the operators' platform · Not a live system
        </div>

        <header className="relative z-20 border-b border-line bg-paper px-4 pt-3 pb-3 sm:px-7">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold leading-tight tracking-tight">The Brown Card as a service</span>
              <span className="hidden text-base text-muted md:inline">ArkBuilders Consulting · ECOWAS Brown Card demo</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-lg bg-stone px-3 py-2 text-base font-semibold tabular-nums text-ink" aria-label={`Current time ${time}`}>
                {time}
              </span>
              <button
                type="button"
                onClick={toggleFullscreen}
                aria-pressed={fullscreen}
                title="Toggle full screen (F)"
                className="rounded-lg border border-line px-4 py-2 text-base font-semibold hover:bg-stone"
              >
                {fullscreen ? 'Exit full screen' : 'Full screen'}
              </button>
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
                onClick={doReset}
                className="rounded-lg border border-brown px-4 py-2 text-base font-semibold text-brown hover:bg-brown hover:text-paper"
              >
                Reset demo
              </button>
            </div>
          </div>

          <JourneyStrip step={step} onPick={pick} />
        </header>
      </div>

      <main key={step} inert={showOpening || undefined} aria-hidden={showOpening || undefined} className="bcd-step-enter flex-1 p-4 sm:p-7">
        {children}
      </main>

      <footer inert={showOpening || undefined} aria-hidden={showOpening || undefined} className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-paper px-4 py-4 sm:px-7">
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-base text-muted">
          <span>
            Step {step + 1} of 5: <span className="font-semibold text-ink">{STEP_LABELS[step]}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>1</Kbd>…<Kbd>5</Kbd> jump to a step
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>Shift</Kbd>+<Kbd>R</Kbd> reset
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>F</Kbd> full screen
          </span>
          <span className="hidden xl:inline">Works offline · illustrative</span>
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => pick(Math.max(0, step - 1) as DemoStep)}
            disabled={step === 0}
            className="rounded-lg border border-line px-4 py-2 text-base font-semibold disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => pick(Math.min(4, step + 1) as DemoStep)}
            disabled={step === 4}
            className="bcd-shadow rounded-lg bg-ink px-5 py-2 text-base font-semibold text-paper disabled:opacity-40"
          >
            Next step
          </button>
        </div>
      </footer>

      {showOpening && <Opening topRef={chromeRef} onStart={start} />}
      <ArrivalToast onShow={() => pick(2)} />
    </div>
  )
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-line bg-paper px-1.5 py-0.5 font-mono text-base font-semibold text-ink shadow-[0_1px_0_var(--color-line)]">
      {children}
    </kbd>
  )
}
