import { STEP_LABELS, type DemoStep } from '../../shared/types'
import { STEP_ICONS, TickIcon } from './StepIcons'

export const SHORT_LABELS = ['Issue and check', 'Incident report', 'Claims dashboard', 'Compliance console', 'Close'] as const
export const STEP_BLURBS = [
  'A policy becomes a card',
  'A crash at the crossing',
  'The claim lands, Notified',
  'The last 5% made visible',
  'One corridor to start',
] as const

/**
 * The story of one accident as five connected steps. Done steps tick in mint, the current one wears a gold ring,
 * and a thin line fills as the presenter advances. Button names stay "<n>. <label>" for the e2e tests.
 */
export default function JourneyStrip({ step, onPick }: { step: DemoStep; onPick: (s: DemoStep) => void }) {
  return (
    <nav className="relative mt-4" aria-label="Demo steps">
      {/* Rail behind the step circles: spans the centres of columns 1 to 5 */}
      <div aria-hidden className="pointer-events-none absolute left-[10%] right-[10%] top-[27px] h-[3px] rounded-full bg-line/70">
        <div
          className="h-full rounded-full bg-mint transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      <ol className="relative grid grid-cols-5 gap-2">
        {STEP_LABELS.map((label, i) => {
          const Icon = STEP_ICONS[i]
          const current = step === i
          const done = i < step
          return (
            <li key={label} className="min-w-0">
              <button
                type="button"
                onClick={() => onPick(i as DemoStep)}
                aria-current={current ? 'step' : undefined}
                title={`${i + 1}. ${label}`}
                className="group flex w-full flex-col items-center gap-2 rounded-xl px-2 pt-0.5 pb-1.5 text-center outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <span
                  aria-hidden
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none ${
                    current
                      ? 'bcd-ring bg-ink text-paper'
                      : done
                        ? 'bg-mint text-paper'
                        : 'border-2 border-line bg-paper text-muted group-hover:border-ink group-hover:text-ink'
                  }`}
                >
                  {done ? <TickIcon className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                </span>
                <span className="min-w-0">
                  <span className={`block text-base font-semibold leading-tight ${done ? 'text-mint' : 'text-ink'}`}>
                    {i + 1}. {SHORT_LABELS[i]}
                  </span>
                  <span className={`mt-0.5 block text-base leading-tight ${current ? 'font-semibold text-gold' : 'text-muted'}`}>
                    {current ? 'Now' : done ? 'Done' : STEP_BLURBS[i]}
                  </span>
                </span>
                <span className="sr-only">{label}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
