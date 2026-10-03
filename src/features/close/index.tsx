import { CorridorMap, STEP_ICONS } from '../shell'

const CARDS = [
  {
    icon: STEP_ICONS[0],
    title: 'Confirm the interfaces',
    points: ['Card-verification sandbox and required fields.', 'Incident intake and claim-status updates.', 'Card allocation, policy channels and quarterly returns.'],
  },
  {
    icon: STEP_ICONS[3],
    title: 'Agree the operating rules',
    points: ['Hosting, privacy and access permissions.', 'Short-code reporting approval.', 'Turnaround clocks, escalation and regional card transmission.'],
  },
  {
    icon: STEP_ICONS[4],
    title: 'Name the working group',
    points: ['Nigerian and Benin bureau focal points.', "Operators' technical and claims leads.", 'Pilot insurers, intermediaries and ArkBuilders Consulting.'],
  },
] as const

/** Step 5: the finish. One corridor, three next steps, one decision. Content from docs/DEMO_SCRIPT.md and docs/CONTRACT.md. */
export default function CloseScreen() {
  return (
    <section className="mx-auto max-w-7xl space-y-6 py-1 text-base 2xl:space-y-8 2xl:py-4">
      <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
        <div className="bcd-rise">
          <p className="text-base font-semibold uppercase tracking-[0.22em] text-brown">A practical next step</p>
          <h1 className="mt-3 text-5xl font-bold leading-[1.04] tracking-tight 2xl:text-6xl">
            Start with one corridor.
            <br />
            Build on the operators' platform.
          </h1>
          <p className="mt-4 max-w-2xl text-xl leading-snug text-muted">
            Proposed pilot: Nigeria to Benin through Seme. Verify a card, report one incident, follow the bureau handshake and
            close card-issuance gaps.
          </p>
          <div className="bcd-rise bcd-shadow-lg mt-6 rounded-xl bg-ink p-5 text-paper" style={{ animationDelay: '600ms' }}>
            <p className="text-base font-semibold uppercase tracking-[0.22em] text-gold">Meeting decision</p>
            <p className="mt-1.5 text-xl font-semibold leading-snug 2xl:text-2xl">
              Nominate the working group, confirm a sandbox contact and agree a pilot-scoping session.
            </p>
          </div>
        </div>
        <div className="bcd-rise bcd-paper-wash rounded-xl border border-line p-4" style={{ animationDelay: '120ms' }}>
          <CorridorMap className="block h-auto w-full" />
        </div>
      </div>

      <ol className="grid gap-5 md:grid-cols-3">
        {CARDS.map((card, i) => {
          const Icon = card.icon
          return (
            <li
              key={card.title}
              className="bcd-rise bcd-shadow flex flex-col rounded-xl border border-line bg-paper p-6"
              style={{ animationDelay: `${240 + i * 120}ms` }}
            >
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink text-gold">
                  <Icon className="h-6 w-6" />
                </span>
                <h2 className="text-2xl font-semibold leading-tight">
                  <span className="text-gold">{i + 1}.</span> {card.title}
                </h2>
              </div>
              <ul className="mt-5 space-y-3 text-lg">
                {card.points.map((p) => (
                  <li key={p} className="flex gap-3">
                    <span aria-hidden className="mt-[0.6em] h-2 w-2 shrink-0 rounded-full bg-mint" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </li>
          )
        })}
      </ol>

      <p className="bcd-rise flex flex-wrap items-center justify-between gap-3 text-lg text-muted" style={{ animationDelay: '740ms' }}>
        <span>Proposal for discussion. Live integration follows confirmation of the operators' API and approvals.</span>
        <span className="font-semibold text-ink">ArkBuilders Consulting · illustrative data</span>
      </p>
    </section>
  )
}
