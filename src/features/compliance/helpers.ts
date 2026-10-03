// Pure helpers for the compliance console. No React here so they can be unit-tested without jsdom.
import type { Cause, Channel, ExceptionRow, ExceptionStatus, ReturnRow } from '../../shared/types'

export const CHANNELS: Channel[] = ['direct', 'agent', 'broker', 'bank']
export const CAUSES: Cause[] = ['data_error', 'late_entry', 'system_not_calling_api', 'intermediary']
export const STATUSES: ExceptionStatus[] = ['open', 'reminded', 'assigned', 'resolved']

export const CHANNEL_LABEL: Record<Channel, string> = {
  direct: 'Direct',
  agent: 'Agent',
  broker: 'Broker',
  bank: 'Bank',
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

/** The insurer with the lowest coverage (first one on a tie). */
export function lowestCoverage(rows: ReturnRow[]): ReturnRow | undefined {
  return rows.reduce<ReturnRow | undefined>((low, r) => (!low || r.coveragePct < low.coveragePct ? r : low), undefined)
}

export interface ExceptionFilter {
  insurerId: string // '' = all
  channel: Channel | ''
  cause: Cause | ''
  status: ExceptionStatus | ''
}

export const EMPTY_FILTER: ExceptionFilter = { insurerId: '', channel: '', cause: '', status: '' }

export function applyFilter(rows: ExceptionRow[], f: ExceptionFilter): ExceptionRow[] {
  return rows.filter(
    (e) =>
      (!f.insurerId || e.insurerId === f.insurerId) &&
      (!f.channel || e.channel === f.channel) &&
      (!f.cause || e.cause === f.cause) &&
      (!f.status || e.status === f.status),
  )
}

/** Illustrative contact for the Assign action. Local text only; not a real person. */
export function assigneeFor(insurerId: string): string {
  return `Compliance desk, Insurer ${insurerId}`
}

/** Plain-English confirmation after an action. */
export function confirmationText(action: 'backfill' | 'remind' | 'assign', batches: number, policies: number, insurerIds: string[]): string {
  const b = `${fmtInt(batches)} ${batches === 1 ? 'batch' : 'batches'}`
  const p = `${fmtInt(policies)} policies`
  if (action === 'backfill') return `Cleared ${p} in ${b}`
  if (action === 'remind') return `Reminder sent for ${b} (${p})`
  const desks = insurerIds.length === 1 ? assigneeFor(insurerIds[0]) : `the compliance desks of ${insurerIds.length} insurers`
  return `Assigned ${b} (${p}) to ${desks}`
}

// CSV for the NAICOM quarterly return.
// NOTE for the architect: the extras lane exports a downloadReturnCsv() with the same columns.
// This local builder exists so the compliance lane does not import across lanes; swap it for the
// extras export at merge time if preferred.
export const RETURN_CSV_HEADER = ['insurer_id', 'insurer', 'motor_policies', 'cards_generated', 'coverage_pct'] as const

function csvCell(v: string | number): string {
  const s = String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function buildReturnCsv(rows: ReturnRow[]): string {
  const lines = [RETURN_CSV_HEADER.join(',')]
  for (const r of rows) {
    lines.push([r.insurerId, r.insurerName, r.motorPolicies, r.cardsGenerated, r.coveragePct.toFixed(1)].map(csvCell).join(','))
  }
  return lines.join('\r\n') + '\r\n'
}

/** Totals row for the return preview. */
export function returnTotals(rows: ReturnRow[]): { motorPolicies: number; cardsGenerated: number; coveragePct: number } {
  const motorPolicies = rows.reduce((a, r) => a + r.motorPolicies, 0)
  const cardsGenerated = rows.reduce((a, r) => a + r.cardsGenerated, 0)
  const coveragePct = motorPolicies ? Math.round((cardsGenerated / motorPolicies) * 1000) / 10 : 0
  return { motorPolicies, cardsGenerated, coveragePct }
}
