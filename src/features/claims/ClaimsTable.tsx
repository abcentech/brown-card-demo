import type { Claim } from '../../shared/types'
import { insurerName, readClock } from './claimLogic'
import StageTracker from './StageTracker'
import TurnaroundClock from './TurnaroundClock'

interface Props {
  claims: Claim[]
  now: number
  selectedRef: string | null
  freshRefs: ReadonlySet<string>
  onSelect: (ref: string) => void
}

function PhoneTag() {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-gold/15 px-2 py-0.5 text-base font-semibold text-brown">
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden focusable="false">
        <rect x="4" y="1.5" width="8" height="13" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="8" cy="12" r="0.9" fill="currentColor" />
      </svg>
      From the phone
    </span>
  )
}

/**
 * The claims list. Rows select on click; the ref is a button so the keyboard works; arrivals get the gold fade.
 * The issuing bureau column folds away when the container is narrow (it is always the Nigeria Bureau).
 */
export default function ClaimsTable({ claims, now, selectedRef, freshRefs, onSelect }: Props) {
  if (claims.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-paper p-8 text-center text-lg text-muted">
        No claims yet. Submit a report from the incident reporter and it will appear here.
      </div>
    )
  }
  return (
    <div className="cl-card @container overflow-hidden rounded-xl border border-line bg-paper">
      <table className="w-full border-collapse text-base">
        <thead>
          <tr className="border-b-2 border-line bg-stone/50 text-left text-base text-muted">
            <th scope="col" className="px-3 py-3 font-medium">Ref</th>
            <th scope="col" className="px-3 py-3 font-medium">Accident / handling bureau</th>
            <th scope="col" className="px-3 py-3 font-medium @max-5xl:hidden">Issuing bureau</th>
            <th scope="col" className="px-3 py-3 font-medium">Insurer</th>
            <th scope="col" className="px-3 py-3 font-medium">Stage</th>
            <th scope="col" className="px-3 py-3 font-medium">Turnaround clock</th>
          </tr>
        </thead>
        <tbody>
          {claims.map((c) => {
            const selected = c.ref === selectedRef
            const fresh = freshRefs.has(c.ref)
            return (
              <tr
                key={c.ref}
                onClick={() => onSelect(c.ref)}
                data-selected={selected || undefined}
                className={`cursor-pointer border-b border-line align-middle transition-colors last:border-b-0 hover:bg-stone/70 ${
                  selected ? 'bg-stone shadow-[inset_4px_0_0_var(--color-brown)]' : ''
                } ${fresh ? 'claim-arrival' : ''}`}
              >
                <td className="px-3 py-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelect(c.ref)
                    }}
                    aria-pressed={selected}
                    className="whitespace-nowrap rounded font-mono text-lg font-bold text-brown underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  >
                    {c.ref}
                  </button>
                  {c.source === 'reporter' && (
                    <div className="mt-1 flex flex-col items-start gap-0.5">
                      <PhoneTag />
                      <span className="text-base font-semibold text-gold">New from reporter</span>
                    </div>
                  )}
                  {c.escalated && <div className="mt-0.5 text-base font-semibold text-clay">Escalated</div>}
                </td>
                <td className="px-3 py-3">
                  <div className="font-semibold text-ink">{c.accidentCountry}</div>
                  <div className="text-muted">{c.handlingBureau}</div>
                </td>
                <td className="px-3 py-3 text-ink @max-5xl:hidden">{c.issuingBureau}</td>
                <td className="px-3 py-3 text-ink">{insurerName(c.insurerId)}</td>
                <td className="px-3 py-3">
                  <StageTracker stage={c.stage} />
                  <div className="mt-1.5 whitespace-nowrap text-base text-muted">Stage {c.stage + 1} of 5</div>
                </td>
                <td className="px-3 py-3">
                  <TurnaroundClock reading={readClock(c, now)} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
