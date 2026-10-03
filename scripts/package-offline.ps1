# Build the demo and pack it into brown-card-demo-offline-<yyyymmdd>.zip in the repo root.
# The zip holds dist/ plus START.txt and two tiny launchers (serve.ps1, serve.sh).
# Usage (Windows PowerShell 5.1 or later):  powershell -ExecutionPolicy Bypass -File scripts\package-offline.ps1
# Add -SkipBuild to pack the existing dist/ without rebuilding.
param([switch]$SkipBuild)
$ErrorActionPreference = 'Stop'

$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$Stamp = Get-Date -Format 'yyyyMMdd'
$ZipName = "brown-card-demo-offline-$Stamp.zip"
$ZipPath = Join-Path $Root $ZipName
$Stage = Join-Path $Root '.offline-stage'
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

Set-Location $Root
if ($SkipBuild) {
  if (-not (Test-Path (Join-Path $Root 'dist\index.html'))) { throw 'dist/index.html not found; run without -SkipBuild' }
  Write-Host '== Skipping build; packing existing dist/ =='
} else {
  Write-Host '== Building (npm run build) =='
  & npm run build
  if ($LASTEXITCODE -ne 0) { throw "npm run build failed with exit code $LASTEXITCODE" }
}

Write-Host '== Staging files =='
if (Test-Path $Stage) { Remove-Item -Recurse -Force $Stage }
New-Item -ItemType Directory -Path $Stage | Out-Null
Copy-Item -Recurse -Path (Join-Path $Root 'dist') -Destination (Join-Path $Stage 'dist')

$StartTxt = @'
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
'@

$ServeSh = @'
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
'@

$ServePs1 = @'
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
'@

# Unix line endings for the shell launcher; UTF-8 without BOM for all three.
[System.IO.File]::WriteAllText((Join-Path $Stage 'START.txt'), $StartTxt, $Utf8NoBom)
[System.IO.File]::WriteAllText((Join-Path $Stage 'serve.sh'), ($ServeSh -replace "`r`n", "`n"), $Utf8NoBom)
[System.IO.File]::WriteAllText((Join-Path $Stage 'serve.ps1'), $ServePs1, $Utf8NoBom)

Write-Host "== Zipping to $ZipName =="
if (Test-Path $ZipPath) { Remove-Item -Force $ZipPath }
# Entries are added one by one with forward-slash names: both ZipFile.CreateFromDirectory and
# Compress-Archive on Windows PowerShell 5.1 can write backslash separators, which unzip on Mac/Linux rejects.
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::Open($ZipPath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  $stagePrefix = (Resolve-Path $Stage).Path.TrimEnd('\') + '\'
  Get-ChildItem -Path $Stage -Recurse -File | ForEach-Object {
    $entryName = $_.FullName.Substring($stagePrefix.Length).Replace('\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $_.FullName, $entryName, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
  }
} finally {
  $archive.Dispose()
}
Remove-Item -Recurse -Force $Stage

Write-Host ''
Write-Host "Done: $ZipPath"
Write-Host 'Unzip it, run serve.ps1 (Windows) or serve.sh (Mac/Linux), open http://localhost:8080'
