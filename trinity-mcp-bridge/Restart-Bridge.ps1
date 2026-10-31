# Restart-Bridge.ps1 - Gracefully restart and verify Trinity MCP Bridge daemon
$ErrorActionPreference = 'Stop'

$BridgeDir = $PSScriptRoot
if (-not $BridgeDir) {
  $BridgeDir = "C:\Users\saboi\Trinity-antigravity\trinity-mcp-bridge"
}
$LogDir = Join-Path $BridgeDir "logs"
New-Item -ItemType Directory -Path $LogDir -Force | Out-Null

$OutLog = Join-Path $LogDir "bridge.out.log"
$ErrLog = Join-Path $LogDir "bridge.err.log"
$PidFile = Join-Path $LogDir "bridge.pid"

Write-Host "=== STEP 1: TERMINATING STALE DAEMON PROCESSES ==="
$targetPids = @()

if (Test-Path $PidFile) {
  $savedPid = Get-Content -LiteralPath $PidFile -ErrorAction SilentlyContinue
  if ($savedPid -match '^\d+$') {
    $targetPids += [int]$savedPid
  }
}

$portConnections = Get-NetTCPConnection -LocalPort 3333 -ErrorAction SilentlyContinue
if ($portConnections) {
  $targetPids += ($portConnections | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -gt 4 })
}

$nodeProcs = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -and $_.CommandLine -match 'server\.mjs' }
if ($nodeProcs) {
  $targetPids += ($nodeProcs | Select-Object -ExpandProperty ProcessId)
}

# Explicitly ensure known stale PIDs (13088 and parent 20144) are targeted if alive
$targetPids += @(13088, 20144)
$targetPids = $targetPids | Select-Object -Unique

foreach ($pidToKill in $targetPids) {
  $p = Get-Process -Id $pidToKill -ErrorAction SilentlyContinue
  if ($p) {
    Write-Host "Stopping Process ID $pidToKill ($($p.ProcessName))..."
    Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
  }
}

Write-Host "=== STEP 2: WAITING FOR PORT 3333 SOCKET RELEASE ==="
$deadline = [DateTime]::UtcNow.AddSeconds(10)
$freed = $false
while ([DateTime]::UtcNow -lt $deadline) {
  $conn = Get-NetTCPConnection -LocalPort 3333 -State Listen -ErrorAction SilentlyContinue
  if (-not $conn) {
    $freed = $true
    break
  }
  Start-Sleep -Milliseconds 250
}
if (-not $freed) {
  throw "ERROR: Port 3333 is still occupied after termination!"
}
Write-Host "Port 3333 successfully released."
Start-Sleep -Milliseconds 500  # Safety buffer for Windows socket stack

Write-Host "=== STEP 3: SPAWNING NEW DAEMON IN BACKGROUND (DETACHED WMI) ==="
Set-Content -LiteralPath $OutLog -Value '' -Encoding utf8
Set-Content -LiteralPath $ErrLog -Value '' -Encoding utf8

$env:TRINITY_WORKSPACE = "C:\Users\saboi\Trinity-antigravity"
$env:TRINITY_PORT = "3333"
$env:TRINITY_TOKEN = "trinity-local-secret"

# Spawn via WMI Win32_Process to fully detach from parent process/job object
$cmd = "cmd.exe /c `"cd /d `"$BridgeDir`" && node server.mjs 1>> `"$OutLog`" 2>> `"$ErrLog`"`""
$wmiClass = [wmiclass]'win32_process'
$wmiRes = $wmiClass.Create($cmd)
if ($wmiRes.ReturnValue -ne 0) {
  throw "Failed to spawn daemon via WMI, return value: $($wmiRes.ReturnValue)"
}
Write-Host "WMI process launcher created (PID: $($wmiRes.ProcessId))"

Write-Host "=== STEP 4: VERIFYING DAEMON HEALTH & PORT BINDING ==="
$started = $false
$deadline = [DateTime]::UtcNow.AddSeconds(12)
while ([DateTime]::UtcNow -lt $deadline) {
  Start-Sleep -Milliseconds 500
  try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:3333/health" -Method Get -TimeoutSec 2
    if ($health.status -eq "ok" -and $health.service -eq "trinity-mcp-bridge") {
      $started = $true
      break
    }
  } catch {
    # Port not ready yet, continue polling
  }
}

if (-not $started) {
  $err = Get-Content -LiteralPath $ErrLog -Tail 10 -ErrorAction SilentlyContinue
  throw "ERROR: Bridge daemon failed to respond with 200 OK on /health within timeout. Error log: $err"
}
Write-Host "Health check passed: HTTP 200 OK on http://127.0.0.1:3333/health"

$activeConn = Get-NetTCPConnection -LocalPort 3333 -State Listen -ErrorAction SilentlyContinue
$activePid = if ($activeConn) { $activeConn.OwningProcess } else { $wmiRes.ProcessId }
Set-Content -LiteralPath $PidFile -Value $activePid -Encoding ascii
Write-Host "Active daemon PID: $activePid"

Write-Host "=== STEP 5: VERIFYING REFRESHED SECURITY & CORS ENFORCEMENT ==="
# Test A: Malicious Origin -> MUST RETURN HTTP 403 Forbidden
try {
  $corsTest = Invoke-WebRequest -Uri "http://127.0.0.1:3333/exec" -Method Post `
    -Headers @{ "Origin" = "https://malicious-site.com"; "x-trinity-token" = "trinity-local-secret" } `
    -Body '{"command":"git status --short"}' -ContentType "application/json" -UseBasicParsing -TimeoutSec 3
  throw "SECURITY FLAW: Malicious origin was NOT rejected! Returned status $($corsTest.StatusCode)"
} catch {
  if ($_.Exception.Response.StatusCode.value__ -eq 403) {
    Write-Host "PASS: Malicious origin 'https://malicious-site.com' was properly rejected with HTTP 403 Forbidden."
  } else {
    throw "Unexpected response from CORS test: $_"
  }
}

# Test B: Whitelisted Origin (https://gemini.google.com) -> MUST RETURN HTTP 200 OK
$validTest = Invoke-RestMethod -Uri "http://127.0.0.1:3333/exec" -Method Post `
  -Headers @{ "Origin" = "https://gemini.google.com"; "x-trinity-token" = "trinity-local-secret" } `
  -Body '{"command":"git status --short"}' -ContentType "application/json" -TimeoutSec 5

if ($validTest.status -eq "ok" -and $validTest.result.exitCode -eq 0) {
  Write-Host "PASS: Authorized origin 'https://gemini.google.com' returned HTTP 200 with exitCode 0."
} else {
  throw "Authorized command execution failed: $($validTest | ConvertTo-Json)"
}

Write-Host "=== DAEMON RESTART & HARDENING COMPLETED SUCCESSFULLY ==="
Write-Host "Active PID: $activePid"
