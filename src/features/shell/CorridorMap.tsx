import { useReducedMotion } from './useClock'

const ROUTE = 'M 78 182 C 150 118, 232 158, 320 118 C 400 82, 486 104, 562 164'

/**
 * Hand-drawn style map of the pilot corridor: Lagos, the Seme–Krake crossing, Cotonou.
 * Inline SVG, theme tokens only; a pulsing dot travels the route (static when motion is reduced).
 * Shared by the opening moment and the close screen.
 */
export default function CorridorMap({
  tone = 'light',
  className = '',
  caption = true,
}: {
  tone?: 'light' | 'dark'
  className?: string
  caption?: boolean
}) {
  const reduce = useReducedMotion()
  const dark = tone === 'dark'
  const text = dark ? 'var(--color-paper)' : 'var(--color-ink)'
  const faint = dark ? 'rgba(245, 242, 233, 0.32)' : 'rgba(18, 38, 30, 0.28)'
  const soft = dark ? 'rgba(245, 242, 233, 0.62)' : 'var(--color-muted)'
  const dot = dark ? 'var(--color-paper)' : 'var(--color-mint)'

  return (
    <svg
      viewBox="0 0 640 270"
      role="img"
      aria-label="Pilot corridor: Lagos to Cotonou through the Seme–Krake crossing"
      className={className}
      fontFamily="inherit"
    >
      {/* Gulf of Guinea coast, loosely sketched */}
      <path d="M 14 236 Q 110 214 206 238 T 400 242 T 626 230" fill="none" stroke={faint} strokeWidth={2} strokeDasharray="7 9" strokeLinecap="round" />
      <path d="M 30 254 Q 120 240 230 256 T 440 258 T 620 250" fill="none" stroke={faint} strokeWidth={1.5} strokeDasharray="3 10" strokeLinecap="round" />

      {/* Border between Nigeria and Benin */}
      <path d="M 322 30 L 326 86 L 316 150 L 324 222" fill="none" stroke={faint} strokeWidth={2} strokeDasharray="2 8" strokeLinecap="round" />
      <text x={300} y={30} textAnchor="end" fill={soft} fontSize={16} fontWeight={700} letterSpacing={3}>
        NIGERIA
      </text>
      <text x={346} y={30} fill={soft} fontSize={16} fontWeight={700} letterSpacing={3}>
        BENIN
      </text>

      {/* Route: faint sketch line underneath, gold line drawn on top */}
      <path d={ROUTE} fill="none" stroke={faint} strokeWidth={9} strokeLinecap="round" opacity={0.35} />
      <path d={ROUTE} fill="none" stroke="var(--color-gold)" strokeWidth={4.5} strokeLinecap="round" pathLength={1} className="bcd-draw" />

      {/* Lagos */}
      <circle cx={78} cy={182} r={13} fill={dark ? 'var(--color-paper)' : 'var(--color-ink)'} />
      <circle cx={78} cy={182} r={5} fill={dark ? 'var(--color-ink)' : 'var(--color-paper)'} />
      <text x={78} y={216} textAnchor="middle" fill={text} fontSize={20} fontWeight={700}>
        Lagos
      </text>
      <text x={78} y={236} textAnchor="middle" fill={soft} fontSize={16}>
        card issued
      </text>

      {/* Seme–Krake crossing */}
      <circle cx={320} cy={118} r={24} fill="none" stroke="var(--color-gold)" strokeWidth={2} opacity={0.5} />
      <circle cx={320} cy={118} r={14} fill="var(--color-gold)" />
      <circle cx={320} cy={118} r={5} fill="var(--color-ink)" />
      <text x={320} y={78} textAnchor="middle" fill={text} fontSize={20} fontWeight={700}>
        Seme–Krake
      </text>
      <text x={320} y={160} textAnchor="middle" fill={soft} fontSize={16}>
        accident reported
      </text>

      {/* Cotonou */}
      <circle cx={562} cy={164} r={13} fill="var(--color-brown)" />
      <circle cx={562} cy={164} r={5} fill="var(--color-paper)" />
      <text x={562} y={198} textAnchor="middle" fill={text} fontSize={20} fontWeight={700}>
        Cotonou
      </text>
      <text x={562} y={218} textAnchor="middle" fill={soft} fontSize={16}>
        claim handled
      </text>

      {/* Travelling dot */}
      {reduce ? (
        <circle cx={200} cy={146} r={7} fill={dot} />
      ) : (
        <g>
          <circle r={14} fill={dot} className="bcd-pulse">
            <animateMotion dur="7s" repeatCount="indefinite" path={ROUTE} calcMode="linear" />
          </circle>
          <circle r={7} fill={dot} stroke={dark ? 'var(--color-ink)' : 'var(--color-paper)'} strokeWidth={2}>
            <animateMotion dur="7s" repeatCount="indefinite" path={ROUTE} calcMode="linear" />
          </circle>
        </g>
      )}

      {caption && (
        <text x={320} y={264} textAnchor="middle" fill={soft} fontSize={16}>
          Proposed pilot corridor · stylised, not to scale
        </text>
      )}
    </svg>
  )
}
