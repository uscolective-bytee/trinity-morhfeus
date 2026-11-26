[CmdletBinding()]
param(
  [string]$RepositoryPath = 'C:\Users\saboi\Trinity-antigravity',
  [string]$OutputPath = 'C:\Users\saboi\Documents\Codex\2026-10-23\tu-je-aktualizovan-a-doplnen-priamy\outputs\antigravity-collaboration-state.json'
)

$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path -LiteralPath $RepositoryPath).Path
$protocol = Join-Path $repo 'CODEX-ANTIGRAVITY-PROTOCOL.md'
$review = Join-Path $repo 'CODEX-ANTIGRAVITY-REVIEW-2026-10-24.md'
$headSha = (& git -C $repo rev-parse HEAD 2>$null | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or $headSha -notmatch '^[0-9a-f]{40}$') { throw 'Cannot verify the collaboration checkout.' }
$branchName = (& git -C $repo branch --show-current | Out-String).Trim()
$dirty = @(& git -C $repo status --porcelain)
$ackFound = (Test-Path -LiteralPath $review) -and [bool](Select-String -LiteralPath $review -SimpleMatch 'AG_ACK_20261025' -Quiet)
$checks = @()
foreach ($origin in @('https://auru.space', 'https://auru.dev')) {
  try {
    $health = Invoke-RestMethod -Uri ($origin + '/health') -TimeoutSec 15
    $ready = Invoke-RestMethod -Uri ($origin + '/ready') -TimeoutSec 15
    $checks += [pscustomobject]@{
      origin = $origin
      serving = ($health.status -eq 'serving')
      ready = ($ready.ready -eq $true)
      environment = $health.environment
      version = $health.version
      repository = $health.source.repository
      branch = $health.source.branch
      deployment_id = $health.deployment.id
      deployment_tag = $health.deployment.tag
      error = $null
    }
  } catch {
    # Do not serialize response bodies or request headers.
    $checks += [pscustomobject]@{ origin=$origin; serving=$false; ready=$false; environment=$null; version=$null; repository=$null; branch=$null; deployment_id=$null; deployment_tag=$null; error='Health/readiness request failed.' }
  }
}
$sameRelease = $checks[0].ready -and $checks[1].ready -and
  [bool]$checks[0].deployment_id -and
  $checks[0].deployment_id -eq $checks[1].deployment_id -and
  $checks[0].repository -eq $checks[1].repository -and
  $checks[0].branch -eq $checks[1].branch
$healthy = (Test-Path -LiteralPath $protocol) -and $ackFound -and
  (@($checks | Where-Object { -not $_.serving -or -not $_.ready }).Count -eq 0)
$snapshot = [ordered]@{
  status = $(if ($healthy) { 'ready-for-coordination' } else { 'attention-required' })
  checkout = $repo
  head = $headSha
  branch = $branchName
  dirty_files_count = $dirty.Count
  protocol_exists = (Test-Path -LiteralPath $protocol)
  antigravity_ack = $ackFound
  same_live_release = [bool]$sameRelease
  deployments = $checks
  mcp_host_connection = 'not-verified-by-this-check'
  peer_ack = 'AG_ACK_20261025; historical receipt, not a new heartbeat acknowledgement'
}
$signature = $snapshot | ConvertTo-Json -Depth 8 -Compress
$previousSignature = $null
if (Test-Path -LiteralPath $OutputPath) {
  try { $previousSignature = (Get-Content -LiteralPath $OutputPath -Raw | ConvertFrom-Json).signature } catch { }
}
$report = [ordered]@{
  checked_at_utc = (Get-Date).ToUniversalTime().ToString('o')
  changed = ($previousSignature -ne $signature)
  snapshot = $snapshot
  signature = $signature
}
$parent = Split-Path -Parent $OutputPath
if ($parent -and -not (Test-Path -LiteralPath $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
[System.IO.File]::WriteAllText([System.IO.Path]::GetFullPath($OutputPath), ($report | ConvertTo-Json -Depth 10), [System.Text.UTF8Encoding]::new($false))
[pscustomobject]@{ status=$snapshot.status; changed=$report.changed; antigravity_ack=$ackFound; same_live_release=[bool]$sameRelease; head=$headSha; report=$OutputPath } | ConvertTo-Json -Compress
if (-not $healthy) { exit 1 }
