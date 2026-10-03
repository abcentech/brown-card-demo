import type { SVGProps } from 'react'

const base: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

/** Card, phone, dashboard, gauge, handshake: one small line icon per demo step. */
export const STEP_ICONS = [
  (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 9.5h19" />
      <path d="M6 15h4" />
    </svg>
  ),
  (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path d="M10.5 18.5h3" />
      <path d="M10 5.5h4" />
    </svg>
  ),
  (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}>
      <rect x="2.5" y="3.5" width="19" height="14" rx="2" />
      <path d="M7 14v-3M12 14V8M17 14v-5" />
      <path d="M9 21h6" />
    </svg>
  ),
  (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}>
      <path d="M4 17a8 8 0 1 1 16 0" />
      <path d="M12 17l4.5-5.5" />
      <circle cx="12" cy="17" r="1.3" fill="currentColor" />
      <path d="M4 17h2M18 17h2" />
    </svg>
  ),
  (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}>
      <path d="M2.5 8.5 7 6l4.5 2.5 3-2 5 2.5" />
      <path d="M7 6l5.5 6 2.5-1.5" />
      <path d="M2.5 8.5 7 15l3 2.5 2.5-2.5" />
      <path d="M19.5 9l-4 6-2 1.5" />
      <path d="M10 17.5l2-2M13 15l2-2" />
    </svg>
  ),
] as const

export function TickIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2.6} {...p}>
      <path d="M5 12.5l4.2 4.2L19 7.5" />
    </svg>
  )
}
