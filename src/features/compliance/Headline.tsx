import { STARTING_COMPLIANCE_PCT } from '../../shared/seed'
import { SCALE, TARGET_BAND, fmtInt, fmtPct } from './helpers'
import { useTweened } from './hooks'

interface Props {
  pct: number
  openPolicies: number
  totalPolicies: number
  openBatches: number
}

// Gauge geometry in SVG user units.
const W = 420
const H = 238
const CX = 210
const CY = 200
const R = 150
const TRACK = 26
const HALF = Math.PI * R

const frac = (v: number) => Math.max(0, Math.min(1, (v - SCALE.min) / (SCALE.max - SCALE.min)))
const angle = (v: number) => Math.PI * (1 - frac(v))
const pt = (v: number, r: number): [number, number] => [CX + r * Math.cos(angle(v)), CY - r * Math.sin(angle(v))]
const arc = (from: number, to: number, r = R) => {
  const [x1, y1] = pt(from, r)
  const [x2, y2] = pt(to, r)
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
}

/** Points since the demo started, rounded to one decimal; 0 until the first back-fill. */
export function deltaSinceStart(pct: number): number {
  return Math.round((pct - STARTING_COMPLIANCE_PCT) * 10) / 10
}

export function DeltaChip({ pct, compact = false }: { pct: number; compact?: boolean }) {
  const delta = deltaSinceStart(pct)
  if (delta <= 0) return null
  return (
    <span
      className={`cc-rise inline-flex items-center gap-1 rounded-full bg-mint font-semibold text-paper ${compact ? 'px-2.5 py-0.5 text-base' : 'px-3 py-1 text-lg'}`}
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden focusable="false">
        <path d="M8 13V3M3.5 7.5L8 3l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      +{delta.toFixed(1)} pts since start
    </span>
  )
}

/** Hero compliance figure inside a semicircular gauge from 85 to 100 with the 90 to 95% band. Hand-made SVG. */
export default function Headline({ pct, openPolicies, totalPolicies, openBatches }: Props) {
  const shown = useTweened(pct)
  const inBand = pct >= TARGET_BAND.low && pct <= TARGET_BAND.high
  const aboveBand = pct > TARGET_BAND.high
  const tone = aboveBand ? 'text-mint' : inBand ? 'text-ink' : 'text-clay'
  const fillCls = aboveBand ? 'stroke-mint' : inBand ? 'stroke-brown' : 'stroke-clay'
  const statusLine = aboveBand
    ? `Above the ${TARGET_BAND.low} to ${TARGET_BAND.high}% target band`
    : inBand
      ? `Inside the ${TARGET_BAND.low} to ${TARGET_BAND.high}% target band`
      : `Below the ${TARGET_BAND.low} to ${TARGET_BAND.high}% target band`
  const ticks = [85, 90, 95, 100]

  return (
    <section className="cc-card rounded-xl border border-line bg-paper p-6" aria-labelledby="compliance-headline">
      <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* Gauge with the figure inside */}
        <div className="relative mx-auto w-full max-w-[640px]">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            role="img"
            aria-label={`${fmtPct(pct)}, target band ${TARGET_BAND.low} to ${TARGET_BAND.high}%, scale ${SCALE.min} to ${SCALE.max}%`}
          >
            {/* track */}
            <path d={arc(SCALE.min, SCALE.max)} fill="none" strokeWidth={TRACK} className="stroke-stone" />
            {/* target band */}
            <path d={arc(TARGET_BAND.low, TARGET_BAND.high)} fill="none" strokeWidth={TRACK} className="stroke-mint/30" />
            {/* fill up to the current figure */}
            <path
              d={arc(SCALE.min, SCALE.max)}
              fill="none"
              strokeWidth={TRACK}
              strokeDasharray={HALF}
              strokeDashoffset={HALF * (1 - frac(pct))}
              className={`cc-gauge-fill ${fillCls}`}
            />
            {/* band edges */}
            {[TARGET_BAND.low, TARGET_BAND.high].map((v) => {
              const [x1, y1] = pt(v, R - TRACK / 2 - 4)
              const [x2, y2] = pt(v, R + TRACK / 2 + 4)
              return <line key={v} x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-mint" strokeWidth="3" strokeLinecap="round" />
            })}
            <text x={CX} y="18" textAnchor="middle" className="fill-mint text-[18px] font-semibold">
              Target {TARGET_BAND.low} to {TARGET_BAND.high}%
            </text>
            {/* ticks */}
            {ticks.map((t) => {
              const [x1, y1] = pt(t, R + TRACK / 2 + 6)
              const [x2, y2] = pt(t, R + TRACK / 2 + 14)
              const end = t === SCALE.min || t === SCALE.max
              const [lx, ly] = end ? [pt(t, R)[0], CY + 26] : pt(t, R + 50)
              return (
                <g key={t}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-muted" strokeWidth="2" />
                  <text x={lx} y={end ? ly : ly + 6} textAnchor="middle" className="fill-muted text-[18px]">
                    {t}%
                  </text>
                </g>
              )
            })}
            {/* marker: a bar across the track, rotated to the value */}
            <g
              className="cc-gauge-marker"
              style={{ transform: `rotate(${frac(pct) * 180}deg)`, transformOrigin: `${CX}px ${CY}px`, transformBox: 'view-box' }}
            >
              <line x1={CX - R - 22} y1={CY} x2={CX - R + 22} y2={CY} className="stroke-ink" strokeWidth="5" strokeLinecap="round" />
            </g>
          </svg>
          {/* the figure, centred in the gauge */}
          <div className="pointer-events-none absolute inset-x-0 top-[36%] flex flex-col items-center gap-2 text-center">
            <p
              id="compliance-pct"
              data-testid="compliance-pct"
              className={`font-semibold leading-none tabular-nums ${tone}`}
              style={{ fontSize: 'clamp(56px, 6.4vw, 96px)' }}
              aria-live="polite"
            >
              {fmtPct(shown)}
            </p>
            <DeltaChip pct={pct} />
          </div>
        </div>

        {/* the words */}
        <div>
          <h2 id="compliance-headline" className="text-lg font-semibold uppercase tracking-wide text-muted">
            Motor policies carrying a Brown Card number
          </h2>
          <p className="mt-2 text-2xl font-semibold leading-tight">{statusLine}</p>
          <p className="mt-2 text-lg text-muted">Scale {SCALE.min} to {SCALE.max}%. The last few points are the ones NAICOM asks about.</p>
          <dl className="mt-5 grid grid-cols-[1fr_auto] gap-x-8 gap-y-3 text-lg">
            <dt className="text-muted">Policies without a card</dt>
            <dd className="text-right font-semibold tabular-nums text-clay">{fmtInt(openPolicies)}</dd>
            <dt className="text-muted">Open batches</dt>
            <dd className="text-right font-semibold tabular-nums">{fmtInt(openBatches)}</dd>
            <dt className="text-muted">Motor policies in force</dt>
            <dd className="text-right font-semibold tabular-nums">{fmtInt(totalPolicies)}</dd>
          </dl>
        </div>
      </div>
    </section>
  )
}
