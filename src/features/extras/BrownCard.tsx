// A physical-looking ECOWAS Brown Card, drawn with CSS only. No logos, flags or images.
import { INSURERS } from '../../shared/seed'
import type { IssuedPolicy } from '../../shared/types'

export const insurerName = (id: string) => INSURERS.find((i) => i.id === id)?.name ?? `Insurer ${id}`
export const coverLabel = (c: IssuedPolicy['cover']) => (c === 'comprehensive' ? 'Comprehensive' : 'Third party')

function Label({ children }: { children: string }) {
  return <div className="bc-gold text-[11px] font-semibold uppercase tracking-[0.18em]">{children}</div>
}

/** The issued card. The caller keys this on the card number so each new card flips in. */
export function BrownCard({ policy }: { policy: IssuedPolicy }) {
  return (
    <div className="bc-card bc-card-in relative flex w-full flex-col justify-between overflow-hidden p-5 sm:p-6" aria-label="Brown Card">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-bold leading-tight tracking-wide text-paper sm:text-lg">ECOWAS Brown Card</div>
          <div className="bc-gold text-[13px] font-medium italic leading-tight">Carte Brune CEDEAO</div>
        </div>
        <div className="text-right text-[11px] font-semibold uppercase leading-tight tracking-[0.18em] text-paper/80">
          Nigeria<br />National Bureau
        </div>
      </div>

      {/* Chip and number */}
      <div className="mt-3">
        <div className="bc-chip" aria-hidden />
        <div className="mt-3 break-all font-mono text-[clamp(1.35rem,3.6vw,2.1rem)] font-bold leading-none tracking-[0.06em] text-paper [text-shadow:0_1px_0_rgba(18,38,30,0.45)]">
          {policy.cardNumber}
        </div>
      </div>

      {/* Details */}
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-base leading-tight sm:grid-cols-[1.2fr_1fr_1fr]">
        <div className="min-w-0 col-span-2 sm:col-span-1">
          <Label>Holder</Label>
          <dd className="truncate font-semibold">{policy.holder}</dd>
        </div>
        <div className="min-w-0">
          <Label>Vehicle</Label>
          <dd className="truncate font-semibold">{policy.vehicle}</dd>
        </div>
        <div className="min-w-0">
          <Label>Insurer</Label>
          <dd className="truncate font-semibold">{insurerName(policy.insurerId)}</dd>
        </div>
        <div className="min-w-0 col-span-2 sm:col-span-2">
          <Label>Cover</Label>
          <dd className="truncate font-semibold">{coverLabel(policy.cover)}, {policy.termMonths} months</dd>
        </div>
        <div className="min-w-0">
          <Label>Valid to</Label>
          <dd className="font-mono font-semibold">{policy.validTo}</dd>
        </div>
      </dl>

      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border border-paper/10" aria-hidden />
      <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full border border-paper/10" aria-hidden />
    </div>
  )
}

/** Shown before the first card of the session is issued. */
export function GhostCard() {
  return (
    <div className="bc-card-ghost flex w-full flex-col justify-between p-5 text-muted sm:p-6" aria-label="No card issued yet">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-bold leading-tight tracking-wide">ECOWAS Brown Card</div>
          <div className="text-[13px] italic leading-tight">Carte Brune CEDEAO</div>
        </div>
        <span className="rounded-full border border-line px-3 py-0.5 text-[13px] font-semibold uppercase tracking-wider">Not yet issued</span>
      </div>
      <div className="mt-3 font-mono text-[clamp(1.35rem,3.6vw,2.1rem)] font-bold leading-none tracking-[0.06em]">NG-26-····-····-·</div>
      <p className="mt-4 text-base">Issue a policy and the card appears here, recorded on the register straight away.</p>
    </div>
  )
}
