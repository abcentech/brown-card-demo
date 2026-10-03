// Pure helpers for the compliance console. No React here so they can be unit-tested without jsdom.
import type { Cause, Channel, ExceptionAction, ExceptionRow, ExceptionStatus, ReturnRow } from '../../shared/types'

export const CHANNELS: Channel[] = ['direct', 'agent', 'broker', 'bank']
export const CAUSES: Cause[] = ['data_error', 'late_entry', 'system_not_calling_api', 'intermediary']
export const STATUSES: ExceptionStatus[] = ['open', 'reminded', 'assigned', 'resolved']

export const CHANNEL_LABEL: Record<Channel, string> = {
  direct: 'Direct',
  agent: 'Agent',
  broker: 'Broker',
  bank: 'Bank',
}

/** Plain-English phrases for the "where the gap sits" sentences. */
export const CHANNEL_PHRASE: Record<Channel, string> = {
  direct: 'direct sales',
  agent: 'agents',
  broker: 'brokers',
  bank: 'banks',
}

export const CAUSE_PHRASE: Record<Cause, string> = {
  data_error: 'data errors',
  late_entry: 'late entry',
  system_not_calling_api: 'systems not calling the API',
  intermediary: 'intermediaries',
}

export const CAUSE_LABEL: Record<Cause, string> = {
  data_error: 'Data error',
  late_entry: 'Late entry',
  system_not_calling_api: 'System not calling the API',
  intermediary: 'Intermediary',
}

export const STATUS_LABEL: Record<ExceptionStatus, string> = {
  open: 'Open',
  reminded: 'Reminded',
  assigned: 'Assigned',
  resolved: 'Resolved',
}

/** Target band for the headline figure, in percent. */
export const TARGET_BAND = { low: 90, high: 95 } as const
/** Visible range of the headline scale, in percent. */
export const SCALE = { min: 85, max: 100 } as const

/** Position of a percentage on the headline scale, 0 to 100 (clamped). */
export function scalePosition(pct: number): number {
  const p = ((pct - SCALE.min) / (SCALE.max - SCALE.min)) * 100
  return Math.max(0, Math.min(100, p))
}

export const fmtInt = (n: number): string => new Intl.NumberFormat('en-GB').format(Math.round(n))
export const fmtPct = (n: number): string => `${n.toFixed(1)}%`

export const isOpen = (e: ExceptionRow): boolean => e.status !== 'resolved'

export interface Bucket<K extends string> {
  key: K
  label: string
  policies: number
  batches: number
}

/** Open (unresolved) uncarded policies grouped by channel, in the fixed channel order. */
export function byChannel(rows: ExceptionRow[]): Bucket<Channel>[] {
  return CHANNELS.map((key) => {
    const hits = rows.filter((e) => isOpen(e) && e.channel === key)
    return { key, label: CHANNEL_LABEL[key], policies: sum(hits), batches: hits.length }
  })
}

/** Open (unresolved) uncarded policies grouped by cause, in the fixed cause order. */
export function byCause(rows: ExceptionRow[]): Bucket<Cause>[] {
  return CAUSES.map((key) => {
    const hits = rows.filter((e) => isOpen(e) && e.cause === key)
    return { key, label: CAUSE_LABEL[key], policies: sum(hits), batches: hits.length }
  })
}

export function sum(rows: ExceptionRow[]): number {
  return rows.reduce((a, e) => a + e.policiesAffected, 0)
}

/** The bucket holding the most open policies (first one on a tie); undefined when nothing is open. */
export function topBucket<K extends string>(buckets: Bucket<K>[]): Bucket<K> | undefined {
  const top = buckets.reduce<Bucket<K> | undefined>((best, b) => (!best || b.policies > best.policies ? b : best), undefined)
  return top && top.policies > 0 ? top : undefined
}

function share<K extends string>(buckets: Bucket<K>[], b: Bucket<K>): number {
  const total = buckets.reduce((a, x) => a + x.policies, 0)
  return total ? Math.round((b.policies / total) * 100) : 0
}

/** "Most missing cards come through agents (41%)." */
export function channelSentence(buckets: Bucket<Channel>[]): string {
  const top = topBucket(buckets)
  if (!top) return 'No open gaps by channel.'
  return `Most missing cards come through ${CHANNEL_PHRASE[top.key]} (${share(buckets, top)}%).`
}

