# Trinity Morpheus Agent - Deployment Script (PowerShell)
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   TRINITY AI - MORPHEUS SOCIAL AGENT DEPLOYMENT" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$CurrentDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $CurrentDir

# Check .env file
if (-not (Test-Path ".env")) {
    Write-Host "[!] .env súbor neexistuje. Kopírujem z .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "[+] Vytvorený .env súbor. Nastavte svoje API kľúče." -ForegroundColor Green
}

# Check docker
$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if ($dockerCmd) {
    Write-Host "[+] Docker nájdený. Spúšťam kontajnery cez docker compose..." -ForegroundColor Green
    docker compose down
    docker compose build
    docker compose up -d
    Write-Host "[✓] Kontajnery sú spustené v pozadí." -ForegroundColor Green
} else {
    Write-Host "[i] Docker nie je spustený alebo nainštalovaný. Pripravujem lokálne prostredie Python..." -ForegroundColor Yellow
    python -m pip install -r requirements.txt
    Write-Host "[+] Spúšťam Morpheus lokálne cez Uvicorn..." -ForegroundColor Green
    python main.py
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Morpheus Control Hub: https://auru.space/dashboard" -ForegroundColor Green
Write-Host "Health check:         http://localhost:8000/health" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
