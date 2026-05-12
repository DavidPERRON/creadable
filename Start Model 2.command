#!/bin/bash
# Double-cliquez sur ce fichier dans le Finder pour lancer Model 2 (MPS).
# Fonctionne depuis n'importe quel dossier — trouve le repo creadable automatiquement.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Localiser le repo creadable ──────────────────────────────────
find_repo() {
  if [ -f "$SCRIPT_DIR/ui/server.js" ]; then
    echo "$SCRIPT_DIR"; return
  fi
  local sibling="$(dirname "$SCRIPT_DIR")/creadable"
  if [ -f "$sibling/ui/server.js" ]; then
    echo "$(cd "$sibling" && pwd)"; return
  fi
  if [ -f "$HOME/Desktop/creadable/ui/server.js" ]; then
    echo "$HOME/Desktop/creadable"; return
  fi
  echo ""
}

REPO="$(find_repo)"
if [ -z "$REPO" ]; then
  echo "❌ Dossier 'creadable' introuvable."
  echo "   Cherché dans : $SCRIPT_DIR, dossier voisin, ~/Desktop/creadable"
  echo ""
  read -rp "Appuyez sur Entrée pour quitter..."
  exit 1
fi
cd "$REPO"

echo "────────────────────────────────────────"
echo "  CredAble Intelligence — Model 2 (MPS)"
echo "────────────────────────────────────────"
echo "  Repo : $REPO"
echo ""

# ── Nettoyer état git bloquant ───────────────────────────────────
echo "[git] Nettoyage..."
if [ -d ".git/rebase-merge" ] || [ -d ".git/rebase-apply" ]; then
  git rebase --abort 2>/dev/null
fi
if ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
  git stash push -m "auto-stash $(date '+%Y-%m-%d %H:%M')" 2>/dev/null
fi
git config pull.rebase true 2>/dev/null
git pull origin main --quiet 2>/dev/null \
  && echo "[git] À jour." \
  || echo "[git] Pas de connexion — version locale."
echo ""

# ── Tuer l'ancienne instance ─────────────────────────────────────
echo "[start] Arrêt de l'ancienne instance..."
pkill -f "node ui/server.js" 2>/dev/null
sleep 1

# ── Dépendances ──────────────────────────────────────────────────
echo "[npm] Vérification des dépendances..."
npm install --quiet 2>/dev/null
echo ""

# ── Ouvrir dans le bon navigateur ────────────────────────────────
open_browser() {
  if [ -d "/Applications/Google Chrome.app" ]; then
    open -a "Google Chrome" "$1"
  elif [ -d "/Applications/Brave Browser.app" ]; then
    open -a "Brave Browser" "$1"
  elif [ -d "/Applications/Firefox.app" ]; then
    open -a "Firefox" "$1"
  elif [ -d "/Applications/Microsoft Edge.app" ]; then
    open -a "Microsoft Edge" "$1"
  else
    open "$1"
  fi
}
(sleep 2 && open_browser "http://localhost:3333/model2") &

echo "[start] Model 2 (MPS) → http://localhost:3333/model2"
echo "[start] Model 1 (BIS) → http://localhost:3333"
echo "[start] Fermez cette fenêtre pour arrêter."
echo ""

npm run ui