/** "The main cause is late entry (33%)." */
export function causeSentence(buckets: Bucket<Cause>[]): string {
  const top = topBucket(buckets)
  if (!top) return 'No open gaps by cause.'
  return `The main cause is ${CAUSE_PHRASE[top.key]} (${share(buckets, top)}%).`
}

/** One line for the session log: "Back-filled 4 batches · 189 policies". */
export function sessionLogText(action: ExceptionAction, batches: number, policies: number): string {
  const verb = action === 'backfill' ? 'Back-filled' : action === 'remind' ? 'Reminded' : 'Assigned'
  return `${verb} ${fmtInt(batches)} ${batches === 1 ? 'batch' : 'batches'} · ${fmtInt(policies)} policies`
}

/** "10:42" for the session log. */
export function clockText(d: Date): string {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

/** The insurer with the lowest coverage (first one on a tie). */
export function lowestCoverage(rows: ReturnRow[]): ReturnRow | undefined {
  return rows.reduce<ReturnRow | undefined>((low, r) => (!low || r.coveragePct < low.coveragePct ? r : low), undefined)
}

/** '' = every status; 'unresolved' = open, reminded and assigned (everything the presenter can still act on). */
export type StatusFilter = ExceptionStatus | '' | 'unresolved'

export interface ExceptionFilter {
  insurerId: string // '' = all
  channel: Channel | ''
  cause: Cause | ''
  status: StatusFilter
}

export const EMPTY_FILTER: ExceptionFilter = { insurerId: '', channel: '', cause: '', status: '' }
/** What the list opens with: only batches that can still be acted on. */
export const DEFAULT_FILTER: ExceptionFilter = { ...EMPTY_FILTER, status: 'unresolved' }

export function matchesStatus(e: ExceptionRow, status: StatusFilter): boolean {
  if (!status) return true
  if (status === 'unresolved') return e.status !== 'resolved'
  return e.status === status
}

/** Resolved rows sink to the bottom; everything else keeps its order. */
export function sortResolvedLast(rows: ExceptionRow[]): ExceptionRow[] {
  return [...rows].sort((a, b) => Number(a.status === 'resolved') - Number(b.status === 'resolved'))
}

export function applyFilter(rows: ExceptionRow[], f: ExceptionFilter): ExceptionRow[] {
  return rows.filter(
    (e) =>
      (!f.insurerId || e.insurerId === f.insurerId) &&
      (!f.channel || e.channel === f.channel) &&
      (!f.cause || e.cause === f.cause) &&
      matchesStatus(e, f.status),
  )
}

/** Illustrative contact for the Assign action. Local text only; not a real person. */
export function assigneeFor(insurerId: string): string {
  return `Compliance desk, Insurer ${insurerId}`
}

/** Group ids by insurer so each batch is assigned to its own insurer's desk. */
export function groupByInsurer(rows: ExceptionRow[]): Map<string, string[]> {
  const m = new Map<string, string[]>()
  for (const r of rows) m.set(r.insurerId, [...(m.get(r.insurerId) ?? []), r.id])
  return m
}

/** Rows per page in the exception table; "Show more" reveals the next page. */
export const PAGE_SIZE = 25

/** Plain-English confirmation after an action. */
export function confirmationText(action: 'backfill' | 'remind' | 'assign', batches: number, policies: number, insurerIds: string[]): string {
  const b = `${fmtInt(batches)} ${batches === 1 ? 'batch' : 'batches'}`
  const p = `${fmtInt(policies)} policies`
  if (action === 'backfill') return `Cleared ${p} in ${b}`
  if (action === 'remind') return `Reminder sent for ${b} (${p})`
  const desks = insurerIds.length === 1 ? assigneeFor(insurerIds[0]) : `the compliance desks of ${insurerIds.length} insurers`
  return `Assigned ${b} (${p}) to ${desks}`
}

// The CSV builder lives in src/features/extras/returnCsv.ts (one implementation, approved by the architect).

/** Totals row for the return preview. */
export function returnTotals(rows: ReturnRow[]): { motorPolicies: number; cardsGenerated: number; coveragePct: number } {
  const motorPolicies = rows.reduce((a, r) => a + r.motorPolicies, 0)
  const cardsGenerated = rows.reduce((a, r) => a + r.cardsGenerated, 0)
  const coveragePct = motorPolicies ? Math.round((cardsGenerated / motorPolicies) * 1000) / 10 : 0
  return { motorPolicies, cardsGenerated, coveragePct }
}
