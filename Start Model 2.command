#!/bin/bash
# Double-cliquez sur ce fichier dans le Finder pour lancer le Model 2 (MPS).

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "────────────────────────────────────────"
echo "  CredAble Intelligence — Model 2 (MPS)"
echo "────────────────────────────────────────"
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
git pull origin claude/european-banks-business-case-ayKhq --quiet 2>/dev/null \
  && echo "[git] À jour." \
  || echo "[git] Pas de connexion — version locale."

echo ""

# ── Tuer l'ancienne instance Model 2 ────────────────────────────
echo "[start] Arrêt de l'ancienne instance..."
pkill -f "node model2/server.js" 2>/dev/null
sleep 1

# ── Dépendances npm model2 ───────────────────────────────────────
echo "[npm] Vérification des dépendances Model 2..."
cd "$SCRIPT_DIR/model2"
npm install --quiet 2>/dev/null
cd "$SCRIPT_DIR"
echo ""

# ── Démarrage ────────────────────────────────────────────────────
(sleep 2 && open http://localhost:3334) &

echo "[start] Model 2 (MPS) sur http://localhost:3334"
echo "[start] Model 1 (BIS) sur http://localhost:3333"
echo "[start] Fermez cette fenêtre pour arrêter."
echo ""

node model2/server.js
