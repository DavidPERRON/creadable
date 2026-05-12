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

echo "[git] Mise à jour..."
git pull origin claude/european-banks-business-case-ayKhq 2>/dev/null \
  && echo "[git] À jour." \
  || echo "[git] Pas de connexion — version locale."

echo ""

# ── Vérifier que model2/ existe ─────────────────────────────────
if [ ! -f "$SCRIPT_DIR/model2/server.js" ]; then
  echo "❌ model2/server.js introuvable."
  echo ""
  echo "Le Model 2 est intégré dans Model 1 depuis la v2."
  echo "Lancez plutôt : Start CredAble.command"
  echo "puis ouvrez   : http://localhost:3333/model2"
  echo ""
  echo "Appuyez sur Entrée pour ouvrir Model 2 via Model 1..."
  read -r
  # Démarrer Model 1 si pas actif
  pkill -f "node ui/server.js" 2>/dev/null
  sleep 1
  npm install --quiet 2>/dev/null
  (sleep 2 && open http://localhost:3333/model2) &
  echo "[start] Démarrage Model 1+2 sur http://localhost:3333"
  npm run ui
  exit 0
fi

# ── Tuer l'ancienne instance ─────────────────────────────────────
echo "[start] Arrêt de l'ancienne instance..."
pkill -f "node model2/server.js" 2>/dev/null
pkill -f "node ui/server.js" 2>/dev/null
sleep 1

# ── Dépendances ──────────────────────────────────────────────────
echo "[npm] Vérification des dépendances..."
npm install --quiet 2>/dev/null
cd "$SCRIPT_DIR/model2" && npm install --quiet 2>/dev/null && cd "$SCRIPT_DIR"
echo ""

# ── Démarrage ────────────────────────────────────────────────────
# Model 2 standalone sur 3334 + Model 1 sur 3333 (pour les logs SSE)
(sleep 2 && open http://localhost:3333/model2) &

echo "[start] Model 2 (MPS) → http://localhost:3333/model2"
echo "[start] Model 1 (BIS) → http://localhost:3333"
echo "[start] Fermez cette fenêtre pour arrêter."
echo ""

npm run ui
