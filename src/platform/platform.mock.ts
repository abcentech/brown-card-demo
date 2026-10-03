import { mulberry32 } from '../shared/rng'
import { formatCard, hasValidCheckDigit, isWellFormed, normaliseCard, randomCard } from '../shared/cardNumber'
import { returnRows } from '../shared/selectors'
import { useDemo } from '../state/store'
import type { Platform } from './platform'
import type { Claim, IssuedPolicy, VerifyResult } from '../shared/types'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
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
    await sleep(LATENCY.create)
    const v = await mockPlatform.verifyCard(input.cardNumber)
    const verified = v.status === 'covered'
    counter += 1
    const incidentRef = `IR-26-${String(10000 + (counter % 90000))}`
    const claimRef = `CL-${String(500 + (counter % 500)).padStart(4, '0')}`
    const claim: Claim = {
      ref: claimRef,
      incidentRef,
      cardNumber: v.cardNumber,
      insurerId: v.insurerId,
      accidentCountry: input.country,
      handlingBureau: `${input.country} Bureau`,
      issuingBureau: 'Nigeria Bureau',
      stage: verified ? 1 : 0,
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

  async applyExceptionAction(ids, action) {
    await sleep(LATENCY.action)
    return useDemo.getState().applyExceptionAction(ids, action)
  },

  async getQuarterlyReturn() {
    await sleep(LATENCY.list)
    return returnRows(useDemo.getState())
  },

  async issuePolicy(input): Promise<IssuedPolicy> {
    await sleep(LATENCY.issue)
    const cardNumber = randomCard(rng) || formatCard('00000000')
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
}
