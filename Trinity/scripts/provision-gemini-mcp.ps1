[CmdletBinding()]
param([switch]$Rotate)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$credentialDir = Join-Path $root '.credentials'
$credentialPath = Join-Path $credentialDir 'gemini-mcp.dpapi'

if ((Test-Path -LiteralPath $credentialPath) -and -not $Rotate) {
  throw 'Gemini MCP credential already exists. Use -Rotate only when you intentionally want a new key.'
}

$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
$material = [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
$secret = "trn_live_$material"
$sha = [System.Security.Cryptography.SHA256]::Create()
try { $digest = $sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($secret)) } finally { $sha.Dispose() }
$hash = -join ($digest | ForEach-Object { $_.ToString('x2') })
$id = [Guid]::NewGuid().ToString()
$prefix = $secret.Substring(0, 17)
$owner = 'saboivan2008@gmail.com'
$name = 'Gemini MCP Bridge'
$expires = [DateTimeOffset]::UtcNow.AddDays(90).ToString('yyyy-MM-dd HH:mm:ss')
$sql = "INSERT INTO ops_api_access_keys(id,owner_id,name,key_hash,key_prefix,scopes_json,rate_limit_per_minute,status,expires_at) VALUES('$id','$owner','$name','$hash','$prefix',json_array('mcp:read','mcp:write'),60,'active','$expires');"

Push-Location $root
try {
  $previousPreference = $ErrorActionPreference; $ErrorActionPreference = 'Continue'; $wranglerOutput = & npx.cmd wrangler d1 execute trinity-v03 --remote --env="" --command $sql 2>&1; $wranglerExitCode = $LASTEXITCODE; $ErrorActionPreference = $previousPreference; if ($wranglerExitCode -ne 0) { throw "Cloudflare D1 refused the credential (exit $wranglerExitCode): $wranglerOutput" }
  New-Item -ItemType Directory -Path $credentialDir -Force | Out-Null
  $protected = ConvertFrom-SecureString (ConvertTo-SecureString $secret -AsPlainText -Force)
  Set-Content -LiteralPath $credentialPath -Value $protected -NoNewline
  Write-Host 'Gemini MCP credential was created in D1 and encrypted locally with Windows DPAPI.'
  Write-Host 'Its value was not printed. Run scripts/copy-gemini-mcp-token.ps1 when Gemini asks for the bearer token.'
} finally {
  Pop-Location
  $secret = $null
  [Array]::Clear($bytes, 0, $bytes.Length)
}
