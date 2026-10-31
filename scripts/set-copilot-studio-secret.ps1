param(
  [ValidateSet('development', 'production')]
  [string]$Environment = 'development'
)

# Bezpečné nastavenie tajného kódu webového kanála Copilot Studio ako Worker secret.
# Hodnota sa zadáva skryto, nevypisuje sa a neukladá sa do súborov ani histórie príkazov.
$ErrorActionPreference = 'Stop'
$secure = Read-Host -Prompt 'Vlož tajný kód z Copilot Studio (Nastavenia > Zabezpečenie > Webový kanál)' -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
  $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  if ([string]::IsNullOrWhiteSpace($plain)) { throw 'Prázdna hodnota.' }
  Push-Location (Join-Path $PSScriptRoot '..\Trinity')
  try {
    if ($Environment -eq 'production') {
      $plain | npx wrangler secret put COPILOT_STUDIO_SECRET
    } else {
      $plain | npx wrangler secret put COPILOT_STUDIO_SECRET --env development
    }
  } finally { Pop-Location }
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  Remove-Variable plain, secure -ErrorAction SilentlyContinue
}
Write-Host "Hotovo: COPILOT_STUDIO_SECRET nastavený pre $Environment."
