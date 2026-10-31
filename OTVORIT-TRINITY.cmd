@echo off
setlocal
cd /d "%~dp0Trinity"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Trinity\OTVORIT-TRINITY.ps1" %*
if errorlevel 1 pause
