import { useEffect, type ReactNode } from 'react'
import { useDemo } from '../../state/store'
import { STEP_LABELS, type DemoStep } from '../../shared/types'

function CloseScreen() {
  return <section className="mx-auto max-w-6xl space-y-7 py-5 text-base">
    <p className="font-semibold uppercase tracking-wider text-brown">A practical next step</p>
    <h1 className="max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl">Start with one corridor.<br />Build on the operators' platform.</h1>
    <div className="rounded-xl bg-ink p-6 text-paper"><h2 className="text-2xl font-semibold">Proposed pilot: Nigeria → Benin through Seme–Krake</h2><p className="mt-3 text-lg">Verify a card, report one incident, follow the bureau handshake and close card-issuance gaps.</p></div>
    <div className="grid gap-5 md:grid-cols-3">
      <article className="rounded-xl border border-line bg-paper p-6"><h2 className="text-2xl font-semibold">1. Confirm the interfaces</h2><ul className="mt-4 list-disc space-y-3 pl-5"><li>Card-verification sandbox and required fields.</li><li>Incident intake and claim-status updates.</li><li>Card allocation, policy channels and quarterly returns.</li></ul></article>
      <article className="rounded-xl border border-line bg-paper p-6"><h2 className="text-2xl font-semibold">2. Agree the operating rules</h2><ul className="mt-4 list-disc space-y-3 pl-5"><li>Hosting, privacy and access permissions.</li><li>Short-code reporting approval.</li><li>Turnaround clocks, escalation and regional card transmission.</li></ul></article>
      <article className="rounded-xl border border-line bg-paper p-6"><h2 className="text-2xl font-semibold">3. Name the working group</h2><ul className="mt-4 list-disc space-y-3 pl-5"><li>Nigerian and Benin bureau focal points.</li><li>Operators' technical and claims leads.</li><li>Pilot insurers, intermediaries and ArkBuilders Consulting.</li></ul></article>
    </div>
    <p className="rounded-xl border border-brown bg-brown/5 p-5 text-xl font-semibold">Meeting decision: nominate the working group, confirm a sandbox contact and agree a pilot-scoping session.</p>
    <p className="text-muted">Proposal for discussion. Live integration follows confirmation of the operators' API and approvals. If incident intake is unavailable, agree an import format for their claims dashboard.</p>
  </section>
}
export default function Shell({ children }: { children: ReactNode }) {
  const step = useDemo((s) => s.step)
  const setStep = useDemo((s) => s.setStep)
  const reset = useDemo((s) => s.reset)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target?.closest('input, textarea, select, [contenteditable="true"]') || e.ctrlKey || e.altKey || e.metaKey) return
      if (e.key >= '1' && e.key <= '5') { e.preventDefault(); setStep((Number(e.key) - 1) as DemoStep) }
      if (e.key.toLowerCase() === 'r' && e.shiftKey) { e.preventDefault(); reset() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setStep, reset])
  return <div className="flex min-h-full flex-col text-base">
    <div className="sticky top-0 z-20 bg-gold px-4 py-2 text-center font-semibold text-ink">Illustrative data · Demo of the operators' platform · Not a live system</div>
    <header className="border-b border-line bg-paper px-4 py-5 sm:px-7">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><div className="text-2xl font-semibold">The Brown Card as a service</div><div className="mt-1 text-muted">ArkBuilders Consulting · ECOWAS Brown Card demo</div></div><div className="flex flex-wrap items-center gap-3"><a href="?view=claims" target="_blank" rel="noreferrer" className="rounded-lg border border-line px-4 py-2 font-semibold hover:bg-stone">Open claims window ↗</a><button onClick={reset} className="rounded-lg border border-brown px-4 py-2 font-semibold text-brown hover:bg-stone">Reset demo</button></div></div>
      <nav className="mt-5 grid gap-2 sm:grid-cols-5" aria-label="Demo steps">{STEP_LABELS.map((label, i) => <button key={label} onClick={() => setStep(i as DemoStep)} aria-current={step === i ? 'step' : undefined} className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-left font-semibold ${step === i ? 'border-ink bg-ink text-paper' : 'border-line bg-stone/50 hover:bg-stone'}`}><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${step === i ? 'bg-paper text-ink' : 'bg-line/40'}`}>{i + 1}</span><span>{label}</span></button>)}</nav>
      <p className="mt-3 text-muted">Step {step + 1} of 5 · Keys 1–5 jump between screens · Shift+R resets the demo</p>
    </header>
    <main className="flex-1 p-4 sm:p-7">{step === 4 ? <CloseScreen /> : children}</main>
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-paper px-4 py-4 sm:px-7"><span className="text-muted">Illustrative demo · Offline-ready · Operator API to be confirmed</span><div className="flex gap-3"><button onClick={() => setStep(Math.max(0, step - 1) as DemoStep)} disabled={step === 0} className="rounded-lg border border-line px-4 py-2 font-semibold disabled:opacity-40">Previous</button><button onClick={() => setStep(Math.min(4, step + 1) as DemoStep)} disabled={step === 4} className="rounded-lg bg-ink px-5 py-2 font-semibold text-paper disabled:opacity-40">Next step →</button></div></footer>
  </div>
}
