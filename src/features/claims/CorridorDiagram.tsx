import type { Claim, Stage } from '../../shared/types'
import { HANDSHAKE, insurerName } from './claimLogic'

type LinkState = 'pending' | 'active' | 'done'
type NodeTone = 'pending' | 'active' | 'done' | 'clay'

/** What the insurer has done at each stage; the clock belongs to them. */
export const INSURER_STATUS: Record<Stage, string> = {
  0: 'Clock running',
  1: 'Card confirmed',
  2: 'Reserve set',
  3: 'Offer funded',
  4: 'Reimbursed',
}

/** Which link in the corridor is carrying the work at this stage. */
export function linkStates(stage: Stage | null): { handshake: LinkState; insurer: LinkState } {
  if (stage === null) return { handshake: 'pending', insurer: 'pending' }
  if (stage === 0) return { handshake: 'active', insurer: 'pending' }
  if (stage === 1) return { handshake: 'done', insurer: 'active' }
  if (stage === 4) return { handshake: 'done', insurer: 'done' }
  return { handshake: 'active', insurer: 'done' }
}

const LINE: Record<LinkState, { cls: string; dash?: string; width: number }> = {
  pending: { cls: 'stroke-line', dash: '2 7', width: 3 },
  active: { cls: 'stroke-mint corridor-flow', dash: '9 7', width: 4 },
  done: { cls: 'stroke-mint', width: 4 },
}

function HLink({ state }: { state: LinkState }) {
  const l = LINE[state]
  return (
    <svg viewBox="0 0 56 24" className="h-6 w-full self-center" aria-hidden focusable="false">
      <line x1="4" y1="12" x2="52" y2="12" className={l.cls} strokeWidth={l.width} strokeDasharray={l.dash} strokeLinecap="round" />
      <circle cx="4" cy="12" r="3.5" className={state === 'pending' ? 'fill-line' : 'fill-mint'} />
      <circle cx="52" cy="12" r="3.5" className={state === 'pending' ? 'fill-line' : 'fill-mint'} />
    </svg>
  )
}

function VLink({ state, clay = false }: { state: LinkState; clay?: boolean }) {
  const l = LINE[state]
  const dot = clay ? 'fill-clay' : state === 'pending' ? 'fill-line' : 'fill-mint'
  const cls = clay ? 'stroke-clay corridor-flow' : l.cls
  return (
    <svg viewBox="0 0 24 40" className="mx-auto h-10 w-6" aria-hidden focusable="false">
      <line x1="12" y1="4" x2="12" y2="36" className={cls} strokeWidth={l.width} strokeDasharray={l.dash} strokeLinecap="round" />
      <circle cx="12" cy="4" r="3.5" className={dot} />
      <circle cx="12" cy="36" r="3.5" className={dot} />
    </svg>
  )
}

const PILL: Record<NodeTone, string> = {
  pending: 'bg-stone text-muted',
  active: 'bg-mint text-paper',
  done: 'bg-mint/15 text-mint',
  clay: 'bg-clay text-paper',
}

function Node({ title, name, pill, tone, note }: { title: string; name: string; pill: string; tone: NodeTone; note?: string }) {
  return (
    <div
      className={`corridor-node min-w-0 rounded-xl border bg-paper p-3 ${
        tone === 'active' ? 'corridor-active border-mint' : tone === 'clay' ? 'border-clay' : 'border-line'
      }`}
    >
      <div className="text-base font-medium text-muted">{title}</div>
      <div className="truncate text-lg font-semibold leading-tight text-ink">{name}</div>
      {note && <div className="truncate text-base text-muted">{note}</div>}
      {/* Keyed on the text so a stage change replays the entrance. */}
      <div key={pill} className={`corridor-pill mt-2 inline-block max-w-full truncate rounded-full px-3 py-0.5 text-base font-semibold ${PILL[tone]}`}>
        {pill}
      </div>
    </div>
  )
}

/**
 * The corridor: issuing bureau (Nigeria) on the left, handling bureau (accident country) on the right,
 * the insurer under the issuing bureau and the Council of Bureaux under the handling bureau.
 * With no claim the diagram sits in its neutral state.
 */
export default function CorridorDiagram({ claim }: { claim: Claim | null }) {
  const stage: Stage | null = claim ? claim.stage : null
  const links = linkStates(stage)
  const paid = stage === 4
  const toneFor = (link: LinkState): NodeTone => (link === 'active' ? 'active' : link === 'done' ? 'done' : 'pending')
  const issuingTone: NodeTone = paid ? 'done' : links.handshake === 'active' || links.insurer === 'active' ? 'active' : stage === null ? 'pending' : 'done'
  const escalated = !!claim?.escalated

  return (
    <div
      className="grid grid-cols-[minmax(0,1fr)_3.25rem_minmax(0,1fr)] grid-rows-[auto_2.5rem_auto]"
      role="img"
      aria-label={
        claim
          ? `Corridor: ${claim.issuingBureau} ${HANDSHAKE[claim.stage].issuing}; ${claim.handlingBureau} ${HANDSHAKE[claim.stage].handling}; ${insurerName(claim.insurerId)} ${INSURER_STATUS[claim.stage]}`
          : 'Corridor diagram, waiting for a claim'
      }
    >
      <Node
        title="Issuing bureau"
        name={claim?.issuingBureau ?? 'Nigeria Bureau'}
        pill={stage === null ? 'Waiting' : HANDSHAKE[stage].issuing}
        tone={issuingTone}
      />
      <HLink state={links.handshake} />
      <Node
        title="Handling bureau"
        name={claim?.handlingBureau ?? 'Local bureau'}
        note={claim ? `Accident in ${claim.accidentCountry}` : undefined}
        pill={stage === null ? 'Waiting' : HANDSHAKE[stage].handling}
        tone={paid ? 'done' : toneFor(links.handshake)}
      />
      <VLink state={links.insurer} />
      <span aria-hidden />
      <VLink state={escalated ? 'active' : 'pending'} clay={escalated} />
      <Node
        title="Insurer"
        name={claim ? insurerName(claim.insurerId) : 'Insurer'}
        pill={stage === null ? 'Waiting' : INSURER_STATUS[stage]}
        tone={paid ? 'done' : toneFor(links.insurer)}
      />
      <span aria-hidden />
      <Node
        title="Council of Bureaux"
        name={escalated ? 'Following the claim' : 'Not involved'}
        pill={escalated ? 'Escalated' : 'Clear'}
        tone={escalated ? 'clay' : 'pending'}
      />
    </div>
  )
}
