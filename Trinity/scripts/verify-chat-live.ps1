param([string]$Origin = 'https://auru.space')
$ErrorActionPreference = 'Stop'
if ($Origin -notin @('https://auru.space','https://auru.dev')) { throw 'Only the two Trinity origins are allowed.' }
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$outputPath = Join-Path $root 'verification\chat-owner-live.json'
$secretPtr = [IntPtr]::Zero
$checks = @()
function Invoke-TrinityTool([string]$Name, [hashtable]$Arguments) {
  $payload = @{jsonrpc='2.0';id=[guid]::NewGuid().ToString();method='tools/call';params=@{name=$Name;arguments=$Arguments}} | ConvertTo-Json -Depth 10
  $response = Invoke-WebRequest -Uri ($Origin+'/mcp') -Method Post -Headers $script:authHeaders -ContentType 'application/json' -Body $payload -UseBasicParsing -TimeoutSec 20
  $raw = [Text.Encoding]::UTF8.GetString($response.RawContentStream.ToArray())
  if ($raw -match '(?m)^data:\s*(.+)$') { $raw = $Matches[1] }
  $rpc = $raw | ConvertFrom-Json
  if ($rpc.error) { throw ('MCP error: '+$rpc.error.code) }
  if ($rpc.result.isError) { throw ('Tool failed: '+$Name) }
  if ($rpc.result.structuredContent) { return $rpc.result.structuredContent }
  $text = ($rpc.result.content | Where-Object {$_.type -eq 'text'} | Select-Object -First 1).text
  if (-not $text) { throw ('Tool returned no JSON: '+$Name) }
  return $text | ConvertFrom-Json
}
try {
  $before = Invoke-RestMethod -Uri ($Origin+'/health') -TimeoutSec 15
  $secureValue = ConvertTo-SecureString ((Get-Content -LiteralPath (Join-Path $root '.credentials\gemini-mcp.dpapi') -Raw).Trim())
  $secretPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureValue)
  $script:authHeaders = @{Authorization='Bearer '+[Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPtr);Accept='application/json, text/event-stream'}
  # Only isolated non-mutating diagnostic prompts; dispatch creates their job records.
  # Each submission has its own idempotency key. Never retry a submitted action.
  foreach ($case in @(
    @{name='calculator';task='Použi nástroj calculate na súčet 17 a 25. Vráť jeho výsledok.';expected='42'},
    @{name='conversation';task='Ahoj. Odpovedz stručne po slovensky jednou vetou.';expected=$null}
  )) {
    $timer = [Diagnostics.Stopwatch]::StartNew()
    $queued = Invoke-TrinityTool 'dispatch_task' @{task=$case.task;agent='orchestrator';mode='single';provider='workers-ai';language='sk';idempotency_key=[guid]::NewGuid().ToString()}
    $job = $null
    while ($timer.Elapsed.TotalSeconds -lt 95) {
      $job = Invoke-TrinityTool 'get_task' @{id=$queued.id}
      if ($job.status -in @('completed','failed','cancelled')) { break }
      Start-Sleep -Seconds 2
    }
    $receipts = @($job.steps | ForEach-Object {$_.tool_log} | Where-Object {$_.status -eq 'completed' -and $_.receipt_id})
    $ok = $job.status -eq 'completed' -and -not [string]::IsNullOrWhiteSpace([string]$job.result) -and $timer.Elapsed.TotalSeconds -lt 120
    if ($case.name -eq 'calculator') { $ok = $ok -and ([string]$job.result).Contains('42') -and @($receipts | Where-Object {$_.tool -eq 'calculate'}).Count -gt 0 }
    $checks += @{name=$case.name;passed=[bool]$ok;job_id=$queued.id;status=$job.status;elapsed_ms=[int]$timer.Elapsed.TotalMilliseconds;reply=([string]$job.result).Substring(0,[Math]::Min(500,([string]$job.result).Length));receipts=@($receipts | Select-Object tool,status,receipt_id,verified_at);error=$job.error}
    Write-Host ($checks[-1] | ConvertTo-Json -Depth 6 -Compress)
    if ($job.status -notin @('completed','failed','cancelled')) { break }
  }
  $after = Invoke-RestMethod -Uri ($Origin+'/health') -TimeoutSec 15
  $report = @{checked_at=[DateTime]::UtcNow.ToString('o');scope='live-backend-via-authenticated-mcp';browser_verified=$false;origin=$Origin;health_before=$before;health_after=$after;checks=$checks}
  $report | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $outputPath -Encoding utf8
  if ($checks.Count -ne 2 -or @($checks | Where-Object {-not $_.passed}).Count) { exit 1 }
} finally {
  if ($secretPtr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPtr) }
  $script:authHeaders=$null
}
