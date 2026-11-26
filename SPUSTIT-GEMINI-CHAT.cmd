@echo off
chcp 65001 >nul
title TRINITY GEMINI DEVELOPER AGENT CHAT
cls
echo ====================================================================
echo   ✦ TRINITY GEMINI DEVELOPER AGENT & WORKSPACE CHAT
echo   Vyvoj, testovanie a sprava Trinity cez Google Gemini na Windows
echo ====================================================================
echo.
cd /d "%~dp0"
node scripts/gemini-dev-chat.mjs
pause
