import type { ClockReading } from './claimLogic'

const TONES = {
  mint: { bar: 'bg-mint', text: 'text-mint', track: 'bg-mint/20' },
  gold: { bar: 'bg-gold', text: 'text-gold', track: 'bg-gold/25' },
  clay: { bar: 'bg-clay', text: 'text-clay', track: 'bg-clay/20' },
  done: { bar: 'bg-muted', text: 'text-muted', track: 'bg-line' },
} as const

/** Days elapsed against the insurer deadline. Mint, amber at 60%, red when past. */
export default function TurnaroundClock({ reading, large = false }: { reading: ClockReading; large?: boolean }) {
  const t = TONES[reading.tone]
  const pct = Math.min(100, Math.round(reading.ratio * 100))
  return (
    <div
      className={large ? 'space-y-2' : 'space-y-1'}
      aria-label={`Turnaround: day ${reading.elapsedDays} of ${reading.deadlineDays}. ${reading.label}`}
    >
      <div className={`flex items-baseline justify-between gap-3 ${large ? 'text-lg' : 'text-base'}`}>
        <span className="font-semibold tabular-nums text-ink">
          Day {reading.elapsedDays} <span className="font-normal text-muted">of {reading.deadlineDays}</span>
        </span>
        <span className={`font-semibold ${t.text}`}>{reading.label}</span>
      </div>
      <div
        className={`overflow-hidden rounded-full ${t.track} ${large ? 'h-3' : 'h-2'}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div className={`h-full rounded-full ${t.bar} transition-[width] duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
