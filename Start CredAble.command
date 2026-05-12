#!/bin/bash
# Double-cliquez sur ce fichier dans le Finder pour lancer le Control Panel.
# Gère automatiquement les conflits git et les rebases en cours.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Localiser le repo creadable (fonctionne depuis n'importe quel dossier)
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
  echo "❌ Dossier 'creadable' introuvable. Cherché dans: $SCRIPT_DIR, voisin, ~/Desktop/creadable"
  read -rp "Appuyez sur Entrée pour quitter..."
  exit 1
fi
cd "$REPO"

echo "────────────────────────────────────────"
echo "  CredAble Intelligence — Control Panel"
echo "  Repo : $REPO"
echo "────────────────────────────────────────"
echo ""

# ── Nettoyer tout état git bloquant ─────────────────────────────
echo "[git] Nettoyage de l'état git..."

# Annuler un rebase en cours si présent
if [ -d ".git/rebase-merge" ] || [ -d ".git/rebase-apply" ]; then
  echo "[git] Rebase en cours détecté — annulation..."
  git rebase --abort 2>/dev/null
fi

# Mettre de côté les modifications locales
if ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
  echo "[git] Modifications locales détectées — sauvegarde automatique..."
  git stash push -m "auto-stash $(date '+%Y-%m-%d %H:%M')" 2>/dev/null
fi

# Configurer rebase par défaut
git config pull.rebase true 2>/dev/null

# Récupérer les dernières modifications
echo "[git] Mise à jour..."
git pull origin main --quiet 2>/dev/null \
  && echo "[git] À jour." \
  || echo "[git] Pas de connexion — utilisation de la version locale."

echo ""

# ── Tuer l'ancienne instance si elle tourne ─────────────────────
echo "[start] Arrêt de l'ancienne instance si présente..."
pkill -f "node ui/server.js" 2>/dev/null
sleep 1

# ── Dépendances npm ─────────────────────────────────────────────
echo "[npm] Vérification des dépendances..."
npm install --quiet 2>/dev/null
echo ""

# ── Démarrage ───────────────────────────────────────────────────
# Ouvre dans Chrome (évite le blocage HTTPS-only de Safari)
# Fallback Firefox, puis Safari en dernier recours
open_browser() {
  for loc in "/Applications" "$HOME/Applications"; do
    [ -d "$loc/Google Chrome.app" ] && { open -a "Google Chrome" "$1"; return; }
    [ -d "$loc/Brave Browser.app" ] && { open -a "Brave Browser" "$1"; return; }
    [ -d "$loc/Firefox.app" ]       && { open -a "Firefox" "$1"; return; }
    [ -d "$loc/Microsoft Edge.app" ]&& { open -a "Microsoft Edge" "$1"; return; }
  done
  open "$1"
}
(sleep 2 && open_browser "http://localhost:3333") &

echo "[start] Démarrage sur http://localhost:3333"
echo "[start] Fermez cette fenêtre pour arrêter."
echo ""

npm run ui
