import { STAGES, type Stage } from '../../shared/types'

/** Five numbered dots with the current stage filled; compact for table rows, labelled for the panel. */
export default function StageTracker({ stage, labelled = false }: { stage: Stage; labelled?: boolean }) {
  return (
    <ol
      className={`flex items-start ${labelled ? 'gap-2' : 'gap-0'}`}
      aria-label={`Stage ${stage + 1} of ${STAGES.length}: ${STAGES[stage]}`}
    >
      {STAGES.map((name, i) => {
        const done = i < stage
        const current = i === stage
        const dot = done
          ? 'bg-mint border-mint text-paper'
          : current
            ? 'bg-brown border-brown text-paper ring-4 ring-gold/40'
            : 'bg-paper border-line text-muted'
        return (
          <li
            key={name}
            className={labelled ? 'flex flex-1 flex-col items-center text-center' : 'flex items-center'}
            title={name}
          >
            <span
              aria-hidden
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-base font-bold ${dot}`}
            >
              {done ? '✓' : i + 1}
            </span>
            {labelled && (
              <span className={`mt-1 text-base leading-tight ${current ? 'font-semibold text-ink' : 'text-muted'}`}>{name}</span>
            )}
            {!labelled && i < STAGES.length - 1 && <span aria-hidden className={`h-0.5 w-3 ${done ? 'bg-mint' : 'bg-line'}`} />}
          </li>
        )
      })}
    </ol>
  )
}
