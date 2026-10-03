/** Step 5: closing screen. Owned by the architect; content from docs/DEMO_SCRIPT.md and docs/CONTRACT.md. */
export default function CloseScreen() {
  return (
    <section className="mx-auto max-w-6xl space-y-7 py-5 text-base">
      <p className="text-lg font-semibold uppercase tracking-wider text-brown">A practical next step</p>
      <h1 className="max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl">
        Start with one corridor.
        <br />
        Build on the operators' platform.
      </h1>
      <div className="rounded-xl bg-ink p-6 text-paper">
        <h2 className="text-2xl font-semibold">Proposed pilot: Nigeria to Benin through Seme</h2>
        <p className="mt-3 text-lg">
          Verify a card, report one incident, follow the bureau handshake and close card-issuance gaps.
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <article className="rounded-xl border border-line bg-paper p-6">
          <h2 className="text-2xl font-semibold">1. Confirm the interfaces</h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-lg">
            <li>Card-verification sandbox and required fields.</li>
            <li>Incident intake and claim-status updates.</li>
            <li>Card allocation, policy channels and quarterly returns.</li>
          </ul>
        </article>
        <article className="rounded-xl border border-line bg-paper p-6">
          <h2 className="text-2xl font-semibold">2. Agree the operating rules</h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-lg">
            <li>Hosting, privacy and access permissions.</li>
            <li>Short-code reporting approval.</li>
            <li>Turnaround clocks, escalation and regional card transmission.</li>
          </ul>
        </article>
        <article className="rounded-xl border border-line bg-paper p-6">
          <h2 className="text-2xl font-semibold">3. Name the working group</h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-lg">
            <li>Nigerian and Benin bureau focal points.</li>
            <li>Operators' technical and claims leads.</li>
            <li>Pilot insurers, intermediaries and ArkBuilders Consulting.</li>
          </ul>
        </article>
      </div>
      <p className="rounded-xl border border-brown bg-brown/5 p-5 text-xl font-semibold">
        Meeting decision: nominate the working group, confirm a sandbox contact and agree a pilot-scoping session.
      </p>
      <p className="text-lg text-muted">
        Proposal for discussion. Live integration follows confirmation of the operators' API and approvals.
      </p>
    </section>
  )
}
