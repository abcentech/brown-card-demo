import { useState, type FormEvent } from 'react'
import { platform } from '../../platform'
import { useDemo } from '../../state/store'
import { INSURERS } from '../../shared/seed'
import type { IssuedPolicy, PolicyInput } from '../../shared/types'
import { BrownCard, GhostCard, coverLabel, insurerName } from './BrownCard'

// Illustrative placeholder values only. No real people or vehicles. Pre-filled so one click issues a card.
const DEFAULTS: PolicyInput = {
  holder: 'Sample holder',
  vehicle: 'Sample vehicle',
  insurerId: 'B',
  cover: 'third_party',
  termMonths: 12,
}

const field =
  'min-h-[44px] w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-base text-ink shadow-[inset_0_1px_2px_rgba(18,38,30,0.06)] focus:border-brown focus:outline-none focus:ring-2 focus:ring-brown/40'
const label = 'mb-1 block text-base font-medium text-ink'
const toggle = (on: boolean) =>
  `flex min-h-[44px] flex-1 cursor-pointer items-center justify-center rounded-xl border px-3 py-2 text-center text-base transition-colors ${
    on ? 'border-ink bg-ink text-paper shadow-[0_6px_14px_-8px_rgba(18,38,30,0.6)]' : 'border-line bg-paper text-ink hover:border-ink'
  }`

/** Demo step 1: the operators' platform issues a motor policy and allocates a Brown Card number. */
export default function CardAllocation({ onCheckCard }: { onCheckCard?: (card: string) => void }) {
  const issued = useDemo((s) => s.issued)
  const [form, setForm] = useState<PolicyInput>(DEFAULTS)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [last, setLast] = useState<IssuedPolicy | null>(null)

  const update = <K extends keyof PolicyInput>(k: K, v: PolicyInput[K]) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (!form.holder.trim() || !form.vehicle.trim()) {
      setError('Enter a holder and a vehicle.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const result = await platform.issuePolicy({ ...form, holder: form.holder.trim(), vehicle: form.vehicle.trim() })
      setLast(result)
      // Rotate the placeholder so the next policy issued in the demo looks different.
      const n = issued.length + 2
      setForm((f) => ({ ...f, holder: `Sample holder ${n}`, vehicle: `Sample vehicle ${n}` }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The platform did not respond.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section
      aria-labelledby="alloc-title"
      data-testid="card-allocation"
      className="rounded-xl border border-line bg-paper p-5 shadow-[0_18px_40px_-28px_rgba(18,38,30,0.45)]"
    >
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="alloc-title" className="text-xl font-semibold">Issue a policy, allocate a card</h3>
        <span className="rounded-full border border-brown px-3 py-0.5 text-base font-medium text-brown">Stand-in for the operators' platform</span>
      </div>

      {/* Hero: the card itself */}
      <div aria-live="polite" data-testid="allocated-card" className="mx-auto w-full max-w-[560px]">
        {last ? <BrownCard key={last.cardNumber} policy={last} /> : <GhostCard />}
        {last && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-base text-mint">
              <span className="font-semibold">Recorded on the card register.</span> The short code will now find it.
            </p>
            {onCheckCard && (
              <button
                type="button"
                onClick={() => onCheckCard(last.cardNumber)}
                className="min-h-[44px] rounded-xl border border-mint bg-mint/10 px-4 py-2 text-base font-semibold text-mint transition-colors hover:bg-mint hover:text-paper"
              >
                Check this card by short code
              </button>
            )}
          </div>
        )}
      </div>

      <form onSubmit={submit} className="mt-5 space-y-4" aria-label="New motor policy">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="holder" className={label}>Policyholder</label>
            <input id="holder" className={field} value={form.holder} onChange={(e) => update('holder', e.target.value)} autoComplete="off" />
          </div>
          <div>
            <label htmlFor="vehicle" className={label}>Vehicle</label>
            <input id="vehicle" className={field} value={form.vehicle} onChange={(e) => update('vehicle', e.target.value)} autoComplete="off" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_1fr]">
          <div>
            <label htmlFor="insurer" className={label}>Insurer</label>
            <select id="insurer" className={field} value={form.insurerId} onChange={(e) => update('insurerId', e.target.value)}>
              {INSURERS.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>
          <fieldset>
            <legend className={label}>Cover</legend>
            <div className="flex gap-2">
              {(['third_party', 'comprehensive'] as const).map((c) => (
                <label key={c} className={toggle(form.cover === c)}>
                  <input type="radio" name="cover" value={c} className="sr-only" checked={form.cover === c} onChange={() => update('cover', c)} />
                  {coverLabel(c)}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className={label}>Term</legend>
            <div className="flex gap-2">
              {([6, 12] as const).map((t) => (
                <label key={t} className={toggle(form.termMonths === t)}>
                  <input type="radio" name="term" value={t} className="sr-only" checked={form.termMonths === t} onChange={() => update('termMonths', t)} />
                  {t} months
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        {error && <p role="alert" className="text-base text-clay">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="min-h-[52px] w-full rounded-xl bg-brown px-4 py-3 text-lg font-semibold text-paper shadow-[0_12px_24px_-12px_rgba(122,70,32,0.8)] transition-colors hover:bg-ink disabled:opacity-60"
        >
          {busy ? 'Allocating card…' : 'Issue policy and allocate card'}
        </button>
      </form>

      <div className="mt-5">
        <h4 className="text-base font-semibold">Issued this session ({issued.length})</h4>
        {issued.length === 0 ? (
          <p className="text-base text-muted">None yet. Issue a policy to allocate the first card.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line overflow-hidden rounded-xl border border-line text-base">
            {issued.map((p) => (
              <li key={p.cardNumber} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                <span className="font-mono font-semibold">{p.cardNumber}</span>
                <span className="text-muted">{p.holder} · {insurerName(p.insurerId)} · {coverLabel(p.cover)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
