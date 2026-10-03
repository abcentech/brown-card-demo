import { useEffect, useRef, useState } from 'react'
import { SCALE, TARGET_BAND, fmtInt, fmtPct, scalePosition } from './helpers'

/** Tween a number toward its target so the headline figure visibly counts up. */
function useTweened(target: number, ms = 800): number {
  const [value, setValue] = useState(target)
  const from = useRef(target)
  const raf = useRef(0)
  useEffect(() => {
    const start = performance.now()
    const begin = from.current
    if (begin === target) return
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms)
      const eased = 1 - Math.pow(1 - t, 3)
      const v = begin + (target - begin) * eased
      setValue(v)
      if (t < 1) raf.current = requestAnimationFrame(tick)
      else from.current = target
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, ms])
  return value
}

interface Props {
  pct: number
  openPolicies: number
  totalPolicies: number
  openBatches: number
}

/** Big compliance figure drawn against the 90 to 95% target band. Hand-made SVG, CSS transitions. */
export default function Headline({ pct, openPolicies, totalPolicies, openBatches }: Props) {
  const shown = useTweened(pct)
  const inBand = pct >= TARGET_BAND.low && pct <= TARGET_BAND.high
  const aboveBand = pct > TARGET_BAND.high
  const pos = scalePosition(pct)
  const bandLeft = scalePosition(TARGET_BAND.low)
  const bandRight = scalePosition(TARGET_BAND.high)
  const ticks = [85, 90, 95, 100]
  const tone = aboveBand ? 'text-mint' : inBand ? 'text-ink' : 'text-clay'
  const statusLine = aboveBand
    ? `Above the ${TARGET_BAND.low} to ${TARGET_BAND.high}% target band`
    : inBand
      ? `Inside the ${TARGET_BAND.low} to ${TARGET_BAND.high}% target band`
      : `Below the ${TARGET_BAND.low} to ${TARGET_BAND.high}% target band`

  return (
    <section className="rounded-xl border border-line bg-paper p-6" aria-labelledby="compliance-headline">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h2 id="compliance-headline" className="text-lg font-semibold uppercase tracking-wide text-muted">
            Motor policies carrying a Brown Card number
          </h2>
          <p className={`mt-1 font-semibold leading-none tabular-nums ${tone}`} style={{ fontSize: 'clamp(64px, 9vw, 120px)' }} aria-live="polite">
            {fmtPct(shown)}
          </p>
          <p className="mt-3 text-lg">{statusLine}</p>
        </div>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-lg">
          <dt className="text-muted">Policies without a card</dt>
          <dd className="text-right font-semibold tabular-nums text-clay">{fmtInt(openPolicies)}</dd>
          <dt className="text-muted">Open batches</dt>
          <dd className="text-right font-semibold tabular-nums">{fmtInt(openBatches)}</dd>
          <dt className="text-muted">Motor policies in force</dt>
          <dd className="text-right font-semibold tabular-nums">{fmtInt(totalPolicies)}</dd>
        </dl>
      </div>

      {/* Scale with the target band and the live marker */}
      <svg viewBox="0 0 1000 110" className="mt-6 w-full" role="img" aria-label={`${fmtPct(pct)}, target band ${TARGET_BAND.low} to ${TARGET_BAND.high}%`}>
        {/* track */}
        <rect x="0" y="40" width="1000" height="28" rx="6" className="fill-stone" />
        {/* target band */}
        <rect x={bandLeft * 10} y="40" width={(bandRight - bandLeft) * 10} height="28" className="fill-mint/25" />
        <line x1={bandLeft * 10} x2={bandLeft * 10} y1="34" y2="74" className="stroke-mint" strokeWidth="3" />
        <line x1={bandRight * 10} x2={bandRight * 10} y1="34" y2="74" className="stroke-mint" strokeWidth="3" />
        <text x={((bandLeft + bandRight) / 2) * 10} y="26" textAnchor="middle" className="fill-mint text-[20px] font-semibold">
          Target {TARGET_BAND.low} to {TARGET_BAND.high}%
        </text>
        {/* fill up to the current figure */}
        <rect
          x="0"
          y="40"
          height="28"
          rx="6"
          width={pos * 10}
          className={aboveBand ? 'fill-mint' : inBand ? 'fill-brown' : 'fill-clay'}
          style={{ transition: 'width 800ms cubic-bezier(.2,.8,.2,1)' }}
        />
        {/* marker */}
        <g style={{ transition: 'transform 800ms cubic-bezier(.2,.8,.2,1)', transform: `translateX(${pos * 10}px)` }}>
          <polygon points="0,34 -12,16 12,16" className="fill-ink" />
          <line x1="0" x2="0" y1="34" y2="74" className="stroke-ink" strokeWidth="4" />
          <polygon points="0,74 -12,92 12,92" className="fill-ink" />
        </g>
        {/* ticks */}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={scalePosition(t) * 10} x2={scalePosition(t) * 10} y1="68" y2="78" className="stroke-muted" strokeWidth="2" />
            <text
              x={scalePosition(t) * 10}
              y="104"
              textAnchor={t === SCALE.min ? 'start' : t === SCALE.max ? 'end' : 'middle'}
              className="fill-muted text-[20px]"
            >
              {t}%
            </text>
          </g>
        ))}
      </svg>
    </section>
  )
}
