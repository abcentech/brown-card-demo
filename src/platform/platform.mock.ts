import { mulberry32 } from '../shared/rng'
import { formatCard, hasValidCheckDigit, isWellFormed, normaliseCard, randomCard } from '../shared/cardNumber'
import { returnRows } from '../shared/selectors'
import { getResetGeneration, useDemo } from '../state/store'
import type { Platform } from './platform'
import type { Claim, IssuedPolicy, VerifyResult } from '../shared/types'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
/** Resolves false if the demo was reset while we were waiting, so the caller must not mutate the fresh state. */
const waitUnlessReset = async (ms: number) => {
  const gen = getResetGeneration()
  await sleep(ms)
  return getResetGeneration() === gen
}
class ResetDuringRequest extends Error {
  constructor() { super('The demo was reset while this request was in flight.') }
}
const LATENCY = { verify: 350, create: 600, list: 120, action: 500, issue: 500 }
let counter = Date.now() % 100000
const rng = mulberry32(counter)

const addMonths = (d: Date, n: number) => {
  const x = new Date(d.getTime())
  x.setMonth(x.getMonth() + n)
  return x
}

export const mockPlatform: Platform = {
  async verifyCard(raw): Promise<VerifyResult> {
    await sleep(LATENCY.verify)
    const cardNumber = normaliseCard(raw)
    if (!isWellFormed(cardNumber) || !hasValidCheckDigit(cardNumber)) {
      return { status: 'invalid', cardNumber, message: 'Not a valid Brown Card number. Check the digits and try again.' }
    }
    const entry = useDemo.getState().registry[cardNumber]
    if (!entry) return { status: 'not_found', cardNumber, message: 'No card on the register. Refer for inspection.' }
    const base = { cardNumber, insurerId: entry.insurerId, holder: entry.holder, vehicle: entry.vehicle, cover: entry.cover, validTo: entry.validTo }
    return entry.state === 'covered'
      ? { status: 'covered', message: 'Active policy, Brown Card recorded.', ...base }
      : { status: 'lapsed', message: 'A genuine card, but the policy has expired.', ...base }
  },

  async createIncident(input) {
    const gen = getResetGeneration()
    if (!(await waitUnlessReset(LATENCY.create))) throw new ResetDuringRequest()
    const v = await mockPlatform.verifyCard(input.cardNumber)
    if (getResetGeneration() !== gen) throw new ResetDuringRequest()
    const verified = v.status === 'covered'
    // The counter restarts on every page load, so skip refs already held by persisted claims.
    const taken = new Set(useDemo.getState().claims.flatMap((c) => [c.ref, c.incidentRef ?? '']))
    let incidentRef = ''
    let claimRef = ''
    do {
      counter += 1
      incidentRef = `IR-26-${String(10000 + (counter % 90000))}`
      claimRef = `CL-${String(500 + (counter % 500)).padStart(4, '0')}`
    } while (taken.has(claimRef) || taken.has(incidentRef))
    const claim: Claim = {
      ref: claimRef,
      incidentRef,
      cardNumber: v.cardNumber,
      insurerId: v.insurerId,
      accidentCountry: input.country,
      handlingBureau: `${input.country} Bureau`,
      issuingBureau: 'Nigeria Bureau',
      stage: 0, // every new record starts as Notified (docs/CONTRACT.md)
      notifiedAt: new Date().toISOString(),
      deadlineDays: 180,
      reserveFcfa: 0,
      injuries: input.injuries,
      documents: input.photoCount > 0 ? [`${input.photoCount} photo(s)`] : [],
      escalated: false,
      source: 'reporter',
    }
    useDemo.getState().addClaim(claim)
    return {
      incidentRef,
      claimRef,
      verified,
      smsPreview: `Report ${incidentRef} received. Claim ${claimRef} opened with the ${input.country} Bureau. Keep your documents and photos. Demo message.`,
    }
  },

  async listClaims() {
    await sleep(LATENCY.list)
    return useDemo.getState().claims
  },

  async listMissingCardPolicies() {
    await sleep(LATENCY.list)
    return useDemo.getState().exceptions
  },

  async applyExceptionAction(ids, action, assignee) {
    if (!(await waitUnlessReset(LATENCY.action))) return 0
    return useDemo.getState().applyExceptionAction(ids, action, assignee)
  },

  async getQuarterlyReturn() {
    await sleep(LATENCY.list)
    return returnRows(useDemo.getState())
  },

  async issuePolicy(input): Promise<IssuedPolicy> {
    if (!(await waitUnlessReset(LATENCY.issue))) throw new ResetDuringRequest()
    // Never hand out a number already on the register (seeded or issued in an earlier session).
    const registry = useDemo.getState().registry
    let cardNumber = randomCard(rng) || formatCard('00000000')
    for (let tries = 0; registry[cardNumber] && tries < 50; tries++) cardNumber = randomCard(rng)
    const validTo = addMonths(new Date(), input.termMonths).toISOString().slice(0, 10)
    const issued: IssuedPolicy = { ...input, cardNumber, validTo }
    useDemo.getState().addRegistryEntry(
      cardNumber,
      {
        insurerId: input.insurerId, holder: input.holder, vehicle: input.vehicle,
        cover: input.cover === 'comprehensive' ? 'Comprehensive' : 'Third party', validTo, state: 'covered',
      },
      issued,
    )
    return issued
  },

  async advanceClaim(ref) {
    useDemo.getState().advanceClaim(ref)
  },

  async escalateClaim(ref) {
    useDemo.getState().escalateClaim(ref)
  },
}
