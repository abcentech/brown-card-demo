import type { ClockReading } from './claimLogic'

const TONES = {
  mint: { ring: 'stroke-mint', track: 'stroke-mint/20', text: 'text-mint' },
  gold: { ring: 'stroke-gold', track: 'stroke-gold/25', text: 'text-gold' },
  clay: { ring: 'stroke-clay', track: 'stroke-clay/20', text: 'text-clay' },
  done: { ring: 'stroke-muted', track: 'stroke-line', text: 'text-muted' },
} as const

/** Days elapsed against the insurer deadline as a ring with the day count inside. Mint, amber at 60%, red when past. */
export default function TurnaroundClock({ reading, large = false }: { reading: ClockReading; large?: boolean }) {
  const t = TONES[reading.tone]
  const pct = Math.min(100, Math.round(reading.ratio * 100))
  const size = large ? 132 : 52
  const stroke = large ? 11 : 5
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - Math.min(1, reading.ratio))
  return (
    <div
      className={`flex items-center ${large ? 'gap-5' : 'gap-3'}`}
      aria-label={`Turnaround: day ${reading.elapsedDays} of ${reading.deadlineDays}. ${reading.label}`}
    >
      <div
        className="relative shrink-0"
        style={{ width: size, height: size }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={`Day ${reading.elapsedDays} of ${reading.deadlineDays}`}
      >
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90" aria-hidden focusable="false">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className={t.track} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className={`${t.ring} clock-ring`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none tabular-nums">
          <span className={`font-bold text-ink ${large ? 'text-4xl' : 'text-base'}`}>{reading.elapsedDays}</span>
          {large && <span className="mt-1 text-base text-muted">of {reading.deadlineDays}</span>}
        </div>
      </div>
      <div className="min-w-0 leading-tight">
        <div className={`whitespace-nowrap font-semibold text-ink ${large ? 'text-lg' : 'text-base'}`}>
          Day {reading.elapsedDays} <span className="font-normal text-muted">of {reading.deadlineDays}</span>
        </div>
        <div className={`font-semibold ${t.text} ${large ? 'text-lg' : 'text-base'}`}>{reading.label}</div>
      </div>
    </div>
  )
}
