// Pure helpers for the claims dashboard stand-in. No store access here so they are easy to reason about.
import type { Claim, Stage } from '../../shared/types'

export const DAY_MS = 24 * 60 * 60 * 1000

export type ClockTone = 'mint' | 'gold' | 'clay' | 'done'

export interface ClockReading {
  elapsedDays: number
  deadlineDays: number
  ratio: number // elapsed over deadline; can exceed 1
  tone: ClockTone
  label: string
}

/** Days since notifiedAt against deadlineDays. Amber at 60% elapsed, red when past. Stops when paid. */
export function readClock(claim: Claim, now = Date.now()): ClockReading {
  const started = Date.parse(claim.notifiedAt)
  const elapsedDays = Math.max(0, Math.floor((now - (Number.isNaN(started) ? now : started)) / DAY_MS))
  const deadlineDays = Math.max(1, claim.deadlineDays)
  const ratio = elapsedDays / deadlineDays
  if (claim.stage === 4) {
    return { elapsedDays, deadlineDays, ratio, tone: 'done', label: `Paid on day ${elapsedDays}` }
  }
  if (elapsedDays >= deadlineDays) {
    const over = elapsedDays - deadlineDays
    return {
      elapsedDays,
      deadlineDays,
      ratio,
      tone: 'clay',
      label: over === 0 ? 'Deadline today' : `${over} day${over === 1 ? '' : 's'} past deadline`,
    }
  }
  const left = deadlineDays - elapsedDays
  const tone: ClockTone = ratio >= 0.6 ? 'gold' : 'mint'
  return { elapsedDays, deadlineDays, ratio, tone, label: `${left} day${left === 1 ? '' : 's'} left` }
}

export const isOpen = (c: Claim) => c.stage < 4
export const isPastDeadline = (c: Claim, now = Date.now()) => isOpen(c) && readClock(c, now).tone === 'clay'

export interface Summary {
  open: number
  pastDeadline: number
  averageAgeDays: number
  total: number
}

export function summarise(claims: Claim[], now = Date.now()): Summary {
  const open = claims.filter(isOpen)
  const basis = open.length ? open : claims
  const avg = basis.length ? basis.reduce((a, c) => a + readClock(c, now).elapsedDays, 0) / basis.length : 0
  return {
    open: open.length,
    pastDeadline: claims.filter((c) => isPastDeadline(c, now)).length,
    averageAgeDays: Math.round(avg),
    total: claims.length,
  }
}

/** FCFA with thousands separators, e.g. "4,150,000 FCFA". */
export function formatFcfa(amount: number): string {
  const whole = Math.round(Math.abs(amount))
  const grouped = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${amount < 0 ? '-' : ''}${grouped} FCFA`
}

export function insurerName(insurerId?: string): string {
  return insurerId ? `Insurer ${insurerId}` : 'Insurer not yet matched'
}

export interface HandshakeStatus {
  issuing: string
  handling: string
}

/** What each bureau has done at this stage of the handshake. */
export const HANDSHAKE: Record<Stage, HandshakeStatus> = {
  0: { issuing: 'Notified', handling: 'Acknowledged' },
  1: { issuing: 'Card confirmed', handling: 'Verification received' },
  2: { issuing: 'Reserve agreed', handling: 'Assessment complete' },
  3: { issuing: 'Offer approved', handling: 'Offer made to claimant' },
  4: { issuing: 'Handling bureau reimbursed', handling: 'Claimant paid' },
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
