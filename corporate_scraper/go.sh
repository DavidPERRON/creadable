#!/bin/bash
# ────────────────────────────────────────────────────────────────
# CredAble Corporate Scraper — script tout-en-un pour Mac
#
# Usage :
#   1. Ouvre Terminal (Cmd+Espace, "Terminal", Entrée)
#   2. cd vers le dossier creadable/corporate_scraper
#   3. ./go.sh
#
# Le script :
#   - Vérifie que tout est installé
#   - Te demande ta clé DeepInfra (si pas déjà en variable d'env)
#   - Lance le pipeline complet avec barres de progression
#   - Ouvre le dashboard automatiquement à la fin
# ────────────────────────────────────────────────────────────────

set -e

# Couleurs pour l'output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

echo ""
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${BLUE}║   CredAble Corporate Scraper — Pipeline tout-en-un        ║${NC}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ─── Step 0: pre-flight checks ───────────────────────────────────
echo -e "${BLUE}[1/6]${NC} Vérification des prérequis..."

if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Node.js n'est pas installé.${NC}"
  echo "   Installe via: ${BOLD}brew install node${NC}"
  exit 1
fi
echo -e "  ${GREEN}✓${NC} Node.js : $(node --version)"

if ! command -v pdftotext &> /dev/null; then
  echo -e "${RED}❌ pdftotext n'est pas installé.${NC}"
  echo "   Installe via: ${BOLD}brew install poppler${NC}"
  exit 1
fi
echo -e "  ${GREEN}✓${NC} pdftotext (poppler) installé"

if ! command -v curl &> /dev/null; then
  echo -e "${RED}❌ curl manquant${NC}"; exit 1
fi
echo -e "  ${GREEN}✓${NC} curl installé"

# Check that node_modules exists (puppeteer)
if [ ! -d "../node_modules/puppeteer" ]; then
  echo -e "${YELLOW}⚠${NC} Puppeteer pas encore installé. Installation..."
  cd .. && npm install && cd corporate_scraper
fi
echo -e "  ${GREEN}✓${NC} Puppeteer installé"
echo ""

# ─── Step 1: DeepInfra API key ──────────────────────────────────
if [ -z "$DEEPINFRA_API_KEY" ]; then
  echo -e "${BLUE}[2/6]${NC} Clé API DeepInfra"
  echo -e "  ${YELLOW}⚠${NC} Aucune clé en variable d'environnement détectée."
  echo "  Récupère ta clé sur : https://deepinfra.com/dash/api_keys"
  echo ""
  read -p "  Colle ta clé API DeepInfra ici (ou Entrée pour skip extraction): " API_KEY_INPUT
  if [ -n "$API_KEY_INPUT" ]; then
    export DEEPINFRA_API_KEY="$API_KEY_INPUT"
    echo -e "  ${GREEN}✓${NC} Clé enregistrée pour cette session"
  else
    echo -e "  ${YELLOW}⊘${NC} Skip de l'extraction LLM. Le pipeline tournera jusqu'à download seulement."
    SKIP_EXTRACT=1
  fi
else
  echo -e "${BLUE}[2/6]${NC} ${GREEN}✓${NC} Clé API DeepInfra détectée"
fi
echo ""

# ─── Step 2: Discover URLs ──────────────────────────────────────
echo -e "${BLUE}[3/6]${NC} Découverte des URLs de rapports annuels (annualreports.com + Bing)..."
echo "  Cette étape peut prendre 20-30 minutes pour 159 corporates."
echo "  Fonction idempotente : ne re-cherche pas les URLs déjà résolues."
echo ""
node engine/discover.js
echo -e "  ${GREEN}✓${NC} Discovery terminée"
echo ""

# ─── Step 3: Download PDFs + extract text ───────────────────────
echo -e "${BLUE}[4/6]${NC} Téléchargement des PDFs et extraction du texte..."
echo "  Volume estimé : ~5-10 GB sur ton disque (gitignored, pas dans Git)."
echo ""
node engine/downloader.js
echo -e "  ${GREEN}✓${NC} Download/extraction terminée"
echo ""

# ─── Step 4: DeepInfra extraction ───────────────────────────────
if [ -z "$SKIP_EXTRACT" ]; then
  echo -e "${BLUE}[5/6]${NC} Extraction structurée via DeepInfra (DeepSeek-V3)..."
  echo "  Coût estimé : ~\$0.005 par corporate (ex. \$0.80 pour 160 corps)"
  echo ""
  node engine/extractor.js
  echo -e "  ${GREEN}✓${NC} Extraction LLM terminée"
else
  echo -e "${BLUE}[5/6]${NC} ${YELLOW}⊘${NC} Skip extraction (pas de clé API)"
fi
echo ""

# ─── Step 5: Aggregate + reports + dashboard ────────────────────
echo -e "${BLUE}[6/6]${NC} Agrégation et génération des rapports..."
node engine/aggregator.js
node engine/summary.js
node engine/methodology.js
node engine/dashboard.js
echo ""

# ─── Done ───────────────────────────────────────────────────────
echo -e "${GREEN}${BOLD}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║   ✅ Pipeline terminé !                                     ║${NC}"
echo -e "${GREEN}${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "📄 ${BOLD}Rapports générés${NC} :"
echo -e "   • Résumé exécutif :       ${BLUE}reports/summary.md${NC}"
echo -e "   • Rapport détaillé :      ${BLUE}reports/bank_evidence.md${NC}"
echo -e "   • Note méthodologie :     ${BLUE}reports/methodology.md${NC}"
echo -e "   • Banques nouvelles :     ${BLUE}reports/new_banks_proposed.json${NC}"
echo ""
echo -e "🎨 ${BOLD}Dashboard interactif${NC} :"
echo -e "   ${BLUE}reports/dashboard.html${NC}"
echo ""

# Auto-open dashboard on Mac
if [[ "$OSTYPE" == "darwin"* ]]; then
  echo -e "  ${YELLOW}↗${NC} Ouverture du dashboard dans ton navigateur..."
  open reports/dashboard.html
fi

echo ""
echo -e "💡 ${BOLD}Prochains runs${NC} :"
echo -e "   ${BOLD}./go.sh${NC}                 → ré-exécute tout (idempotent)"
echo -e "   ${BOLD}make summary${NC}            → régénère le résumé seul"
echo -e "   ${BOLD}make dashboard${NC}          → régénère le dashboard seul"
echo ""
