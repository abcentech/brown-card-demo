# Lane: incident reporter  (agent: Sonnet)

Folder: `src/features/reporter/`. Default export `ReporterScreen` from `index.tsx` (keep the export name).

## Build
A mobile-first, one-hand-friendly report flow that takes about two minutes. It is shown inside a phone frame on the laptop (step 2) and also stands alone at `/?view=reporter` for a real phone.

Steps (one screen each, with a progress indicator):
1. **Card**: enter the card number; check live with `platform.verifyCard`. Show the result clearly: covered (green), lapsed (amber), not found or invalid (red). A report may still be submitted when not covered; flag it. Offer the sample cards from `src/shared/seed.ts` as tappable chips for the demo (`SAMPLE_COVERED`, `SAMPLE_LAPSED`, `SAMPLE_UNKNOWN`, `SAMPLE_BAD_CHECK`).
2. **Where**: pick the crossing (Seme–Krake, Idiroko–Igolo, Illela–Birnin Konni, Other) and the accident country (Benin, Togo, Ghana, Niger). Offer "Use my location" only if available; never block on it.
3. **What happened**: parties involved (1 to 5), injuries (yes/no), a short description, and up to 3 photos (`<input type="file" accept="image/*" capture="environment">`; count them, you need not upload).
4. **Review and submit**: call `platform.createIncident`. Show the incident reference, the claim reference, an SMS preview, and a plain "what happens next" line (the handling bureau, the issuing bureau and the insurer have been notified).

Extras: an offline queue (if `navigator.onLine` is false, hold the report and send when back online), and a clear "Start another report" button.

## Do not
Edit anything outside this folder, call the store directly, add dependencies, or use remote assets.

## Done when
- A report submits and returns references in under 2 seconds after the final tap (the mock adds about 1 second).
- The new claim appears on the dashboard within 3 seconds (another lane's screen; check in a second window).
- Works at 360px width; tap targets at least 44px; works with the network off.
