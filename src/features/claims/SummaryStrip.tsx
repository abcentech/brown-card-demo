import type { Summary } from './claimLogic'

/** Three big numbers for the projector: open claims, past deadline, average age. */
export default function SummaryStrip({ summary }: { summary: Summary }) {
  const cards = [
    { label: 'Open claims', value: String(summary.open), note: `${summary.total} in total`, tone: 'text-ink' },
    {
      label: 'Past deadline',
      value: String(summary.pastDeadline),
      note: summary.pastDeadline ? 'needs attention' : 'none overdue',
      tone: summary.pastDeadline ? 'text-clay' : 'text-mint',
    },
    { label: 'Average age', value: String(summary.averageAgeDays), note: 'days since notified', tone: 'text-ink' },
  ]
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" role="list" aria-label="Summary">
      {cards.map((c) => (
        <div key={c.label} role="listitem" className="rounded-xl border border-line bg-paper px-5 py-4">
          <div className="text-base font-medium text-muted">{c.label}</div>
          <div className={`mt-1 text-5xl font-bold leading-none tabular-nums ${c.tone}`}>{c.value}</div>
          <div className="mt-2 text-base text-muted">{c.note}</div>
        </div>
      ))}
    </div>
  )
}
