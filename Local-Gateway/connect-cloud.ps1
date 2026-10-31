[CmdletBinding()]
param([ValidateSet('production','development')][string]$Environment = 'production')
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$credentials = Join-Path $root '.credentials'
New-Item -ItemType Directory -Path $credentials -Force | Out-Null
$credentialFile = if ($Environment -eq 'development') { 'gateway-key-development.dpapi' } else { 'gateway-key.dpapi' }
$target = Join-Path $credentials $credentialFile
if (-not (Test-Path -LiteralPath $target)) {
  $bytes = New-Object byte[] 48
  $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $generator.GetBytes($bytes)
  }
  finally {
    $generator.Dispose()
  }
  $plain = [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+','-').Replace('/','_')
  (ConvertTo-SecureString $plain -AsPlainText -Force | ConvertFrom-SecureString) | Set-Content -LiteralPath $target -Encoding UTF8 -NoNewline
  $plain = $null
}
$protected = (Get-Content -LiteralPath $target -Raw).Trim()
$secure = ConvertTo-SecureString $protected
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
  $value = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  Set-Location (Join-Path $root '..\Trinity')
  $wranglerEnvironment = if ($Environment -eq 'development') { 'development' } else { '' }
  $value | node node_modules/wrangler/bin/wrangler.js secret put TRINITY_GATEWAY_KEY "--env=$wranglerEnvironment"
  if ($LASTEXITCODE -ne 0) { throw 'Cloudflare odmietol uloženie tajomstva.' }
} finally {
  $value = $null
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
}
Write-Host 'Privátny cloudový most je nastavený. Hodnota tajomstva nebola vypísaná.'
