import { useEffect, useMemo, useState } from 'react'
import { platform } from '../../platform'
import { getResetGeneration } from '../../state/store'
import { INSURERS } from '../../shared/seed'
import type { ExceptionAction, ExceptionRow, ExceptionStatus } from '../../shared/types'
import {
  CAUSES, CAUSE_LABEL, CHANNELS, CHANNEL_LABEL, EMPTY_FILTER, PAGE_SIZE, STATUSES, STATUS_LABEL,
  applyFilter, assigneeFor, confirmationText, fmtInt, groupByInsurer, sum, type ExceptionFilter,
} from './helpers'

const BADGE: Record<ExceptionStatus, string> = {
  open: 'bg-stone text-ink border-line',
  reminded: 'bg-gold/20 text-brown border-gold',
  assigned: 'bg-brown/15 text-brown border-brown',
  resolved: 'bg-mint/15 text-mint border-mint',
}

export function StatusBadge({ status }: { status: ExceptionStatus }) {
  return (
    <span className={`inline-block rounded-full border px-3 py-0.5 text-base font-semibold ${BADGE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  )
}

interface Props {
  exceptions: ExceptionRow[]
  onConfirm: (text: string) => void
}

const selectCls = 'rounded-lg border border-line bg-paper px-3 py-2 text-base text-ink'

/** The store's exception rows, filterable, with checkbox selection and actions through the platform adapter. */
export default function ExceptionList({ exceptions, onConfirm }: Props) {
  const [filter, setFilter] = useState<ExceptionFilter>(EMPTY_FILTER)
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [busy, setBusy] = useState<ExceptionAction | null>(null)
  const [pages, setPages] = useState(1)

  const filtered = useMemo(() => applyFilter(exceptions, filter), [exceptions, filter])
  // Only the first page(s) are in the DOM; selection and "select all" still work over the whole filtered set.
  const visible = filtered.length > pages * PAGE_SIZE ? filtered.slice(0, pages * PAGE_SIZE) : filtered
  const hiddenCount = filtered.length - visible.length
  const byId = useMemo(() => new Map(exceptions.map((e) => [e.id, e])), [exceptions])

  // Tolerate Reset demo and resolved rows: drop selected ids that are no longer open.
  useEffect(() => {
    setSelected((prev) => {
      const next = new Set([...prev].filter((id) => byId.get(id)?.status !== 'resolved' && byId.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [byId])

  const selectedRows = useMemo(() => exceptions.filter((e) => selected.has(e.id)), [exceptions, selected])
  const selectablePolicies = sum(selectedRows.filter((e) => e.status !== 'resolved'))
  const openFiltered = filtered.filter((e) => e.status !== 'resolved')
  const allFilteredSelected = openFiltered.length > 0 && openFiltered.every((e) => selected.has(e.id))

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const toggleAllFiltered = () =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (allFilteredSelected) openFiltered.forEach((e) => next.delete(e.id))
      else openFiltered.forEach((e) => next.add(e.id))
      return next
    })

  const run = async (action: ExceptionAction) => {
    const rows = selectedRows.filter((e) => e.status !== 'resolved')
    if (!rows.length || busy) return
    setBusy(action)
    const generation = getResetGeneration()
    try {
      let cleared = 0
      if (action === 'assign') {
        // One call per insurer so each batch is assigned to its own insurer's compliance desk.
        const groups = [...groupByInsurer(rows)]
        await Promise.all(groups.map(([insurerId, ids]) => platform.applyExceptionAction(ids, 'assign', assigneeFor(insurerId))))
      } else {
        cleared = await platform.applyExceptionAction(rows.map((e) => e.id), action)
      }
      // Reset demo while the request was in flight: the platform did nothing, so say so neutrally.
      if (getResetGeneration() !== generation || (action === 'backfill' && cleared === 0)) {
        onConfirm('The demo was reset. Nothing changed.')
        setSelected(new Set())
        return
      }
      const policies = action === 'backfill' ? cleared : sum(rows)
      const insurers = [...new Set(rows.map((e) => e.insurerId))].sort()
      onConfirm(confirmationText(action, rows.length, policies, insurers))
      if (action === 'backfill') setSelected(new Set())
    } finally {
      setBusy(null)
    }
  }

  const set = <K extends keyof ExceptionFilter>(k: K, v: ExceptionFilter[K]) => {
    setFilter((f) => ({ ...f, [k]: v }))
    setPages(1)
  }
  const clearFilters = () => {
    setFilter(EMPTY_FILTER)
    setPages(1)
  }
  const assignTargets = [...new Set(selectedRows.map((e) => e.insurerId))].sort()

  return (
    <section className="rounded-xl border border-line bg-paper p-6" aria-labelledby="exceptions">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 id="exceptions" className="text-xl font-semibold">Exception list: policy batches without a card number</h3>
        <p className="text-base text-muted">
          Showing {filtered.length} of {exceptions.length} batches · {fmtInt(sum(openFiltered))} policies open in view
        </p>
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-base">
          <span className="text-muted">Insurer</span>
          <select className={selectCls} value={filter.insurerId} onChange={(e) => set('insurerId', e.target.value)}>
            <option value="">All insurers</option>
            {INSURERS.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-base">
          <span className="text-muted">Channel</span>
          <select className={selectCls} value={filter.channel} onChange={(e) => set('channel', e.target.value as ExceptionFilter['channel'])}>
            <option value="">All channels</option>
            {CHANNELS.map((c) => (
              <option key={c} value={c}>{CHANNEL_LABEL[c]}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-base">
          <span className="text-muted">Cause</span>
          <select className={selectCls} value={filter.cause} onChange={(e) => set('cause', e.target.value as ExceptionFilter['cause'])}>
            <option value="">All causes</option>
            {CAUSES.map((c) => (
              <option key={c} value={c}>{CAUSE_LABEL[c]}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-base">
          <span className="text-muted">Status</span>
          <select className={selectCls} value={filter.status} onChange={(e) => set('status', e.target.value as ExceptionFilter['status'])}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </label>
        {(filter.insurerId || filter.channel || filter.cause || filter.status) && (
          <button type="button" onClick={clearFilters} className="rounded-lg border border-line px-3 py-2 text-base text-muted hover:text-ink">
            Clear filters
          </button>
        )}
      </div>

      {/* Action bar */}
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-stone px-4 py-3 text-base">
        <span className="font-semibold">
          {selectedRows.length ? `${selectedRows.length} ${selectedRows.length === 1 ? 'batch' : 'batches'} selected · ${fmtInt(selectablePolicies)} policies` : 'Select batches to act on them'}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <ActionButton label="Back-fill" hint="Allocate card numbers to the batch" tone="bg-mint text-paper" disabled={!selectablePolicies || !!busy} busy={busy === 'backfill'} onClick={() => run('backfill')} />
          <ActionButton label="Remind" hint="Send a reminder to the intermediary" tone="bg-gold text-ink" disabled={!selectablePolicies || !!busy} busy={busy === 'remind'} onClick={() => run('remind')} />
          <ActionButton
            label="Assign"
            hint={assignTargets.length === 1 ? `Assign to ${assigneeFor(assignTargets[0])}` : 'Assign to each insurer’s compliance desk'}
            tone="bg-brown text-paper"
            disabled={!selectablePolicies || !!busy}
            busy={busy === 'assign'}
            onClick={() => run('assign')}
          />
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 max-h-[28rem] overflow-auto rounded-lg border border-line">
        <table className="w-full border-collapse text-base">
          <thead className="sticky top-0 bg-paper text-left">
            <tr className="border-b border-line">
              <th className="w-12 px-3 py-2">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-brown"
                  aria-label="Select all open batches in view"
                  checked={allFilteredSelected}
                  disabled={!openFiltered.length}
                  onChange={toggleAllFiltered}
                />
              </th>
              <th className="px-3 py-2 font-semibold">Batch</th>
              <th className="px-3 py-2 font-semibold">Insurer</th>
              <th className="px-3 py-2 font-semibold">Channel</th>
              <th className="px-3 py-2 font-semibold">Cause</th>
              <th className="px-3 py-2 text-right font-semibold">Policies</th>
              <th className="px-3 py-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted">No batches match these filters.</td>
              </tr>
            )}
            {visible.map((e) => {
              const resolved = e.status === 'resolved'
              const isSel = selected.has(e.id)
              return (
                <tr key={e.id} className={`border-b border-line/60 ${isSel ? 'bg-gold/10' : resolved ? 'text-muted' : ''}`}>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-brown"
                      aria-label={`Select ${e.id}`}
                      checked={isSel}
                      disabled={resolved}
                      onChange={() => toggle(e.id)}
                    />
                  </td>
                  <td className="px-3 py-2 font-mono">{e.id}</td>
                  <td className="px-3 py-2">Insurer {e.insurerId}</td>
                  <td className="px-3 py-2">{CHANNEL_LABEL[e.channel]}</td>
                  <td className="px-3 py-2">{CAUSE_LABEL[e.cause]}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtInt(e.policiesAffected)}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={e.status} />
                    {e.status === 'assigned' && e.assignee && <span className="ml-2 text-muted">{e.assignee}</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {hiddenCount > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-base">
          <p className="text-muted">Showing the first {visible.length} of {filtered.length} batches. Select all above still covers every batch in view.</p>
          <button type="button" onClick={() => setPages((p) => p + 1)} className="rounded-lg border border-line px-4 py-2 font-semibold hover:bg-stone">
            Show {Math.min(PAGE_SIZE, hiddenCount)} more
          </button>
        </div>
      )}
    </section>
  )
}

function ActionButton({ label, hint, tone, disabled, busy, onClick }: { label: string; hint: string; tone: string; disabled: boolean; busy: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      title={hint}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${tone}`}
    >
      {busy ? 'Working…' : label}
    </button>
  )
}
