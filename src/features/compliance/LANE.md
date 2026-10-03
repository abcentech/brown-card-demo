# Lane: compliance console  (agent: Fable; also the architect and merger)

Folder: `src/features/compliance/`. Default export `ComplianceScreen` from `index.tsx`.

## Build
The "last 5%" story. Illustrative data only.

- **Headline**: the compliance figure (`compliancePct` from `src/shared/selectors.ts`), starting at 93.4%, drawn against a 90 to 95% target band with a clear marker. It must visibly climb when exceptions are cleared.
- **By insurer**: bars for Insurer A to L showing coverage (`returnRows`), with the lowest highlighted.
- **By channel and cause**: where the gap sits (direct, agent, broker, bank; data error, late entry, system not calling the API, intermediary). Hand-drawn SVG or CSS bars; no chart library.
- **Exception list**: the `exceptions` rows, filterable by insurer, channel and cause, with selection. Actions on the selection through `platform.applyExceptionAction(ids, action)`:
  - **Back-fill**: resolves the batch (compliance climbs)
  - **Remind**: marks the exception reminded (intermediaries)
  - **Assign**: marks it assigned to a named contact
  Show a short confirmation ("Cleared 1,240 policies").
- **NAICOM return**: a preview table from `platform.getQuarterlyReturn()` (insurer, motor policies, cards generated, coverage). The CSV download is built by the extras lane; leave a button placeholder.
- A line explaining that causes are working hypotheses to be measured against the real baseline.

## Also (architect duties)
Own all merges and the frozen files. Review other lanes against `docs/ACCEPTANCE.md` at each merge window (about hour 2.5 and hour 4).

## Done when
Starts at exactly 93.4%; clearing a batch moves the headline and the bars; reset restores 93.4%; readable on a projector.
