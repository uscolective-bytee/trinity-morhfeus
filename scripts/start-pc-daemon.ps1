[CmdletBinding()]
param(
  [string]$TrinityUrl = 'https://auru.dev',
  [int]$PollInterval = 4000
)

$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..')

function Read-ProtectedToken([string]$path) {
  if (-not (Test-Path -LiteralPath $path)) { return $null }
  $secure = ConvertTo-SecureString ((Get-Content -LiteralPath $path -Raw).Trim())
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
  finally { if ($ptr -and $ptr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) } }
}

$dpapiPath = Join-Path $root 'Local-Gateway\.credentials\gateway-key.dpapi'
if (Test-Path -LiteralPath $dpapiPath) {
  $env:TRINITY_GATEWAY_KEY = Read-ProtectedToken $dpapiPath
  Write-Host "[TRINITY PC DAEMON] Načítaný zabezpečený DPAPI kľúč." -ForegroundColor Green
}

$env:TRINITY_URL = $TrinityUrl
$env:POLL_INTERVAL = [string]$PollInterval

Write-Host "[TRINITY PC DAEMON] Spúšťam daemona pre $TrinityUrl..." -ForegroundColor Cyan
node (Join-Path $root 'scripts\trinity-pc-daemon.mjs')
