import { useEffect, useLayoutEffect, useState, type RefObject } from 'react'
import { STEP_LABELS } from '../../shared/types'
import CorridorMap from './CorridorMap'
import { SHORT_LABELS } from './JourneyStrip'
import { STEP_ICONS } from './StepIcons'

/**
 * Opening moment: a full-screen title card that sits BELOW the banner and header, so the step strip, reset
 * and keyboard shortcuts keep working while it is up. Dismissed by the Start button, Enter/Space, any step key,
 * or any change of step.
 */
export default function Opening({ topRef, onStart }: { topRef: RefObject<HTMLElement | null>; onStart: () => void }) {
  const top = useChromeHeight(topRef)

  // Lock page scroll behind the overlay and start from the top.
  useEffect(() => {
    window.scrollTo(0, 0)
    const html = document.documentElement
    const prevHtml = html.style.overflow
    const prevBody = document.body.style.overflow
    html.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prevHtml
      document.body.style.overflow = prevBody
    }
  }, [])

  return (
    <div
      className="bcd-ink-wash fixed inset-x-0 bottom-0 z-20 overflow-auto text-paper"
      style={{ top }}
      data-testid="opening"
      role="region"
      aria-label="Welcome"
    >
      <div className="mx-auto flex min-h-full w-full max-w-[1400px] flex-col justify-center gap-6 px-8 py-6 lg:px-12 2xl:max-w-[1600px] 2xl:gap-10">
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          <div className="bcd-rise">
            <p className="text-base font-semibold uppercase tracking-[0.22em] text-gold">The Brown Card as a service</p>
            <h1 className="mt-3 text-5xl font-bold leading-[1.04] tracking-tight 2xl:text-7xl">
              One accident.
              <br />
              One card.
              <br />
              Thirty minutes.
            </h1>
            <p className="mt-4 max-w-xl text-xl leading-snug text-paper/80 2xl:mt-6 2xl:max-w-2xl 2xl:text-2xl">
              A demo for the Nigeria Bureau: from a card issued in Lagos to a claim handled across the border, on the operators'
              own platform.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onStart}
                autoFocus
                className="bcd-shadow-lg rounded-xl bg-gold px-8 py-4 text-2xl font-bold text-ink transition-colors hover:bg-paper focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-paper/60"
              >
                Start the demo
              </button>
              <span className="text-base text-paper/60">
                or press <Key>Enter</Key>
              </span>
            </div>
          </div>
          <div className="bcd-rise" style={{ animationDelay: '150ms' }}>
            <CorridorMap tone="dark" className="mx-auto block h-auto w-full max-h-[38vh]" />
          </div>
        </div>

        <ol className="bcd-rise relative mt-2 grid grid-cols-5 gap-3" style={{ animationDelay: '300ms' }} aria-label="The five steps">
          <span aria-hidden className="pointer-events-none absolute left-[10%] right-[10%] top-[21px] h-[2px] bg-paper/20" />
          {STEP_LABELS.map((label, i) => {
            const Icon = STEP_ICONS[i]
            return (
              <li key={label} className="relative flex flex-col items-center gap-2 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-paper/30 bg-ink text-gold">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-base font-semibold leading-tight text-paper">
                  {i + 1}. {SHORT_LABELS[i]}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}

function Key({ children }: { children: string }) {
  return <kbd className="rounded border border-paper/30 px-1.5 py-0.5 font-mono text-base text-paper/80">{children}</kbd>
}

/** Height of the banner + header block, so the overlay starts right under the step strip. */
function useChromeHeight(ref: RefObject<HTMLElement | null>) {
  const [top, setTop] = useState(0)
  useLayoutEffect(() => {
    const measure = () => setTop(ref.current ? Math.round(ref.current.getBoundingClientRect().bottom + window.scrollY) : 0)
    measure()
    const ro = typeof ResizeObserver !== 'undefined' && ref.current ? new ResizeObserver(measure) : null
    if (ref.current && ro) ro.observe(ref.current)
    window.addEventListener('resize', measure)
    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [ref])
  return top
}
