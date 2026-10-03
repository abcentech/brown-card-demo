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

/** The claims list. Rows select on click; the ref is a button so the keyboard works; arrivals get the gold fade. */
export default function ClaimsTable({ claims, now, selectedRef, freshRefs, onSelect }: Props) {
  if (claims.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-paper p-8 text-center text-lg text-muted">
        No claims yet. Submit a report from the incident reporter and it will appear here.
      </div>
    )
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-paper">
      <table className="w-full min-w-[880px] border-collapse text-base">
        <thead>
          <tr className="border-b-2 border-line text-left text-base text-muted">
            <th scope="col" className="px-4 py-3 font-medium">Ref</th>
            <th scope="col" className="px-4 py-3 font-medium">Accident / handling bureau</th>
            <th scope="col" className="px-4 py-3 font-medium">Issuing bureau</th>
            <th scope="col" className="px-4 py-3 font-medium">Insurer</th>
            <th scope="col" className="px-4 py-3 font-medium">Stage</th>
            <th scope="col" className="w-[260px] px-4 py-3 font-medium">Turnaround clock</th>
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
                aria-selected={selected}
                className={`cursor-pointer border-b border-line align-middle transition-colors last:border-b-0 hover:bg-stone/70 ${
                  selected ? 'bg-stone' : ''
                } ${fresh ? 'claim-arrival' : ''}`}
              >
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelect(c.ref)
                    }}
                    aria-pressed={selected}
                    className="rounded font-mono text-lg font-bold text-brown underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  >
                    {c.ref}
                  </button>
                  {c.source === 'reporter' && (
                    <div className="mt-0.5 text-sm font-semibold uppercase tracking-wide text-gold">New from reporter</div>
                  )}
                  {c.escalated && <div className="mt-0.5 text-sm font-semibold text-clay">Escalated</div>}
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-ink">{c.accidentCountry}</div>
                  <div className="text-muted">{c.handlingBureau}</div>
                </td>
                <td className="px-4 py-3 text-ink">{c.issuingBureau}</td>
                <td className="px-4 py-3 text-ink">{insurerName(c.insurerId)}</td>
                <td className="px-4 py-3">
                  <StageTracker stage={c.stage} />
                  <div className="mt-1 text-sm text-muted">Stage {c.stage + 1} of 5</div>
                </td>
                <td className="px-4 py-3">
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
