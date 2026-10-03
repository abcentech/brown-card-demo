#!/usr/bin/env bash
# Build the demo and pack it into brown-card-demo-offline-<yyyymmdd>.zip in the repo root.
# The zip holds dist/ plus START.txt and two tiny launchers (serve.ps1, serve.sh).
# Usage: bash scripts/package-offline.sh        (works on macOS, Linux and Windows Git Bash)
#        SKIP_BUILD=1 bash scripts/package-offline.sh   packs the existing dist/ without rebuilding
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAMP="$(date +%Y%m%d)"
ZIP_NAME="brown-card-demo-offline-$STAMP.zip"
STAGE="$ROOT/.offline-stage"
trap 'rm -rf "$STAGE"' EXIT

# A real Python 3, skipping the Windows Store "python3" stub that sits on PATH but cannot run.
pick_python() {
  for p in python3 python py; do
    if command -v "$p" >/dev/null 2>&1 && "$p" -c "import sys; sys.exit(0 if sys.version_info[0] >= 3 else 1)" >/dev/null 2>&1; then
      echo "$p"; return 0
    fi
  done
  return 1
}

cd "$ROOT"
if [ "${SKIP_BUILD:-}" = "1" ]; then
  [ -f "$ROOT/dist/index.html" ] || { echo "dist/index.html not found; run without SKIP_BUILD" >&2; exit 1; }
  echo "== Skipping build; packing existing dist/ =="
else
  echo "== Building (npm run build) =="
  npm run build
fi

echo "== Staging files =="
rm -rf "$STAGE"
mkdir -p "$STAGE"
cp -R "$ROOT/dist" "$STAGE/dist"

cat > "$STAGE/START.txt" <<'EOF'
The Brown Card as a service: offline demo
=========================================

This folder is the finished demo. It needs no internet and no install
beyond Python 3 (already on most laptops) or Node.

1. Unzip this file somewhere simple, e.g. your Desktop.
2. Start the local server from inside the unzipped folder:
     Windows:    right-click serve.ps1 > "Run with PowerShell"
                 (or in a terminal:  powershell -ExecutionPolicy Bypass -File .\serve.ps1)
     Mac/Linux:  bash serve.sh
   The launcher uses "python -m http.server" if Python is present, otherwise
   "npx vite preview" (that one needs Node and may need internet the first time).
3. Open a browser at            http://localhost:8080
4. Open a SECOND window at      http://localhost:8080/?view=claims
   and put it on the projector or beside the main window. A report
   submitted in the main window appears there as "Notified" within seconds.
   (/?view=reporter gives the phone screen alone; /?view=compliance the console.)

Driving the demo
  Keys 1 to 5 jump between the five steps. Shift+R resets everything to
  the starting state (or use the "Reset demo" button). Shortcuts are
  ignored while you are typing in a field.

Network
  The network can be OFF. Nothing is fetched from the internet; all data is
  illustrative and lives in the browser (localStorage). If something looks
  odd, press Shift+R; if that does not help, clear the site data for
  localhost:8080 in the browser and reload.

Port 8080 already in use?
  Run the launcher with another port:  bash serve.sh 8090
  or  powershell -ExecutionPolicy Bypass -File .\serve.ps1 -Port 8090
  and use that number in the addresses above.

Stop the server with Ctrl+C in its window.
EOF

cat > "$STAGE/serve.sh" <<'EOF'
#!/usr/bin/env bash
# Serve the offline demo from ./dist on port 8080 (or the port given as first argument).
PORT="${1:-8080}"
cd "$(dirname "$0")"
pick_python() {
  for p in python3 python py; do
    if command -v "$p" >/dev/null 2>&1 && "$p" -c "import sys; sys.exit(0 if sys.version_info[0] >= 3 else 1)" >/dev/null 2>&1; then
      echo "$p"; return 0
    fi
  done
  return 1
}
if PY="$(pick_python)"; then
  echo "Serving dist/ at http://localhost:$PORT  (Ctrl+C to stop)"
  echo "Second window: http://localhost:$PORT/?view=claims"
  exec "$PY" -m http.server "$PORT" --bind 0.0.0.0 -d dist
elif command -v npx >/dev/null 2>&1; then
  echo "Python not found; using vite preview at http://localhost:$PORT  (Ctrl+C to stop)"
  exec npx --yes vite preview --outDir dist --port "$PORT" --strictPort --host
else
  echo "Neither Python 3 nor Node (npx) was found. Install Python 3 and run again." >&2
  exit 1
fi
EOF
chmod +x "$STAGE/serve.sh" || true

cat > "$STAGE/serve.ps1" <<'EOF'
# Serve the offline demo from .\dist on port 8080 (or -Port <n>). Windows PowerShell 5.1 compatible.
param([int]$Port = 8080)
Set-Location -Path $PSScriptRoot
$python = $null
foreach ($name in @('python3', 'python', 'py')) {
  $cmd = Get-Command $name -ErrorAction SilentlyContinue
  if ($null -ne $cmd) {
    & $name -c "import sys; sys.exit(0 if sys.version_info[0] >= 3 else 1)" 2>$null
    if ($LASTEXITCODE -eq 0) { $python = $name; break }
  }
}
if ($null -ne $python) {
  Write-Host "Serving dist\ at http://localhost:$Port  (Ctrl+C to stop)"
  Write-Host "Second window: http://localhost:$Port/?view=claims"
  & $python -m http.server $Port --bind 0.0.0.0 -d dist
} elseif ($null -ne (Get-Command npx -ErrorAction SilentlyContinue)) {
  Write-Host "Python not found; using vite preview at http://localhost:$Port  (Ctrl+C to stop)"
  & npx --yes vite preview --outDir dist --port $Port --strictPort --host
} else {
  Write-Host "Neither Python 3 nor Node (npx) was found. Install Python 3 and run again."
  exit 1
}
EOF

echo "== Zipping to $ZIP_NAME =="
rm -f "$ROOT/$ZIP_NAME"
cd "$STAGE"
if command -v zip >/dev/null 2>&1; then
  zip -qr "$ROOT/$ZIP_NAME" .
elif PY="$(pick_python)"; then
  "$PY" - "$ROOT/$ZIP_NAME" <<'PYEOF'
import os, sys, zipfile
out = sys.argv[1]
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for base, _, files in os.walk('.'):
        for f in files:
            p = os.path.join(base, f)
            z.write(p, os.path.relpath(p, '.'))
PYEOF
elif tar --version 2>/dev/null | grep -qi bsdtar; then
  tar -a -cf "$ROOT/$ZIP_NAME" .
elif command -v powershell.exe >/dev/null 2>&1; then
  powershell.exe -NoProfile -Command "Compress-Archive -Path '$(cygpath -w "$STAGE")\\*' -DestinationPath '$(cygpath -w "$ROOT/$ZIP_NAME")' -Force"
else
  echo "No zip tool found (zip, python, bsdtar or PowerShell)." >&2
  exit 1
fi
cd "$ROOT"
rm -rf "$STAGE"

echo
echo "Done: $ROOT/$ZIP_NAME"
echo "Unzip it, run serve.ps1 (Windows) or serve.sh (Mac/Linux), open http://localhost:8080"
