import { useState, type FormEvent } from 'react'
import { platform } from '../../platform'
import { useDemo } from '../../state/store'
import { INSURERS } from '../../shared/seed'
import type { IssuedPolicy, PolicyInput } from '../../shared/types'

// Illustrative placeholder values only. No real people or vehicles.
const DEFAULTS: PolicyInput = {
  holder: 'Sample holder',
  vehicle: 'Sample vehicle',
  insurerId: 'B',
  cover: 'third_party',
  termMonths: 12,
}

const coverLabel = (c: PolicyInput['cover']) => (c === 'comprehensive' ? 'Comprehensive' : 'Third party')
const insurerName = (id: string) => INSURERS.find((i) => i.id === id)?.name ?? `Insurer ${id}`

const field = 'w-full rounded-md border border-line bg-paper px-3 py-2.5 text-base text-ink focus:outline-none focus:ring-2 focus:ring-brown'
const label = 'block text-base font-medium text-ink'

/** Demo step 1: the operators' platform issues a motor policy and allocates a Brown Card number. */
export default function CardAllocation() {
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
    <section aria-labelledby="alloc-title" data-testid="card-allocation" className="rounded-xl border border-line bg-paper p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="alloc-title" className="text-xl font-semibold">
          Issue a policy, allocate a card
        </h3>
        <span className="rounded-full border border-brown px-3 py-0.5 text-sm font-medium text-brown">
          Stand-in for the operators' platform
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={submit} className="space-y-4" aria-label="New motor policy">
          <div>
            <label htmlFor="holder" className={label}>Policyholder</label>
            <input id="holder" className={field} value={form.holder} onChange={(e) => update('holder', e.target.value)} autoComplete="off" />
          </div>
          <div>
            <label htmlFor="vehicle" className={label}>Vehicle</label>
            <input id="vehicle" className={field} value={form.vehicle} onChange={(e) => update('vehicle', e.target.value)} autoComplete="off" />
          </div>
          <div>
            <label htmlFor="insurer" className={label}>Insurer</label>
            <select id="insurer" className={field} value={form.insurerId} onChange={(e) => update('insurerId', e.target.value)}>
              {INSURERS.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <fieldset>
              <legend className={label}>Cover</legend>
              <div className="mt-1 flex gap-2">
                {(['third_party', 'comprehensive'] as const).map((c) => (
                  <label key={c} className={`flex-1 cursor-pointer rounded-md border px-3 py-2.5 text-center text-base ${form.cover === c ? 'border-ink bg-ink text-paper' : 'border-line'}`}>
                    <input type="radio" name="cover" value={c} className="sr-only" checked={form.cover === c} onChange={() => update('cover', c)} />
                    {coverLabel(c)}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className={label}>Term</legend>
              <div className="mt-1 flex gap-2">
                {([6, 12] as const).map((t) => (
                  <label key={t} className={`flex-1 cursor-pointer rounded-md border px-3 py-2.5 text-center text-base ${form.termMonths === t ? 'border-ink bg-ink text-paper' : 'border-line'}`}>
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
            className="w-full rounded-md bg-brown px-4 py-3 text-lg font-semibold text-paper hover:bg-ink disabled:opacity-60"
          >
            {busy ? 'Allocating card…' : 'Issue policy and allocate card'}
          </button>
        </form>

        <div className="space-y-4">
          <div className="rounded-lg border border-line bg-stone p-4" aria-live="polite" data-testid="allocated-card">
            <div className="text-sm font-medium uppercase tracking-wide text-muted">Allocated Brown Card number</div>
            {last ? (
              <>
                <div className="mt-1 break-all font-mono text-3xl font-bold text-ink md:text-4xl">{last.cardNumber}</div>
                <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-base">
                  <dt className="text-muted">Holder</dt><dd>{last.holder}</dd>
                  <dt className="text-muted">Vehicle</dt><dd>{last.vehicle}</dd>
                  <dt className="text-muted">Insurer</dt><dd>{insurerName(last.insurerId)}</dd>
                  <dt className="text-muted">Cover</dt><dd>{coverLabel(last.cover)}, {last.termMonths} months</dd>
                  <dt className="text-muted">Valid to</dt><dd>{last.validTo}</dd>
                </dl>
                <p className="mt-3 text-base text-mint">Recorded on the card register. The short code below will now find it.</p>
              </>
            ) : (
              <div className="mt-1 font-mono text-3xl text-muted">NG-26-····-····-·</div>
            )}
          </div>

          <div>
            <h4 className="text-base font-semibold">Issued this session ({issued.length})</h4>
            {issued.length === 0 ? (
              <p className="text-base text-muted">None yet. Issue a policy to allocate the first card.</p>
            ) : (
              <ul className="mt-2 divide-y divide-line rounded-lg border border-line text-base">
                {issued.map((p) => (
                  <li key={p.cardNumber} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                    <span className="font-mono font-semibold">{p.cardNumber}</span>
                    <span className="text-muted">{p.holder} · {insurerName(p.insurerId)} · {coverLabel(p.cover)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
