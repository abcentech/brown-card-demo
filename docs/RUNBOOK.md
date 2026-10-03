# Presenter cue card (Monday)

One accident, five steps, 30 minutes. Drive it from the stepper at the top of the main window. Keys `1` to `5` jump to
a step; `Shift+R` resets everything (in every window). Screenshots in `docs/screenshots/` show what the projector
should look like at 1366 x 768. The whole click path is rehearsed by `tests/e2e/full-run.spec.ts` (about 12 seconds
when a machine does it).

Two windows: the **main window** (the stepper) on the projector, and the **claims window** (`/?view=claims`) ready
behind it or on the second screen. The `Open claims window` button in the header opens it.

## Before you leave the office

- [ ] `npm run build` (must finish with "built in" and no errors)
- [ ] `npm run preview` and open `http://localhost:4173/`
- [ ] Open a second window at `http://localhost:4173/?view=claims` (or press `Open claims window`)
- [ ] Network off test: turn Wi-Fi off, reload both windows, click through steps 1 to 5, issue a policy. All of it must work.
- [ ] Wi-Fi back on (or leave it off; the demo does not need it)
- [ ] Press `Reset demo`. Check: `Issued this session (0)`, the phone says `Dial *000#`, compliance reads `93.4%`
- [ ] Browser zoom at 100%, projector at 1366 x 768 or larger, laptop not in battery-saver mode
- [ ] Close every other tab. Press `F` (or the `Full screen` button) in the main window so only the demo shows
- [ ] Have `docs/CONTRACT.md` open in a text editor as a fallback for step 5

Start the meeting with the main window showing the opening card ("One accident. One card. Thirty minutes.") and the claims window loaded but hidden. The opening card appears after every reset.

## Step 0: Reset (10 seconds)

Click `Reset demo` (top right) or press `Shift+R`. Both windows return to the start state and the opening card comes back. When you are ready, click `Start the demo` (or press `Enter`): step 1 appears.

Fallback: if a window looks stale, reload it. State is in the browser, so a reload keeps the current data.

## Step 1: Issue and check (3 minutes)

Screenshot: `docs/screenshots/step1.png`

Clicks:
1. Leave the policy form as it is (sample holder, cover and term are pre-filled).
2. Click `Issue policy and allocate card`. A card number appears under `Issued this session (1)`.
3. Scroll to `Check a card by short code`. On the keypad press `*`, `0`, `0`, `0`, `#`, then `Call`.
4. Click the `Issued just now` chip (it carries the new card number), then `Verify card`.

Say: "We start from what they already run: a policy is issued, a card number is allocated, and anyone with a phone
can check it."

Audience sees: a phone screen reading `Status: COVERED` with the card number, holder, insurer, cover and expiry.

Fallback: if the chip is missing, click `Covered` instead (a sample card that always verifies). If the keypad
misbehaves, press `End` and dial again. `Shift+R` and start over costs 20 seconds.

## Step 2: Incident report (7 minutes)

Screenshot: `docs/screenshots/step2.png`

Before you start: make sure the claims window is open at `/?view=claims` so the arrival in step 3 is live.

Clicks (all inside the phone frame):
1. Press `2` or click `Incident report`.
2. Type the card number from step 1 (or the covered sample `NG-26-4A7C-1180-1`). Wait for the green check. Click `Next`.
3. Border crossing: `Seme–Krake`. Accident country: `Benin`. Click `Next`.
4. Injuries: `No` (or `Yes` if you want the handling bureau to show a medical flag). Type one line in the description.
   Add a photo if you like; it is optional. Click `Review`.
5. Click `Send report`.

Say: "A report takes minutes, from any phone, and the card is checked live while the driver types it."

Audience sees: `Report received` with an incident reference (`IR-26-…`), a claim reference (`CL-…`), the line
`Card verified. Claim opened.`, and below it the SMS preview. Scroll inside the phone to show the SMS and the
"What happens next" note.

Fallback: if the card is rejected, use the covered sample card above. If the network is off the button reads
`Save and send when online`; press it, the report queues and sends by itself when the connection returns. If the
phone frame is cut off, zoom the browser out one step (`Ctrl+-`).

## Step 3: Claims dashboard (5 minutes)

Screenshots: `docs/screenshots/claims-arrival.png` (the second window), `docs/screenshots/step3.png` (main window)

