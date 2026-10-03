# Run it in the meeting room (offline guide)

One page for the presenter. The demo is a static web app: no backend, no internet, all data illustrative and
kept in the browser. You need a laptop with Python 3 or Node, a browser, and (optionally) a phone on the same Wi-Fi.

## 1. Build and package (the day before)

```
npm install
npm run build                                   # typecheck + production build into dist/
bash scripts/package-offline.sh                 # Mac/Linux/Git Bash
powershell -ExecutionPolicy Bypass -File scripts\package-offline.ps1   # Windows
```

This produces `brown-card-demo-offline-<yyyymmdd>.zip` in the repo root containing `dist/`, `START.txt`, `serve.sh`
and `serve.ps1`. Copy the zip to the presenting laptop (and a USB stick as a spare). Add `SKIP_BUILD=1` / `-SkipBuild`
to pack an existing `dist/` without rebuilding.

## 2. Serve

Unzip anywhere simple (Desktop). From inside the unzipped folder:

| Platform | Command |
| --- | --- |
| Windows | right-click `serve.ps1` > Run with PowerShell, or `powershell -ExecutionPolicy Bypass -File .\serve.ps1` |
| Mac/Linux | `bash serve.sh` |

The launcher runs `python -m http.server 8080 -d dist` when Python is present, otherwise `npx vite preview`
(Node; may need internet the first time, so test it beforehand). Leave the terminal window open; Ctrl+C stops it.

Without the zip, from the repo: `npm run build && npm run preview` serves `dist/` on port 4173 instead.

## 3. Two-window setup

1. Main window (presenter's screen): `http://localhost:8080`. This is the shell with the stepper and the five steps.
2. Second window (projector): `http://localhost:8080/?view=claims`. The claims dashboard alone, large type.
   Windows sync live through the browser: a report submitted in window 1 shows as **Notified** in window 2 in about
   1.5 seconds. `?view=reporter` and `?view=compliance` open those screens alone in the same way.

Drive from the keyboard: **1** to **5** jump to a step, **Shift+R** resets (also the "Reset demo" button). Shortcuts are
ignored while a text field has focus. The storyline per step is in `docs/DEMO_SCRIPT.md`.

## 4. Phone on the same Wi-Fi hotspot

To show step 2 on a real phone instead of the on-screen phone frame:

1. Put the laptop and the phone on the same network (the phone's hotspot is the easiest; no internet needed on it).
2. Serve with host binding. The launchers already bind all interfaces; from the repo use `npm run preview -- --host`.
3. Find the laptop's IP on that network: `ipconfig` (Windows, look for the Wi-Fi adapter's IPv4) or `ifconfig` / `ip a`.
4. On the phone, open `http://<laptop-ip>:8080/?view=reporter` (or `:4173` with `npm run preview`).

**Important limit.** There is no server behind the demo: state is synced between windows with the browser's
`BroadcastChannel`, which only reaches windows of the *same browser on the same machine*. A report submitted on the
phone is saved in the phone's own storage and will **not** appear on the laptop's dashboard. Use the phone to show
the hand-held experience (card check, crossing, parties, photos, offline queue), then do the live "report appears as
Notified" moment from the on-screen phone frame in step 2 (or a `?view=reporter` window) on the laptop.

If the phone cannot reach the laptop, the laptop firewall is usually blocking Python or Node; allow it on private
networks when prompted, or just use the phone frame inside step 2 (same screen, same flow).

## 5. If the port is taken

The server prints an error such as `Address already in use`. Pick another port and use it in every address:

```
bash serve.sh 8090
powershell -ExecutionPolicy Bypass -File .\serve.ps1 -Port 8090
npm run preview -- --port 8090
```

## 6. Reset

**Shift+R** or the **Reset demo** button returns every window to the starting state: 93.4% compliance, 6 seed claims,
the registry at its seed entries. Requests still in flight from before the reset are dropped, in every window.
Do a reset at the start of the meeting and before any rehearsal.

## 7. Where the state lives

Everything (claims, exceptions, issued cards, the current step) lives in the browser's `localStorage` for the origin
you opened (`localhost:8080`). That is why:

- the network can be switched off entirely once the page has loaded;
- closing and reopening the browser keeps where you were;
- two windows of the same origin share state, but a different port or host is a different, independent copy;
- if something looks odd and Shift+R does not fix it: open the browser's site settings for `localhost:8080`, clear
  site data (or "Application > Storage > Clear site data" in DevTools), and reload.

Private/incognito windows also work but start fresh each time and do not share with normal windows.

## Checklist for the bag

- [ ] Zip on the laptop and on a USB stick; Python 3 or Node confirmed on the laptop
- [ ] Unzipped once and served; both windows opened; one full run-through with Shift+R at the end
- [ ] Projector resolution checked with `?view=claims` (large type is on by design)
- [ ] Phone paired on the hotspot and `?view=reporter` opened once, or decision made to use the on-screen phone frame
- [ ] `docs/DEMO_SCRIPT.md` and `docs/RUNBOOK.md` printed or open on a second device
