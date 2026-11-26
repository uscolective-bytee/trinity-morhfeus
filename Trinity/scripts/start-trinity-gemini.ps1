[CmdletBinding()]
param()
$ErrorActionPreference='Stop'
$root=Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location -LiteralPath $root
# Google moved personal AI Pro accounts from Gemini CLI to Antigravity CLI.
$agy=Get-Command agy -ErrorAction SilentlyContinue
$executable=if($agy){$agy.Source}else{Join-Path $env:LOCALAPPDATA 'agy\bin\agy.exe'}
if(-not (Test-Path -LiteralPath $executable)){throw 'Install the official Google Antigravity CLI to use the Google AI Pro subscription.'}
# Keep inherited API credentials out of the subscription-based client.
Remove-Item Env:\GEMINI_API_KEY -ErrorAction SilentlyContinue
Remove-Item Env:\GOOGLE_API_KEY -ErrorAction SilentlyContinue
& $executable --prompt-interactive 'Pracujeme na Trinity. Najprv precitaj GEMINI.md a zisti skutocny stav cez trinity_status. Rozlisuj vykonane akcie od navrhov a nevypisuj pristupove kluce.'
