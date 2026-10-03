// FROZEN after the scaffold. Changes go through the architect (see AGENTS.md).

export type Channel = 'direct' | 'agent' | 'broker' | 'bank'
export type Cause = 'data_error' | 'late_entry' | 'system_not_calling_api' | 'intermediary'
export type ExceptionStatus = 'open' | 'reminded' | 'assigned' | 'resolved'
export type ExceptionAction = 'backfill' | 'remind' | 'assign'

export interface Insurer {
  id: string // 'A'..'L'
  name: string // 'Insurer A' (anonymised; never use real names)
  motorPolicies: number
}

/** A batch of motor policies that carry no Brown Card number. */
export interface ExceptionRow {
  id: string // 'EX-001'
  insurerId: string
  channel: Channel
  cause: Cause
  policiesAffected: number
  status: ExceptionStatus
  assignee?: string // illustrative contact, set by the assign action
}

export const STAGES = ['Notified', 'Card verified', 'Assessed', 'Offer made', 'Paid'] as const
export type Stage = 0 | 1 | 2 | 3 | 4

export interface Claim {
  ref: string // 'CL-0418'
  incidentRef?: string // present when created from the reporter
  cardNumber: string
  insurerId?: string
  accidentCountry: string // e.g. 'Benin'
  handlingBureau: string // e.g. 'Benin Bureau'
  issuingBureau: string // 'Nigeria Bureau'
  stage: Stage
  notifiedAt: string // ISO time; the turnaround clock runs from here
  deadlineDays: number // target for the insurer clock
  reserveFcfa: number
  injuries: boolean
  documents: string[]
  escalated: boolean
  source: 'seed' | 'reporter'
}

export type VerifyStatus = 'covered' | 'lapsed' | 'not_found' | 'invalid'

export interface VerifyResult {
  status: VerifyStatus
  cardNumber: string
  message: string
  insurerId?: string
  holder?: string
  vehicle?: string
  cover?: string
  validTo?: string // ISO date
}

export interface IncidentInput {
  cardNumber: string
  crossing: string // e.g. 'Seme–Krake'
  country: string // accident country
  parties: number
  injuries: boolean
  narrative: string
  photoCount: number
}

export interface IncidentResult {
  incidentRef: string // 'IR-26-XXXXX'
  claimRef: string // 'CL-XXXX'
  verified: boolean
  smsPreview: string
}

export interface PolicyInput {
  holder: string
  vehicle: string
  insurerId: string
  cover: 'third_party' | 'comprehensive'
  termMonths: 6 | 12
}

export interface IssuedPolicy extends PolicyInput {
  cardNumber: string
  validTo: string
}

export interface ReturnRow {
  insurerId: string
  insurerName: string
  motorPolicies: number
  cardsGenerated: number
  coveragePct: number
}

export interface RegistryEntry {
  insurerId: string
  holder: string
  vehicle: string
  cover: string
  validTo: string
  state: 'covered' | 'lapsed'
}

export type DemoStep = 0 | 1 | 2 | 3 | 4
export const STEP_LABELS = [
  'Issue and short-code check',
  'Incident report',
  'Claims dashboard',
  'Compliance console',
  'Close',
] as const
