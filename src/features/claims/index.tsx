import { useEffect, useRef, useState } from 'react'
import { platform } from '../../platform'
import { useDemo } from '../../state/store'
import { STAGES, type Claim } from '../../shared/types'

const DAY = 86_400_000
const age = (claim: Claim, now: number) => Math.max(0, Math.floor((now - Date.parse(claim.notifiedAt)) / DAY))
function Clock({ claim, now }: { claim: Claim; now: number }) {
  const days = age(claim, now)
  const past = days > claim.deadlineDays
  const near = days >= claim.deadlineDays * 0.6
  return <div className={`rounded-lg border p-3 ${claim.stage === 4 ? 'border-line bg-stone' : past ? 'border-clay bg-clay/10 text-clay' : near ? 'border-gold bg-gold/10 text-brown' : 'border-mint/30 bg-mint/5'}`}>
    <div className="font-semibold">{days} / {claim.deadlineDays} days</div>
    <div>{claim.stage === 4 ? 'Paid · days since notification' : past ? `${days - claim.deadlineDays} days past target` : `${claim.deadlineDays - days} days remaining`}</div>
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-line/50"><div className={`h-full ${past ? 'bg-clay' : near ? 'bg-gold' : 'bg-mint'}`} style={{ width: `${Math.min(100, days / claim.deadlineDays * 100)}%` }} /></div>
  </div>
}
export default function ClaimsScreen() {
  const claims = useDemo((s) => s.claims)
  const revision = useDemo((s) => s.revision)
  const [selectedRef, setSelectedRef] = useState(claims[0]?.ref ?? '')
  const [newRefs, setNewRefs] = useState<string[]>([])
  const [escalated, setEscalated] = useState<string[]>([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now())
  const previous = useRef(claims)
  const selected = claims.find((c) => c.ref === selectedRef) ?? claims[0]
  const ordered = [...claims].sort((a, b) => Date.parse(b.notifiedAt) - Date.parse(a.notifiedAt))
  const open = claims.filter((c) => c.stage < 4)
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 30_000); return () => window.clearInterval(timer) }, [])
  useEffect(() => {
    const arrivals = claims.filter((c) => !previous.current.some((p) => p.ref === c.ref)).map((c) => c.ref)
    const reset = claims.every((c) => c.source === 'seed') && claims.some((c) => previous.current.find((p) => p.ref === c.ref)?.notifiedAt !== c.notifiedAt)
    previous.current = claims
    if (reset) { setEscalated([]); setNewRefs([]); setSelectedRef(claims[0]?.ref ?? ''); setError('') }
    if (!arrivals.length || reset) return
    setNewRefs(arrivals); setSelectedRef(arrivals[0])
  }, [claims, revision])
  useEffect(() => {
    if (!newRefs.length) return
    const timer = window.setTimeout(() => setNewRefs([]), 8_000)
    return () => window.clearTimeout(timer)
  }, [newRefs])
  async function advance() {
    if (!selected || pending) return
    setPending(true); setError('')
    try { await platform.advanceClaim(selected.ref) }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not update this claim. Try again.') }
    finally { setPending(false) }
  }
  return <section className="mx-auto max-w-[1500px] space-y-6 text-base">
    <div className="rounded-lg bg-gold px-4 py-2 font-semibold">Illustrative data · Stand-in for the operators' claims system</div>
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="font-semibold uppercase tracking-wider text-brown">Cross-border claims</p><h1 className="mt-1 text-3xl font-semibold sm:text-4xl">One report. A shared claim.</h1><p className="mt-2 text-muted">Nigerian-issued cards · handling bureaux across the region</p></div><a href="?view=reporter" target="_blank" rel="noreferrer" className="rounded-lg border border-line bg-paper px-4 py-3 font-semibold hover:bg-stone">Open reporter in another window ↗</a></div>
    <div className="grid gap-3 sm:grid-cols-3">{[['Open claims', open.length], ['Past deadline', open.filter((c) => age(c, now) > c.deadlineDays).length], ['Average open age', `${open.length ? Math.round(open.reduce((sum, c) => sum + age(c, now), 0) / open.length) : 0} days`]].map(([label, value]) => <div key={label} className="rounded-xl border border-line bg-paper p-5"><div className="text-muted">{label}</div><div className="mt-1 text-3xl font-semibold">{value}</div></div>)}</div>
    <p role="status" aria-live="polite" className="min-h-6 text-mint">{newRefs.length ? `New incident received · ${newRefs.join(', ')} · shared across demo windows` : 'Live demo sync is active. Select a claim to view its bureau handshake.'}</p>
    <div className="grid items-start gap-5 xl:grid-cols-[1.35fr_1fr]">
      <div className="space-y-3">{ordered.map((claim) => <button key={claim.ref} onClick={() => { setSelectedRef(claim.ref); setError('') }} aria-pressed={selected?.ref === claim.ref} className={`w-full rounded-xl border-2 p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown ${selected?.ref === claim.ref ? 'border-brown bg-paper' : 'border-line bg-paper hover:border-brown/60'} ${newRefs.includes(claim.ref) ? 'ring-4 ring-gold/40' : ''}`}>
        <div className="flex flex-wrap justify-between gap-2"><span className="font-mono text-xl font-semibold">{claim.ref}</span><span className={`rounded-full px-3 py-1 font-semibold ${claim.stage === 4 ? 'bg-mint/15 text-mint' : 'bg-stone'}`}>{STAGES[claim.stage]}</span></div>
        <div className="mt-2">{claim.accidentCountry} · {claim.insurerId ? `Insurer ${claim.insurerId}` : 'Insurer awaiting verification'}</div><div className="mt-1 text-muted">{claim.issuingBureau} → {claim.handlingBureau}</div>
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Claim stages">{STAGES.map((stage, i) => <span key={stage} className={`rounded px-2 py-1 ${i <= claim.stage ? 'bg-ink text-paper' : 'bg-stone text-muted'}`}>{i < claim.stage ? '✓ ' : ''}{i + 1}. {stage}</span>)}</div><div className="mt-3"><Clock claim={claim} now={now} /></div>
      </button>)}{!claims.length && <p className="rounded-xl border border-line bg-paper p-6">No claims yet. Submit an incident from the reporter.</p>}</div>
      {selected && <aside className="rounded-xl border border-line bg-paper p-5 xl:sticky xl:top-4"><p className="font-semibold uppercase tracking-wider text-brown">Bureau handshake</p><h2 className="mt-2 font-mono text-2xl font-semibold">{selected.ref}</h2><p className="mt-1 text-muted">{selected.incidentRef ?? 'Illustrative seeded claim'} · {selected.injuries ? 'Injury reported' : 'No injury reported'}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-lg border border-line p-4"><p className="text-muted">Issuing bureau</p><h3 className="mt-1 font-semibold">{selected.issuingBureau}</h3><p className="mt-2 text-mint">{selected.stage > 0 ? 'Card verified' : 'Verification pending'}</p></div><div className="rounded-lg border border-line p-4"><p className="text-muted">Handling bureau</p><h3 className="mt-1 font-semibold">{selected.handlingBureau}</h3><p className="mt-2 text-mint">{selected.stage > 1 ? 'Acknowledged · assessment recorded' : 'Notified'}</p></div></div><p className="mt-2 text-muted">Handshake statuses are inferred from the demo claim stage.</p>
        <dl className="mt-5 space-y-3"><div><dt className="text-muted">Brown Card</dt><dd className="break-all font-mono">{selected.cardNumber}</dd></div><div><dt className="text-muted">Notification date</dt><dd>{new Date(selected.notifiedAt).toLocaleDateString('en-GB', { timeZone: 'Africa/Lagos' })}</dd></div><div><dt className="text-muted">Illustrative reserve</dt><dd className="font-semibold">{selected.reserveFcfa.toLocaleString('en-GB')} FCFA</dd></div></dl>
        <h3 className="mt-5 font-semibold">Documents received</h3>{selected.documents.length ? <ul className="mt-2 space-y-2">{selected.documents.map((doc, i) => <li key={`${doc}-${i}`} className="rounded bg-stone px-3 py-2">✓ {doc}</li>)}</ul> : <p className="mt-2 text-muted">No documents received yet.</p>}
        <div className="mt-5 rounded-lg border border-line p-4"><h3 className="font-semibold">Council of Bureaux</h3><p role="status" className="mt-1">{selected.escalated || escalated.includes(selected.ref) ? 'Flagged for escalation' : 'No escalation flag'}</p><p className="mt-2 text-muted">Demo flag only. An operator escalation API is still needed.</p><button disabled={selected.escalated || escalated.includes(selected.ref) || selected.stage === 4} onClick={() => setEscalated((refs) => [...refs, selected.ref])} className="mt-3 rounded-lg border border-brown px-4 py-2 font-semibold text-brown disabled:opacity-50">Flag for escalation</button></div>
        {error && <p role="alert" className="mt-4 text-clay">{error}</p>}<button onClick={advance} disabled={pending || selected.stage === 4} className="mt-5 w-full rounded-lg bg-ink px-4 py-3 font-semibold text-paper disabled:opacity-50">{pending ? 'Updating claim…' : selected.stage === 4 ? 'Claim paid' : `Move to next stage · ${STAGES[selected.stage + 1]}`}</button><p className="mt-3 text-muted">Clock target is illustrative, subject to the operators' turnaround rules. Paid claims leave the open-claim totals.</p>
      </aside>}
    </div>
  </section>
}
