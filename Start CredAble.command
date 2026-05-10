#!/bin/bash
# Double-cliquez sur ce fichier dans le Finder pour lancer le Control Panel.
# Met à jour le repo, installe les dépendances, ouvre le navigateur automatiquement.

cd "$(dirname "$0")"

echo "────────────────────────────────────────"
echo "  CredAble Intelligence — Control Panel"
echo "────────────────────────────────────────"
echo ""

# Mise à jour automatique depuis Git
echo "[git] Mise à jour du repo..."
git pull origin claude/european-banks-business-case-ayKhq --quiet 2>/dev/null \
  && echo "[git] À jour." \
  || echo "[git] Pas de connexion git — utilisation de la version locale."
echo ""

# Installer les dépendances si absent ou mis à jour
echo "[npm] Vérification des dépendances..."
npm install --quiet 2>/dev/null
echo ""

# Ouvrir le navigateur après 2 secondes
(sleep 2 && open http://localhost:3333) &

echo "[start] Démarrage sur http://localhost:3333"
echo "[start] Fermez cette fenêtre pour arrêter."
echo ""

npm run ui
