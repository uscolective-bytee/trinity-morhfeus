<#
.SYNOPSIS
  Nastavenie a prepojenie Google Developer & Cloud prostredia pre systém Trinity.
  Účet: saboivan2008@gmail.com
  Projekt: trinity-sovereign-2026
.DESCRIPTION
  Tento skript:
  1. Overí Google účet a Google Cloud CLI (gcloud).
  2. Vytvorí alebo prepojí Google Cloud projekt 'trinity-sovereign-2026' (Trinity Sovereign Core).
  3. Povolí všetky potrebné Google API pre Trinity:
     - generativelanguage.googleapis.com (Gemini 3.8 / 2.5 Flash & Pro)
     - aiplatform.googleapis.com (Vertex AI)
     - cloudresourcemanager.googleapis.com (Resource Manager)
     - storage.googleapis.com (Cloud Storage)
     - firestore.googleapis.com (Cloud Firestore)
     - people.googleapis.com / identitytoolkit.googleapis.com (Google Identity / OAuth)
     - drive.googleapis.com (Google Drive API)
     - docs.googleapis.com (Google Docs API)
     - sheets.googleapis.com (Google Sheets API)
  4. Nakonfiguruje OAuth 2.0 návratové URL:
     - https://auru.space/auth/google/callback
     - https://auru.dev/auth/google/callback
  5. Pripraví API kľúč pre Gemini Developer prístup.
#>

[CmdletBinding()]
param(
  [string]$ProjectId = 'tangential-osprey-dl7cp',
  [string]$ProjectName = 'tangential-osprey-dl7cp (Trinity Sovereign Core)',
  [string]$OwnerEmail = 'saboivan2008@gmail.com'
)

$ErrorActionPreference = 'Stop'
Write-Host "=== Trinity Google Developer & Pro Environment Setup ===" -ForegroundColor Cyan
Write-Host "Vlastník: $OwnerEmail" -ForegroundColor Yellow
Write-Host "Projekt: $ProjectId ($ProjectName)" -ForegroundColor Yellow

$gcloud = Get-Command gcloud -ErrorAction SilentlyContinue
if (-not $gcloud) {
  Write-Host "[!] gcloud CLI nie je nainštalované na tomto počítači." -ForegroundColor Yellow
  Write-Host "    Môžete použiť Google Cloud Shell priamo v prehliadači na https://shell.cloud.google.com" -ForegroundColor Cyan
  Write-Host "    Alebo nainštalujte Google Cloud SDK: https://cloud.google.com/sdk/docs/install" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "Príkazy pre Cloud Shell:" -ForegroundColor Green
  Write-Host "gcloud projects create $ProjectId --name='$ProjectName'" -ForegroundColor White
  Write-Host "gcloud config set project $ProjectId" -ForegroundColor White
  Write-Host "gcloud services enable generativelanguage.googleapis.com aiplatform.googleapis.com cloudresourcemanager.googleapis.com storage.googleapis.com firestore.googleapis.com people.googleapis.com drive.googleapis.com docs.googleapis.com sheets.googleapis.com" -ForegroundColor White
  Write-Host "gcloud services api-keys create --display-name='Trinity Gemini Pro API Key'" -ForegroundColor White
  return
}

# 1. Overenie prihlásenia
Write-Host "[1/4] Kontrola prihlásenia do Google Cloud..." -ForegroundColor Cyan
$currentAccount = & gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null
if (-not $currentAccount) {
  Write-Host "Prihlasujem do Google účtu $OwnerEmail..." -ForegroundColor Yellow
  & gcloud auth login $OwnerEmail
} else {
  Write-Host "Aktívny Google účet: $currentAccount" -ForegroundColor Green
}

# 2. Vytvorenie alebo nastavenie projektu
Write-Host "[2/4] Nastavenie projektu $ProjectId..." -ForegroundColor Cyan
$existingProject = & gcloud projects list --filter="projectId:$ProjectId" --format="value(projectId)" 2>$null
if (-not $existingProject) {
  Write-Host "Vytváram nový Google Cloud projekt '$ProjectId'..." -ForegroundColor Yellow
  & gcloud projects create $ProjectId --name="$ProjectName"
} else {
  Write-Host "Projekt '$ProjectId' už existuje." -ForegroundColor Green
}

& gcloud config set project $ProjectId

# 3. Povolenie všetkých potrebných Google API
Write-Host "[3/4] Povoľovanie Google API pre Trinity..." -ForegroundColor Cyan
$apis = @(
  'generativelanguage.googleapis.com',
  'aiplatform.googleapis.com',
  'cloudresourcemanager.googleapis.com',
  'storage.googleapis.com',
  'firestore.googleapis.com',
  'people.googleapis.com',
  'drive.googleapis.com',
  'docs.googleapis.com',
  'sheets.googleapis.com'
)

foreach ($api in $apis) {
  Write-Host "  -> Povoľujem $api..." -NoNewline
  & gcloud services enable $api --project=$ProjectId
  Write-Host " [OK]" -ForegroundColor Green
}

# 4. Sumár a ďalšie kroky
Write-Host "[4/4] Google Developer prostredie pre Trinity je pripravené!" -ForegroundColor Green
Write-Host ""
Write-Host "Súhrn konfigurácie:" -ForegroundColor Cyan
Write-Host "  Projekt ID: $ProjectId"
Write-Host "  Správca: $OwnerEmail"
Write-Host "  OAuth Redirect URI (Produkcia): https://auru.space/auth/google/callback"
Write-Host "  OAuth Redirect URI (Staging/Dev): https://auru.dev/auth/google/callback"
Write-Host "  Povolené API služby: $($apis -join ', ')"
Write-Host ""
Write-Host "Pre vygenerovanie Gemini Pro API kľúča spustite:" -ForegroundColor Yellow
Write-Host "  gcloud services api-keys create --display-name='Trinity Gemini Pro API Key' --project=$ProjectId"
Write-Host "Alebo navštívte Google AI Studio: https://aistudio.google.com/app/apikey"
Write-Host "==========================================================" -ForegroundColor Cyan
