#!/bin/bash
# Richtet eine Cloud-Sitzung so ein, dass Tests und Werkzeuge sofort laufen.
# Lokal tut der Hook nichts — dort sind node_modules laengst da.
#
# Anigosha schreibt hier zusaetzlich die .env aus einem Supabase-Token.
# FixTheMix braucht das noch nicht: bis Phase 4 gibt es keine Datenbank.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

if [ ! -d node_modules ]; then
  npm install --no-audit --no-fund --silent
  echo "Startup-Hook: Abhaengigkeiten installiert."
fi
