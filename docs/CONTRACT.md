# API we assume from the operators

We do not yet know the operators' real API. The app calls one adapter (`src/platform/platform.ts`) with two
implementations: `platform.mock.ts` (used on Monday) and `platform.live.ts` (to fill in once they confirm).
This table is our assumption and the one-page contract we hand to the operators.

| Call | Purpose | Adapter method |
| --- | --- | --- |
| `GET /cards/{number}/verify` | covered, lapsed or not found, with policy details | `verifyCard` |
| `POST /incidents` | creates a claim record with status Notified; returns incident and claim references | `createIncident` |
| `GET /claims?issuing=NG` | claims against Nigerian-issued cards, with stage, bureaux and clock | `listClaims` |
| `GET /compliance/policies?missing_card=true` | motor policies with no card, with insurer, channel and cause | `listMissingCardPolicies` |
| `POST /cards/backfill` | allocates cards to a batch of listed policies (reminder and assignment actions too) | `applyExceptionAction` |
| `GET /returns/quarterly` | card counts and details for the NAICOM return | `getQuarterlyReturn` |
| Webhook `claim.status_changed` | pushes stage changes | `advanceClaim` (demo stand-in) |
| (platform stand-in) | issue a policy and allocate a card | `issuePolicy` |

If their claims API cannot accept an outside incident record, the fallback is an export in the format their dashboard imports.

Card numbers use a PLACEHOLDER format `NG-26-XXXX-XXXX-C` with a check digit (`src/shared/cardNumber.ts`). Replace when the real format is known.

## Questions for the operators
- Is there a documented verification API, callable from a sandbox?
- Can the claims side accept a new incident record from an outside channel? Which fields are required?
- Can the existing short code carry a report option, and who approves it?
- Status and date of the regional ratification, and what the card-transmission API will look like.
- How do insurers and intermediaries connect today, and what share of policies arrives through each route?
- Where is data hosted, and which data-protection terms apply?
- How does the escalation cadre map to the Council of Bureaux?
- How is claim turnaround defined under the local and regional rules?
