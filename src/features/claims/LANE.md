# Lane: claims dashboard stand-in  (agent: Gemini)

Folder: `src/features/claims/`. Default export `ClaimsScreen` from `index.tsx`.
Also owns polish of `src/features/shell/` (stepper, phone frame, banners) once the dashboard is done.

## Build
A clear stand-in for the operators' claims dashboard. Label it "Stand-in for the operators' claims system" so nobody mistakes it for theirs. Projector-readable.

- **List**: ref, accident country and handling bureau, issuing bureau (Nigeria), insurer, stage (5-step tracker: Notified, Card verified, Assessed, Offer made, Paid), and a **turnaround clock** (days since `notifiedAt` against `deadlineDays`; amber at 60% elapsed, red when past).
- **Live arrivals**: when a report is submitted elsewhere, the new claim appears at the top within 3 seconds with a brief highlight. Use `useDemo((s) => s.claims)` and `revision` for the effect. The store syncs across windows by itself (BroadcastChannel).
- **Handshake panel** on a selected claim: issuing bureau and handling bureau, each with a status (for example "Notified", "Acknowledged"), plus documents list, escalation to the Council of Bureaux (a flag and a button), and a "Move to next stage" button that calls `platform.advanceClaim`.
- **Summary strip**: open claims, past deadline, average age.

## Shell polish (second task)
Improve `Shell.tsx` and `PhoneFrame.tsx`: clearer stepper, larger type for the projector, the banner always visible. Keep keys 1 to 5 and Shift+R. Do not change `App.tsx`.

## Do not
Edit outside `src/features/claims/` and `src/features/shell/`, write to the store directly, add dependencies, or use remote assets.

## Done when
A seeded view with 6 claims reads well on a projector; a claim submitted from `/?view=reporter` in another window shows up within 3 seconds; advancing a claim updates the tracker.
