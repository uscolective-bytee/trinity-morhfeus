<#
.SYNOPSIS
  Safe access to the shared local credentials file (default: $HOME\.env). Never prints values.
.EXAMPLE
  powershell -NoProfile -File scripts/shared-env.ps1 -Check      # NAME: set|EMPTY (values never shown)
  . scripts/shared-env.ps1 -Load                                  # loads variables into the current process only
#>
param(
  [switch]$Check,
  [switch]$Load,
  [string]$Path = (Join-Path $HOME '.env')
)

if (-not (Test-Path -LiteralPath $Path)) { Write-Output "MISSING: $Path"; if ($MyInvocation.InvocationName -ne '.') { exit 1 } else { return } }

$entries = [ordered]@{}
foreach ($line in Get-Content -LiteralPath $Path) {
  if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') { $entries[$Matches[1]] = $Matches[2].Trim() }
}

if ($Check -or -not $Load) {
  if ($entries.Count -eq 0) { Write-Output 'No active entries (all lines commented or file empty).' }
  foreach ($name in $entries.Keys) { Write-Output ('{0}: {1}' -f $name, $(if ($entries[$name].Length -gt 0) { 'set' } else { 'EMPTY' })) }
}

if ($Load) {
  foreach ($name in $entries.Keys) { if ($entries[$name].Length -gt 0) { Set-Item -Path "Env:$name" -Value $entries[$name] } }
}
