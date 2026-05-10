# Prospection — Plateforme de Prospection Industrielle (Option C)

Outil de prospection bancaire **vivant** : la base de données est la source de vérité, les rapports et matrices sont des vues régénérables.

## Architecture

```
prospection/
├── schema/
│   └── bank_schema.json           JSON Schema (contrat de données)
├── data/
│   ├── banks.json                 Source de vérité éditable
│   └── banks.scored.json          Auto-généré par score.js
├── engine/
│   ├── score.js                   Moteur scoring 7 facteurs (0-55)
│   ├── report.js                  Générateur rapport Markdown
│   └── merge_scraper.js           Fusion sorties scraper → DB
├── trigger_engine/                ★ Option C
│   ├── sources.js                 Catalogue RSS + queries
│   ├── detector.js                Détection automatique triggers
│   └── feeds_cache/               Cache local des feeds
├── interview_kit/                 ★ Option C
│   ├── discovery_call.md          Trame entretien 6-stage
│   ├── poc_playbook.md            Pilote 30 jours / 5 fournisseurs
│   ├── objection_handling.md      11 objections type
│   └── reference_strategy.md      Stratégie 1ère référence
├── supply_chain/                  ★ Option C
│   ├── data/buyers_with_scf.json  12 grands donneurs d'ordre
│   ├── engine/network_targets.js  Cartographie buyer × bank
│   └── output/network_matrix.md   Matrice générée
├── reports/
│   ├── V4_<date>.md               Rapports priorités
│   └── digest_<date>.md           Digest hebdomadaire triggers
└── Makefile                       Orchestration complète
```

## Usage

### Cycle hebdomadaire recommandé (cron)
```bash
cd prospection
make weekly                      # triggers + score + report + network
# crontab: 0 6 * * MON  cd /path/to/prospection && make weekly
```

### Cycle complet immédiat
```bash
make full                        # tout le pipeline en une commande
```

### Mise à jour ciblée
```bash
make all                         # score + report + network (sans triggers)
make triggers                    # détection triggers seulement
make network                     # matrice supply chain seulement
```

### Cycle scraper bank-deep
```bash
make cycle-p1                    # scrape P1 → merge → re-score → re-report
```

### Manuel
```bash
node engine/score.js
node engine/report.js
node trigger_engine/detector.js
node supply_chain/engine/network_targets.js
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

### Hebdomadaire — automatisable en cron
```cron
0 6 * * MON  cd /path/to/prospection && make weekly >> /var/log/prospection.log 2>&1
```
1. `make triggers` pull RSS (GTR, TFG, TXF, FCI, EBRD, EIB, IFC, BAFT)
2. Match événements → banques de la DB
3. Append nouveaux triggers dans `data/banks.json`
4. Re-score, re-génère report et network matrix
5. Génère `reports/digest_<date>.md` à reviewer en 5 min lundi matin

### Bimensuelle — scraper deep
- Lancer scraper sur 1 tier (P1, P2, P3) en rotation
- `make cycle-p1` (ou P2/P3)
- Merger automatiquement dans la DB

### Mensuelle — manuelle
- Audit manuel des 10 premières banques (LinkedIn search exec moves)
- Vérification triggers > 12 mois (rafraîchissement ou démotion)
- Recalibrage seuils si dérive distribution
- Mise à jour `interview_kit/*.md` avec leçons des derniers entretiens

## Modules Option C

### 1. Trigger Event Engine (`trigger_engine/`)
Cron-compatible. Détecte automatiquement :
- Recrutements (RSS + queries Google)
- M&A et fusions
- Acquisitions de fintech SCF
- Programmes EBRD / IFC / EIB
- RFPs publics
- Adhésions FCI
- Articles GTR/TXF/TFG citant nos cibles

### 2. Interview Kit (`interview_kit/`)
4 documents opérationnels :
- **Discovery Call** : trame 6-stage, 45-60 min, post-call template structuré
- **POC Playbook** : pilote 30 jours / 5 fournisseurs, KPIs validés en kickoff
- **Objection Handling** : 11 objections type avec sondes et réponses
- **Reference Strategy** : stratégie première référence + activation network effect

### 3. Supply Chain Cartography (`supply_chain/`)
Croise :
- 12 grands donneurs d'ordre avec programme SCF documenté (Schneider, L'Oréal, Stellantis, Inditex, Carrefour, Ahold, Siemens, VW, Danone, Nestlé, Michelin, IKEA)
- Banques prospects scorées V4
- Zones de concentration de fournisseurs

Sortie : matrice "leverage score" qui révèle les banques **double levier** (haut score V4 × multi-buyer reach). Top 5 actuel : **banques polonaises** (Citi Handlowy, Bank Millennium, Pekao) — fournisseurs de quasi tous les buyers.
