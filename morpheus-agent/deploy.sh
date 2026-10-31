#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "   TRINITY AI - MORPHEUS SOCIAL AGENT DEPLOYMENT"
echo "=========================================================="

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

if [ ! -f ".env" ]; then
    echo "[!] .env súbor neexistuje. Kopírujem z .env.example..."
    cp .env.example .env
    echo "[+] Vytvorený .env súbor."
fi

if command -v docker >/dev/null 2>&1; then
    echo "[+] Docker detekovaný. Štartujem cez Docker Compose..."
    docker compose down
    docker compose build
    docker compose up -d
    echo "[✓] Morpheus beží v Docker kontajneri."
else
    echo "[!] Docker nenájdený. Spúšťam lokálne cez Python..."
    pip install -r requirements.txt
    python main.py
fi

echo "=========================================================="
echo "Morpheus Control Hub: https://auru.space/dashboard"
echo "Health Check:         http://localhost:8000/health"
echo "=========================================================="
