// To be filled in once the operators confirm their API (see docs/CONTRACT.md).
import type { Platform } from './platform'

const todo = (name: string) => async (): Promise<never> => {
  throw new Error(`platform.live: ${name} is not implemented yet`)
}

export const livePlatform: Platform = {
  verifyCard: todo('verifyCard'),
  createIncident: todo('createIncident'),
  listClaims: todo('listClaims'),
  listMissingCardPolicies: todo('listMissingCardPolicies'),
  applyExceptionAction: todo('applyExceptionAction'),
  getQuarterlyReturn: todo('getQuarterlyReturn'),
  issuePolicy: todo('issuePolicy'),
  advanceClaim: todo('advanceClaim'),
}
