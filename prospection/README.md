# Prospection — Base de Prospection Quantitative

Outil de prospection bancaire **vivant** : la base de données est la source de vérité, le rapport en est une vue.

## Architecture

```
prospection/
├── schema/
│   └── bank_schema.json       JSON Schema (contrat de données)
├── data/
│   ├── banks.json             Source de vérité (édition manuelle)
│   └── banks.scored.json      Auto-généré par score.js
├── engine/
│   ├── score.js               Moteur de scoring 7 facteurs (0-55)
│   ├── report.js              Générateur de rapport Markdown
│   └── merge_scraper.js       Fusion des sorties scraper dans la DB
├── reports/
│   └── V4_<date>.md           Rapports auto-générés
└── Makefile                   Orchestration
```

## Usage

### Cycle complet
```bash
cd prospection
make all              # score + report
```

### Mise à jour avec scraper
```bash
make cycle-p1         # scrape P1 → merge → score → report
```

### Manuel
```bash
node engine/score.js
node engine/report.js
```

## Scoring (7 facteurs, 0-55)

| Facteur | Échelle | Logique |
|---|---|---|
| TF strength | 0-10 | Nombre + qualité des signaux TF |
| SCF gap | 0-10 | ABSENT=10, BASIQUE=7, INTERMÉDIAIRE=4, AVANCÉ=0 |
| Trigger freshness | 0-10 | Décroissance linéaire 18 mois |
| Country flow | 0-10 | log10(flux) × multiplicateur risque pays |
| Interlocutor access | 0-5 | Nom+rôle = 2pts, +1 par LinkedIn |
| Competitive vacuum | 0-5 | Pas de concurrent = 5 |
| Regulatory tailwind | 0-5 | Bâle III +1, EU Late Payments +3 |

**Seuils** : P1 ≥ 32 | P2 = 22-31 | P3 = 12-21 | P4 < 12 | EXCLU = SCF_AVANCÉ

## Ajouter une banque

Éditer `data/banks.json` (JSON Schema dans `schema/bank_schema.json`), puis :
```bash
make all
```

Le scoring et la priorité sont **calculés**, pas déclarés.

## Mise à jour récurrente recommandée

Hebdomadaire :
1. Lancer scraper sur 1 tier (P1, P2, P3) en rotation
2. Merger : `make cycle-p1` (ou P2/P3)
3. Reviewer le delta dans le rapport généré
4. Commit + push

Mensuelle :
- Audit manuel des 10 premières banques (LinkedIn search exec moves)
- Vérification des triggers > 12 mois (rafraîchissement ou démotion)
- Recalibrage des seuils si dérive de la distribution
