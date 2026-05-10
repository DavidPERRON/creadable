#!/bin/bash
# Double-cliquez sur ce fichier dans le Finder pour lancer le Control Panel.
# Une fenêtre Terminal s'ouvre, le serveur démarre, et le navigateur s'ouvre automatiquement.

cd "$(dirname "$0")"

echo "────────────────────────────────────────"
echo "  CredAble Intelligence — Control Panel"
echo "────────────────────────────────────────"
echo ""

# Installer les dépendances si node_modules absent
if [ ! -d "node_modules" ]; then
  echo "[setup] Installation des dépendances npm..."
  npm install
  echo ""
fi

# Ouvrir le navigateur après 2 secondes (le temps que le serveur démarre)
(sleep 2 && open http://localhost:3333) &

echo "[start] Démarrage du serveur sur http://localhost:3333"
echo "[start] Fermez cette fenêtre pour arrêter le serveur."
echo ""

npm run ui