Clicks:
1. Switch to the claims window. The new claim is at the top with a gold highlight and `New from reporter`, and the
   header reads `new: CL-…`. It arrives about one second after `Send report` (measured 1.2 s).
2. Back in the main window press `3` or click `Claims dashboard`. Click the new claim reference (left column).
3. In the side panel, point at `Issuing bureau: Nigeria Bureau` and `Handling bureau: Benin Bureau`, and the
   turnaround clock at `Day 0 of 180`.
4. Click `Move to next stage: Card verified`. The stage dots move to 2 of 5.
5. Click `Escalate to the Council of Bureaux`. The panel shows `Escalated` and the claims window follows.

Say: "It feeds their dashboard, not a parallel one. The claim is Notified within seconds, both bureaux are in the
handshake, and the insurer's clock has started."

Audience sees: the claim row with stage dots, the two bureau cards, and the red `Escalated` badge in both windows.

Fallback: the operators may prefer their own deployed claims demo for this step; our dashboard is a labelled
stand-in, so switch to theirs and say so. If the claim did not arrive, reload the claims window: it reads the same
saved state. If the panel is off-screen, scroll down inside the main window; the panel sits to the right of the table.

## Step 4: Compliance console (8 minutes)

Screenshots: `docs/screenshots/compliance-after-backfill.png`, `docs/screenshots/step4.png`

Clicks:
1. Press `4` or click `Compliance console`. The headline reads `93.4%` inside the 90 to 95% band.
2. Scroll to `Exception list`. Set `Channel` to `Broker` (or `Insurer` to one insurer). The count changes to
   `Showing 30 of 150 batches`.
3. Tick five open batches. The bar reads `5 batches selected · N policies`.
4. Click `Back-fill`. A toast reads `Cleared … policies in 5 batches`; the ticked rows turn `Resolved`.
5. Scroll up: the headline has climbed (93.4% to 93.6% in rehearsal) and the marker moved. Scroll back down.
6. Tick three more open batches. Click `Remind` (rows turn `Reminded`), then `Assign` (rows turn `Assigned` with
   `Compliance desk, Insurer X`).
7. Scroll to `NAICOM quarterly return (preview)` and click `Download quarterly return`. `quarterly_return.csv` lands in Downloads.

Say: "The last 5% is visible and closable: who, which channel, which cause, and the return writes itself."

Audience sees: the big percentage with the target band, the bars by insurer, channel and cause, the exception rows
changing status, and the return table refreshing after each action.

Fallback: if the headline did not move, you ticked rows already resolved; tick rows marked `Open`. `Clear filters`
resets the view. If the download is blocked, the preview table on screen carries the same figures. `Shift+R`
restores 93.4% in a second if you want to run the climb again.

## Step 5: Close (7 minutes)

Screenshot: `docs/screenshots/step5.png`

Clicks: press `5` or click `Close`. Nothing else to click; scroll once to show the three columns and the meeting
decision line.

Say: "A clear next step: one corridor, Nigeria to Benin through Seme, built on the operators' platform, with a named
working group."

Audience sees: `Start with one corridor. Build on the operators' platform.`, the pilot card, three columns
(interfaces, operating rules, working group) and the meeting decision.

Talking points: the questions for the operators (from `docs/CONTRACT.md`)
- Is there a documented verification API, callable from a sandbox?
- Can the claims side accept a new incident record from an outside channel? Which fields are required?
- Can the existing short code carry a report option, and who approves it?
- Status and date of the regional ratification, and what the card-transmission API will look like.
- How do insurers and intermediaries connect today, and what share of policies arrives through each route?
- Where is data hosted, and which data-protection terms apply?
- How does the escalation cadre map to the Council of Bureaux?
- How is claim turnaround defined under the local and regional rules?

Ask for: a working-group nomination, a sandbox contact, and a date for the pilot-scoping session.

Fallback: if the screen is lost, the same content is in `docs/DEMO_SCRIPT.md` and `docs/CONTRACT.md`.

## If everything goes wrong

- `Shift+R` in any window resets both windows in under a second.
- Reload: state survives a reload, so you continue where you were.
- Second window lost: click `Open claims window` in the header, or type `/?view=claims` after the address.
- Projector too small: zoom out one step with `Ctrl+-`; the layout holds down to about 1024 px wide.
- Remember the banner: everything is illustrative data; Insurers A to L; no real people or numbers.
