import { STAGES, type Stage } from '../../shared/types'

function Check() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden focusable="false">
      <path d="M3 8.5l3.2 3.2L13 5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Five numbered dots joined by a line that fills up to the current stage; compact for rows, labelled for the panel. */
export default function StageTracker({ stage, labelled = false }: { stage: Stage; labelled?: boolean }) {
  const last = STAGES.length - 1
  const fill = stage / last
  const dotPx = labelled ? 32 : 28
  // The line runs between the centres of the first and last dots.
  const inset = labelled ? '10%' : `${dotPx / 2}px`
  const span = labelled ? '80%' : `calc(100% - ${dotPx}px)`
  return (
    <ol
      className={`relative flex ${labelled ? 'items-start' : 'items-center justify-between'}`}
      style={labelled ? undefined : { width: dotPx * STAGES.length + 10 * last }}
      aria-label={`Stage ${stage + 1} of ${STAGES.length}: ${STAGES[stage]}`}
    >
      <span
        aria-hidden
        className="absolute h-1 -translate-y-1/2 rounded-full bg-line"
        style={{ left: inset, width: span, top: dotPx / 2 }}
      />
      <span
        aria-hidden
        className="stage-fill absolute h-1 -translate-y-1/2 rounded-full bg-mint"
        style={{ left: inset, width: `calc(${span} * ${fill})`, top: dotPx / 2 }}
      />
      {STAGES.map((name, i) => {
        const done = i < stage
        const current = i === stage
        const dot = done
          ? 'bg-mint border-mint text-paper'
          : current
            ? 'bg-brown border-brown text-paper ring-4 ring-gold/40'
            : 'bg-paper border-line text-muted'
        return (
          <li key={name} className={`relative z-10 flex ${labelled ? 'flex-1 flex-col items-center text-center' : 'items-center'}`} title={name}>
            <span
              aria-hidden
              className={`stage-dot flex shrink-0 items-center justify-center rounded-full border-2 text-base font-bold ${dot}`}
              style={{ width: dotPx, height: dotPx }}
            >
              {done ? <Check /> : i + 1}
            </span>
            {labelled && (
              <span className={`mt-1.5 text-base leading-tight ${current ? 'font-semibold text-ink' : 'text-muted'}`}>{name}</span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
