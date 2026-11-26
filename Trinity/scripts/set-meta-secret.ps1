# Skript na bezpečné uloženie META_APP_SECRET do Cloudflare Worker secrets
# Hodnota sa zadáva výhradne cez maskovaný vstup (hviezdičky), nezapisuje sa do logov ani git repozitára.
[CmdletBinding()]
param()

Write-Host "=== TRinity Meta App Secret Setup ===" -ForegroundColor Cyan
Write-Host "Tento skript bezpečne uloží App Secret pre aplikáciu 1105151122389213." -ForegroundColor Gray
Write-Host "Cieľ: Cloudflare Worker 'trinity' (produkčné prostredie auru.space, env="")." -ForegroundColor Gray
Write-Host "Zadaj Meta App Secret z developers.facebook.com (App Settings > Basic):" -ForegroundColor Yellow

$SecureSecret = Read-Host -AsSecureString "Meta App Secret"
if (-not $SecureSecret) {
    Write-Host "Chyba: Nebola zadaná žiadna hodnota. Ukončujem bez zmeny." -ForegroundColor Red
    exit 1
}

$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureSecret)
$PlainSecret = $null

try {
    $PlainSecret = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    if ([string]::IsNullOrWhiteSpace($PlainSecret) -or $PlainSecret.Contains("`n") -or $PlainSecret.Contains("`r")) {
        Write-Host "Chyba: Zadaný secret je prázdny alebo obsahuje neplatné riadiace znaky." -ForegroundColor Red
        exit 1
    }

    $RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
    $TrinityDir = Join-Path $RepoRoot "Trinity"
    if (-not (Test-Path (Join-Path $TrinityDir "wrangler.jsonc"))) {
        Write-Host "Chyba: Konfiguračný súbor wrangler.jsonc nebol nájdený v $TrinityDir." -ForegroundColor Red
        exit 1
    }

    Push-Location $TrinityDir
    try {
        Write-Host "Odosielam tajomstvo do Cloudflare (worker: trinity, env='')..." -ForegroundColor Cyan
        $PlainSecret | npx wrangler secret put META_APP_SECRET --env=""
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Chyba: Cloudflare CLI vrátilo kód zlyhania $LASTEXITCODE. Secret nebol uložený." -ForegroundColor Red
            exit $LASTEXITCODE
        }
        Write-Host "Úspech: META_APP_SECRET bol potvrdený Cloudflare API a uložený pre workera trinity." -ForegroundColor Green
    } finally {
        Pop-Location
    }
} finally {
    if ($BSTR -ne [IntPtr]::Zero) {
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
    }
    $PlainSecret = $null
    [GC]::Collect()
}
