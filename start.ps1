# SAMVAD V2.0 — Start both backend and frontend together
# Run this from F:\Projects\SAMVADv2 by right-clicking -> "Run with PowerShell"

$BackendDir = "$PSScriptRoot\backend"
$FrontendDir = "$PSScriptRoot\frontend"
$PythonExe  = "$BackendDir\venv\Scripts\python.exe"

Write-Host ""
Write-Host "  SAMVAD V2.0 - Launcher" -ForegroundColor Magenta
Write-Host ""

# Check Python venv
if (-not (Test-Path $PythonExe)) {
    Write-Host "[ERROR] Python venv not found at: $PythonExe" -ForegroundColor Red
    Write-Host "        Run: python -m venv venv  inside the backend folder first." -ForegroundColor Yellow
    pause; exit 1
}

# Check npm
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] npm not found. Install Node.js from https://nodejs.org" -ForegroundColor Red
    pause; exit 1
}

Write-Host "[1/2] Starting FastAPI backend on http://127.0.0.1:8000 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location '$BackendDir'; Write-Host '[ SAMVAD Backend ]' -ForegroundColor Magenta; & '$PythonExe' -m uvicorn src.app:app --host 127.0.0.1 --port 8000 --reload"
)

Write-Host "    Waiting 3s for backend to bind port..." -ForegroundColor DarkGray
Start-Sleep -Seconds 3

Write-Host "[2/2] Starting Vite frontend on http://localhost:5173 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location '$FrontendDir'; Write-Host '[ SAMVAD Frontend ]' -ForegroundColor Blue; npm run dev"
)

Write-Host ""
Write-Host "  Both servers starting in separate windows." -ForegroundColor Green
Write-Host "  Backend  -> http://127.0.0.1:8000" -ForegroundColor White
Write-Host "  Frontend -> http://localhost:5173" -ForegroundColor White
Write-Host ""
