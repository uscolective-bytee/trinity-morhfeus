[CmdletBinding()]
param([string]$OutputPath)
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
if(-not $OutputPath){$OutputPath=Join-Path $root 'verification/agent-connections.json'}
$secure=ConvertTo-SecureString ((Get-Content -LiteralPath (Join-Path $root '.credentials/gemini-mcp.dpapi') -Raw).Trim())
$ptr=[IntPtr]::Zero
try {
  $ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  $token=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  $headers=@{Authorization="Bearer $token";Accept='application/json, text/event-stream'}
  $checks=@()
  foreach($origin in @('https://auru.space','https://auru.dev')){
    try {
      $results=@{}
      foreach($method in @('initialize','tools/list')){
        $params=@{}
        if($method -eq 'initialize'){$params=@{protocolVersion='2025-03-26';capabilities=@{};clientInfo=@{name='trinity-agent-connection-verifier';version='1'}}}
        $body=@{jsonrpc='2.0';id=$method;method=$method;params=$params}|ConvertTo-Json -Depth 8
        $response=Invoke-WebRequest -UseBasicParsing -Uri "$origin/mcp" -Method Post -Headers $headers -ContentType 'application/json' -Body $body -TimeoutSec 25
        $raw=[Text.Encoding]::UTF8.GetString($response.RawContentStream.ToArray())
        $events=@($raw -split '\r?\n' | Where-Object {$_ -match '^data:'} | ForEach-Object {($_ -replace '^data:\s*','')})
        if($events.Count){$raw=$events[-1]}
        $rpc=$raw|ConvertFrom-Json
        if($rpc.error -or $null -eq $rpc.result){throw 'Invalid MCP response'}
        $results[$method]=$rpc.result
      }
      $names=@($results['tools/list'].tools|ForEach-Object {$_.name})
      if(-not $results['initialize'].serverInfo -or -not $names.Count){throw 'Missing handshake/catalog'}
      $checks += [pscustomobject]@{origin=$origin;authenticated=$true;tool_count=$names.Count;memory_sync_available=($names -contains 'trinity_memory_sync');agent_router_available=($names -contains 'dispatch_to_agent');error=$null}
    } catch {
      $checks += [pscustomobject]@{origin=$origin;authenticated=$false;tool_count=0;memory_sync_available=$false;agent_router_available=$false;error='MCP check failed; authentication, transport or catalog requires review.'}
    }
  }
  $report=[ordered]@{checked_at_utc=[DateTime]::UtcNow.ToString('o');scope='existing-local-client-read-only';checks=$checks;host_connections=@{chatgpt='not-verified';antigravity='not-verified';gemini='not-verified';copilot_studio='not-verified'};provider_calls_executed=$false}
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $OutputPath)|Out-Null
  $report|ConvertTo-Json -Depth 8|Set-Content -LiteralPath $OutputPath -Encoding UTF8
  $report|ConvertTo-Json -Depth 8
} finally {
  if($ptr -ne [IntPtr]::Zero){[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)}
  $token=$null
  $headers=$null
}
