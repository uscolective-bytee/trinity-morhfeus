#!/usr/bin/env bash
# Trinity Google Developer & Cloud Platform Setup
# Projekt: trinity-sovereign-2026 | Správca: saboivan2008@gmail.com

set -euo pipefail

PROJECT_ID="tangential-osprey-dl7cp"
PROJECT_NAME="tangential-osprey-dl7cp (Trinity Sovereign Core)"
OWNER_EMAIL="saboivan2008@gmail.com"

echo "=== Trinity Google Developer & Pro Environment Setup ==="
echo "Správca: $OWNER_EMAIL"
echo "Projekt: $PROJECT_ID ($PROJECT_NAME)"

# 1. Overenie alebo vytvorenie projektu
echo "[1/3] Kontrola projektu $PROJECT_ID..."
if gcloud projects describe "$PROJECT_ID" >/dev/null 2>&1; then
    echo "Projekt $PROJECT_ID už existuje."
else
    echo "Vytváram projekt $PROJECT_ID..."
    gcloud projects create "$PROJECT_ID" --name="$PROJECT_NAME"
fi

gcloud config set project "$PROJECT_ID"

# 2. Povolenie všetkých kľúčových API
echo "[2/3] Povoľujem Google API služby pre Trinity..."
APIS=(
  "generativelanguage.googleapis.com"
  "aiplatform.googleapis.com"
  "cloudresourcemanager.googleapis.com"
  "storage.googleapis.com"
  "firestore.googleapis.com"
  "people.googleapis.com"
  "drive.googleapis.com"
  "docs.googleapis.com"
  "sheets.googleapis.com"
)

for api in "${APIS[@]}"; do
  echo "  -> Povoľujem $api..."
  gcloud services enable "$api" --project="$PROJECT_ID"
done

# 3. Vygenerovanie API kľúča
echo "[3/3] Nastavenie hotové."
echo "Projekt $PROJECT_ID je pripravený a prepojený so systémom Trinity."
echo "Redirect URL pre OAuth:"
echo "  - https://auru.space/auth/google/callback"
echo "  - https://auru.dev/auth/google/callback"
echo "Pre vygenerovanie Gemini Pro API kľúča:"
echo "  gcloud services api-keys create --display-name='Trinity Gemini Pro API Key' --project=$PROJECT_ID"
