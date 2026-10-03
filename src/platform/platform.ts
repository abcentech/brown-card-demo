// The adapter between the demo and the operators' platform. FROZEN after the scaffold.
// The app never calls the operators' system directly; it calls this interface.
// platform.mock.ts is used on Monday; platform.live.ts is filled in once the operators confirm their API.
import type {
  Claim, ExceptionAction, ExceptionRow, IncidentInput, IncidentResult, IssuedPolicy,
  PolicyInput, ReturnRow, VerifyResult,
} from '../shared/types'

export interface Platform {
  /** GET /cards/{number}/verify */
  verifyCard(cardNumber: string): Promise<VerifyResult>
  /** POST /incidents: creates a claim record with status Notified */
  createIncident(input: IncidentInput): Promise<IncidentResult>
  /** GET /claims?issuing=NG */
  listClaims(): Promise<Claim[]>
  /** GET /compliance/policies?missing_card=true */
  listMissingCardPolicies(): Promise<ExceptionRow[]>
  /** POST /cards/backfill (and reminder / assignment actions). Resolves to policies cleared. */
  applyExceptionAction(ids: string[], action: ExceptionAction): Promise<number>
  /** GET /returns/quarterly */
  getQuarterlyReturn(): Promise<ReturnRow[]>
  /** Platform stand-in: issue a policy and allocate a card */
  issuePolicy(input: PolicyInput): Promise<IssuedPolicy>
  /** Demo helper: move a claim to its next stage (stands in for claim.status_changed) */
  advanceClaim(ref: string): Promise<void>
}
