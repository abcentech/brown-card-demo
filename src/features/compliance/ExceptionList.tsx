import { useEffect, useMemo, useRef, useState } from 'react'
import { platform } from '../../platform'
import { getResetGeneration } from '../../state/store'
import { INSURERS } from '../../shared/seed'
import type { ExceptionAction, ExceptionRow, ExceptionStatus } from '../../shared/types'
import {
  CAUSES, CAUSE_LABEL, CHANNELS, CHANNEL_LABEL, DEFAULT_FILTER, PAGE_SIZE, STATUSES, STATUS_LABEL,
  applyFilter, assigneeFor, confirmationText, fmtInt, groupByInsurer, sortResolvedLast, sum, type ExceptionFilter,
} from './helpers'
import { prefersReducedMotion } from './hooks'

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

export interface ActionSummary {
  action: ExceptionAction
  batches: number
  policies: number
}

/** A request from the insurer bars: filter to this insurer and select all of its open batches. '' clears. */
export interface InsurerPick {
  insurerId: string
  seq: number
}

interface Props {
  exceptions: ExceptionRow[]
  onConfirm: (text: string, summary?: ActionSummary) => void
  insurerPick: InsurerPick | null
  onInsurerFilterChange: (insurerId: string) => void
}

const selectCls = 'rounded-lg border border-line bg-paper px-3 py-2 text-base text-ink'

const sameFilter = (a: ExceptionFilter, b: ExceptionFilter) =>
  a.insurerId === b.insurerId && a.channel === b.channel && a.cause === b.cause && a.status === b.status

/** The store's exception rows, filterable, with checkbox selection and actions through the platform adapter. */
export default function ExceptionList({ exceptions, onConfirm, insurerPick, onInsurerFilterChange }: Props) {
  const [filter, setFilter] = useState<ExceptionFilter>(DEFAULT_FILTER)
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [busy, setBusy] = useState<ExceptionAction | null>(null)
  const [pages, setPages] = useState(1)
  const sectionRef = useRef<HTMLElement>(null)

  const filtered = useMemo(() => sortResolvedLast(applyFilter(exceptions, filter)), [exceptions, filter])
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

  // The insurer bars asked for an insurer: filter to it, select every open batch, bring the list into view.
  const lastPick = useRef<number>(0)
  useEffect(() => {
    if (!insurerPick || insurerPick.seq === lastPick.current) return
    lastPick.current = insurerPick.seq
    const id = insurerPick.insurerId
    setFilter({ ...DEFAULT_FILTER, insurerId: id })
    setPages(1)
    setSelected(id ? new Set(exceptions.filter((e) => e.insurerId === id && e.status !== 'resolved').map((e) => e.id)) : new Set())
    if (id) sectionRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  }, [insurerPick, exceptions])

  const selectedRows = useMemo(() => exceptions.filter((e) => selected.has(e.id)), [exceptions, selected])
  const actionable = selectedRows.filter((e) => e.status !== 'resolved')
  const selectablePolicies = sum(actionable)
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
      onConfirm(confirmationText(action, rows.length, policies, insurers), { action, batches: rows.length, policies })
      if (action === 'backfill') setSelected(new Set())
    } catch {
      onConfirm('The action did not go through. Try again.')
    } finally {
      setBusy(null)
    }
  }

  const set = <K extends keyof ExceptionFilter>(k: K, v: ExceptionFilter[K]) => {
    setFilter((f) => ({ ...f, [k]: v }))
    setPages(1)
    if (k === 'insurerId') onInsurerFilterChange(v as string)
  }
  const clearFilters = () => {
    setFilter(DEFAULT_FILTER)
    setPages(1)
    onInsurerFilterChange('')
  }
  const assignTargets = [...new Set(selectedRows.map((e) => e.insurerId))].sort()
  const hasSelection = actionable.length > 0
  const batchesWord = actionable.length === 1 ? 'batch' : 'batches'

  return (
    <section ref={sectionRef} className="cc-card scroll-mt-16 rounded-xl border border-line bg-paper p-6" aria-labelledby="exceptions">
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
            <option value="unresolved">Still to resolve</option>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </label>
        {!sameFilter(filter, DEFAULT_FILTER) && (
          <button type="button" onClick={clearFilters} className="rounded-lg border border-line px-3 py-2 text-base text-muted hover:text-ink">
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="mt-4 max-h-[28rem] overflow-auto rounded-lg border border-line">
        <table className="w-full border-collapse text-base">
          <thead className="sticky top-0 z-10 bg-paper text-left">
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
                <td colSpan={7} className="px-3 py-6 text-center text-muted">
                  {filter.insurerId && filter.status === 'unresolved' ? (
                    <span className="inline-flex flex-wrap items-center justify-center gap-3">
                      <span className="font-semibold text-mint">Insurer {filter.insurerId} has no batches left to resolve.</span>
                      <button type="button" onClick={clearFilters} className="rounded-lg border border-line px-3 py-1.5 text-base font-semibold text-ink hover:bg-stone">
                        Show all insurers
                      </button>
                    </span>
                  ) : (
                    'No batches match these filters.'
                  )}
                </td>
              </tr>
            )}
            {visible.map((e) => {
              const resolved = e.status === 'resolved'
              const isSel = selected.has(e.id)
              return (
                <tr
                  key={e.id}
                  onClick={() => !resolved && toggle(e.id)}
                  className={`border-b border-line/60 transition-colors ${
                    isSel ? 'bg-gold/10' : resolved ? 'text-muted' : 'cursor-pointer hover:bg-stone/50'
                  }`}
                >
                  <td className="px-3 py-2" onClick={(ev) => ev.stopPropagation()}>
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

      {/* Action bar: a quiet hint until something is selected, then it sticks to the bottom edge and slides up. */}
      <div
        className={`mt-4 flex flex-wrap items-center gap-3 rounded-xl px-4 py-3 text-base ${
          hasSelection
            ? 'cc-actionbar-in sticky bottom-4 z-20 bg-ink text-paper shadow-[0_18px_40px_-18px_rgba(18,38,30,0.7)]'
            : 'bg-stone text-ink'
        }`}
      >
        <span className="font-semibold">
          {hasSelection
            ? `${actionable.length} ${batchesWord} selected · ${fmtInt(selectablePolicies)} policies`
            : 'Select batches to act on them'}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <ActionButton
            label="Back-fill"
            count={hasSelection ? `${actionable.length} ${batchesWord}` : undefined}
            hint="Allocate card numbers to the batch"
            tone="bg-mint text-paper"
            disabled={!selectablePolicies || !!busy}
            busy={busy === 'backfill'}
            onClick={() => run('backfill')}
          />
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
    </section>
  )
}

function ActionButton({
  label,
  count,
  hint,
  tone,
  disabled,
  busy,
  onClick,
}: {
  label: string
  count?: string
  hint: string
  tone: string
  disabled: boolean
  busy: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={hint}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${tone}`}
    >
      {busy ? (
        'Working…'
      ) : (
        <>
          {label}
          {/* The count is visible but kept out of the accessible name so the button stays "Back-fill". */}
          {count && <span aria-hidden className="ml-1.5 font-normal opacity-90">{count}</span>}
        </>
      )}
    </button>
  )
}
