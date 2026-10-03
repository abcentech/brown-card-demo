// Reporter lane: the local draft shape and fixed option lists. Nothing here touches the store.
import type { IncidentInput, VerifyResult, VerifyStatus } from '../../shared/types'

export const CROSSINGS = ['Seme–Krake', 'Idiroko–Igolo', 'Illela–Birnin Konni', 'Other'] as const
export const COUNTRIES = ['Benin', 'Togo', 'Ghana', 'Niger'] as const
export type Crossing = (typeof CROSSINGS)[number]
export type Country = (typeof COUNTRIES)[number]

/** The country on the far side of each crossing; pre-selected when a crossing is picked. */
export const CROSSING_COUNTRY: Partial<Record<Crossing, Country>> = {
  'Seme–Krake': 'Benin',
  'Idiroko–Igolo': 'Benin',
  'Illela–Birnin Konni': 'Niger',
}

export const MAX_PHOTOS = 3
export const MAX_PARTIES = 5
export const MAX_NARRATIVE = 400

export const STEP_TITLES = ['Card', 'Where', 'What happened', 'Review and submit'] as const
export type StepIndex = 0 | 1 | 2 | 3

export interface Draft {
  cardNumber: string
  verify: VerifyResult | null
  crossing: Crossing | null
  country: Country | null
  location: { lat: number; lon: number } | null
  parties: number
  injuries: boolean | null
  narrative: string
  photoCount: number
}

export const emptyDraft = (): Draft => ({
  cardNumber: '',
  verify: null,
  crossing: null,
  country: null,
  location: null,
  parties: 2,
  injuries: null,
  narrative: '',
  photoCount: 0,
})

export function toIncidentInput(d: Draft): IncidentInput {
  return {
    cardNumber: d.verify?.cardNumber ?? d.cardNumber.trim().toUpperCase(),
    crossing: d.crossing ?? 'Other',
    country: d.country ?? 'Benin',
    parties: Math.min(MAX_PARTIES, Math.max(1, d.parties)),
    injuries: d.injuries === true,
    narrative: d.narrative.trim().slice(0, MAX_NARRATIVE),
    photoCount: Math.min(MAX_PHOTOS, Math.max(0, d.photoCount)),
  }
}

/** Plain-English label and theme colouring for each verification outcome. */
export const STATUS_META: Record<VerifyStatus, { label: string; tone: 'mint' | 'gold' | 'clay' }> = {
  covered: { label: 'Covered', tone: 'mint' },
  lapsed: { label: 'Policy lapsed', tone: 'gold' },
  not_found: { label: 'Not on the register', tone: 'clay' },
  invalid: { label: 'Not a valid number', tone: 'clay' },
}

// Full class strings so Tailwind can see them at build time.
export const TONE_CLASSES = {
  mint: { panel: 'border-mint bg-mint/10', badge: 'bg-mint text-paper' },
  gold: { panel: 'border-gold bg-gold/15', badge: 'bg-gold text-ink' },
  clay: { panel: 'border-clay bg-clay/10', badge: 'bg-clay text-paper' },
} as const
