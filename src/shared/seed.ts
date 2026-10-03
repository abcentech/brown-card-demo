// Deterministic seed data. Everything is anonymised and illustrative. FROZEN after the scaffold.
import { mulberry32 } from './rng'
import { formatCard } from './cardNumber'
import type { Cause, Channel, Claim, ExceptionRow, Insurer, RegistryEntry } from './types'

export const SEED = 2026
export const STARTING_COMPLIANCE_PCT = 93.4

const POLICIES = [14000, 12000, 11000, 10000, 9500, 9000, 8500, 7500, 6500, 5500, 4000, 2500]
export const INSURERS: Insurer[] = POLICIES.map((p, i) => ({
  id: String.fromCharCode(65 + i),
  name: `Insurer ${String.fromCharCode(65 + i)}`,
  motorPolicies: p,
}))
export const TOTAL_POLICIES = POLICIES.reduce((a, b) => a + b, 0) // 100,000
export const UNCARDED_TOTAL = Math.round(TOTAL_POLICIES * (1 - STARTING_COMPLIANCE_PCT / 100)) // 6,600
export const EXCEPTION_COUNT = 150

function pick<T>(rng: () => number, items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = rng() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

export function seedExceptions(): ExceptionRow[] {
  const rng = mulberry32(SEED)
  const insurerWeights = INSURERS.map((ins, i) => ins.motorPolicies * (1 + i * 0.12))
  const channels: Channel[] = ['direct', 'agent', 'broker', 'bank']
  const channelWeights = [0.25, 0.35, 0.25, 0.15]

  const rows = Array.from({ length: EXCEPTION_COUNT }, (_, i) => {
    const insurer = pick(rng, INSURERS, insurerWeights)
    const channel = pick(rng, channels, channelWeights)
    const smallInsurer = INSURERS.indexOf(insurer) >= 8
    let cause: Cause
    if (channel === 'agent' || channel === 'broker') {
      cause = pick<Cause>(rng, ['intermediary', 'data_error', 'late_entry', 'system_not_calling_api'], [0.5, 0.2, 0.2, 0.1])
    } else {
      cause = pick<Cause>(
        rng,
        ['system_not_calling_api', 'data_error', 'late_entry', 'intermediary'],
        smallInsurer ? [0.5, 0.25, 0.25, 0] : [0.3, 0.35, 0.35, 0],
      )
    }
    return { raw: 10 + Math.floor(rng() * 70), insurer, channel, cause, i }
  })

  // Scale the batch sizes so they sum to exactly UNCARDED_TOTAL.
  const rawSum = rows.reduce((a, r) => a + r.raw, 0)
  const sizes = rows.map((r) => Math.max(1, Math.floor((r.raw * UNCARDED_TOTAL) / rawSum)))
  let diff = UNCARDED_TOTAL - sizes.reduce((a, b) => a + b, 0)
  for (let k = 0; diff !== 0; k = (k + 1) % sizes.length) {
    const step = diff > 0 ? 1 : -1
    if (sizes[k] + step >= 1) {
      sizes[k] += step
      diff -= step
    }
  }

  return rows.map((r, idx) => ({
    id: `EX-${String(idx + 1).padStart(3, '0')}`,
    insurerId: r.insurer.id,
    channel: r.channel,
    cause: r.cause,
    policiesAffected: sizes[idx],
    status: 'open' as const,
  }))
}

/** Sample cards, valid by construction. */
export const SAMPLE_COVERED = formatCard('4A7C1180')
export const SAMPLE_LAPSED = formatCard('91B20042')
export const SAMPLE_UNKNOWN = formatCard('7D315566') // well formed and check digit OK, but not on the register
export const SAMPLE_BAD_CHECK = 'NG-26-4A7C-1180-9' // fails the check digit

export function seedRegistry(): Record<string, RegistryEntry> {
  const yr = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10)
  return {
    [SAMPLE_COVERED]: { insurerId: 'A', holder: 'Sample holder 1', vehicle: 'Pick-up · SAMPLE-001', cover: 'Comprehensive', validTo: yr(2027, 1, 14), state: 'covered' },
    [SAMPLE_LAPSED]: { insurerId: 'D', holder: 'Sample holder 2', vehicle: 'Saloon car · SAMPLE-002', cover: 'Third party', validTo: yr(2026, 6, 30), state: 'lapsed' },
    [formatCard('2B6E0A31')]: { insurerId: 'C', holder: 'Sample holder 3', vehicle: 'Saloon car · SAMPLE-003', cover: 'Third party', validTo: yr(2027, 3, 2), state: 'covered' },
    [formatCard('C0F4D923')]: { insurerId: 'F', holder: 'Sample holder 4', vehicle: 'Truck · SAMPLE-004', cover: 'Comprehensive', validTo: yr(2027, 5, 21), state: 'covered' },
  }
}

const DAY = 24 * 60 * 60 * 1000
export function seedClaims(now = Date.now()): Claim[] {
  const mk = (
    ref: string, stage: Claim['stage'], daysAgo: number, deadlineDays: number, country: string,
    card: string, insurerId: string, reserveFcfa: number, injuries: boolean, docs: string[], escalated = false,
  ): Claim => ({
    ref, cardNumber: card, insurerId, accidentCountry: country, handlingBureau: `${country} Bureau`,
    issuingBureau: 'Nigeria Bureau', stage, notifiedAt: new Date(now - daysAgo * DAY).toISOString(),
    deadlineDays, reserveFcfa, injuries, documents: docs, escalated, source: 'seed',
  })
  return [
    mk('CL-0418', 2, 52, 180, 'Benin', SAMPLE_COVERED, 'A', 4150000, true, ['Police report', 'Assessor report']),
    mk('CL-0391', 2, 143, 180, 'Togo', formatCard('2B6E0A31'), 'C', 980000, false, ['Police report'], true),
    mk('CL-0455', 0, 9, 180, 'Ghana', formatCard('C0F4D923'), 'F', 2300000, false, []),
    mk('CL-0402', 3, 88, 180, 'Benin', SAMPLE_COVERED, 'A', 1750000, true, ['Police report', 'Medical report', 'Offer letter']),
    mk('CL-0377', 4, 171, 180, 'Niger', formatCard('2B6E0A31'), 'C', 620000, false, ['Police report', 'Payment advice']),
    mk('CL-0463', 1, 21, 180, 'Benin', formatCard('C0F4D923'), 'F', 3100000, true, ['Police report']),
  ]
}
