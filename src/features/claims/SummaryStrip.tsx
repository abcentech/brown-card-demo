import type { Summary } from './claimLogic'
import { useCountUp } from './useCountUp'

interface Card {
  label: string
  value: number
  note: string
  tone: string
  bar: string
}

function BigNumber({ value, tone }: { value: number; tone: string }) {
  const shown = useCountUp(value, 500)
  return <div className={`mt-1 text-5xl font-bold leading-none tabular-nums ${tone}`}>{Math.round(shown)}</div>
}

/** Three big numbers for the projector: open claims, past deadline, average age. They count up on change. */
export default function SummaryStrip({ summary }: { summary: Summary }) {
  const cards: Card[] = [
    { label: 'Open claims', value: summary.open, note: `${summary.total} in total`, tone: 'text-ink', bar: 'bg-brown' },
    {
      label: 'Past deadline',
      value: summary.pastDeadline,
      note: summary.pastDeadline ? 'needs attention' : 'none overdue',
      tone: summary.pastDeadline ? 'text-clay' : 'text-mint',
      bar: summary.pastDeadline ? 'bg-clay' : 'bg-mint',
    },
    { label: 'Average age', value: summary.averageAgeDays, note: 'days since notified', tone: 'text-ink', bar: 'bg-gold' },
  ]
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" role="list" aria-label="Summary">
      {cards.map((c) => (
        <div key={c.label} role="listitem" className="cl-card relative overflow-hidden rounded-xl border border-line bg-paper px-5 py-4">
          <span aria-hidden className={`absolute inset-y-0 left-0 w-1.5 ${c.bar}`} />
          <div className="text-base font-medium text-muted">{c.label}</div>
          <BigNumber value={c.value} tone={c.tone} />
          <div className="mt-2 text-base text-muted">{c.note}</div>
        </div>
      ))}
    </div>
  )
}
