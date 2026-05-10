# Bank Intelligence — Buying Intent Score (BIS)

**Objectif** : Pour chaque banque candidate, calculer un score probabiliste 0-100 estimant la **probabilité qu'elle achète un produit white-label CredAble dans les 12 mois**, basé sur 8 signaux pondérés.

## Le Buying Intent Score — 8 signaux

| Signal | Poids | Source |
|---|---:|---|
| Capability gap révélé | 20% | bank_extractor (rapports annuels banques) |
| Strategic intent récent | 15% | bank_extractor + V4 triggers |
| Competitor failure / orphelinat | 20% | fintech_failures.json (curé) |
| Peer pressure | 10% | V4 DB peers |
| Corporate demand revealed | 10% | corporate_scraper |
| Pre-integration fit | 15% | bank_techstack (curé top 50) + auto-detect |
| TCI partnership existante | 5% | bank_techstack + extractor |
| Stress signals (NPL/RWA) | 5% | bank_extractor |

## Master Pitch — The Replacement Gap

**Argument central** : When a fintech partner fails, banks live with a 3-4 year gap before a successor enters.

- **Greensill** (mars 2021) → JPMorgan + Taulia (2024-2025) = **4 ans de gap**
- **Roger** (fév 2025) → ??? (Komerční banka actuellement orpheline)
- **we.trade** (juin 2022) → KBC, ČSOB, K&H toujours en transition

**Différentiel CredAble** : déploiement en 3-6 mois vs 3-4 ans de gap par défaut.

→ Argument à utiliser systématiquement face à toute banque ayant subi une faillite ou rachat de fintech partenaire.

## Architecture

```
bank_intelligence/
├── data/
│   ├── bank_techstack.json      ← curation manuelle 51 banques (top 50 + extras)
│   └── fintech_failures.json    ← liste curée orphans + replacement timeline
├── engine/
│   ├── bank_extractor.js        ← LLM analyse rapports annuels banques
│   ├── bis_calculator.js        ← 8-signal aggregator → score 0-100
│   └── bis_report.js            ← Markdown + HTML dashboard
├── extractions/                  ← LLM JSON par banque (généré)
├── reports/
│   ├── bis_scores.json          ← données structurées
│   ├── bis_report.md            ← rapport texte
│   └── bis_dashboard.html       ← dashboard interactif
└── Makefile
```

## Usage

### Premier run sans extractions LLM (utilise techstack curé + données existantes)
```bash
cd bank_intelligence
make all                          # bis + report + dashboard
open reports/bis_dashboard.html
```

### Avec extractions LLM (signal richer)
```bash
export DEEPINFRA_API_KEY=...
make full                         # extract → bis → report
```

### Extraction d'une banque spécifique
```bash
make extract-id ID=bcge-ch
```

## Output

3 livrables :
1. **`reports/bis_dashboard.html`** — dashboard interactif 5 onglets (résumé, ranking, par friction, pitch master, pondération)
2. **`reports/bis_report.md`** — rapport texte avec breakdown signal-par-signal
3. **`reports/bis_scores.json`** — données structurées exploitables

## Buckets BIS

| Bucket | Score | Action |
|---|---|---|
| **HIGH** | 70+ | Pursue NOW (window 6mo) |
| **MEDIUM-HIGH** | 50-69 | Active prospecting (window 6-12mo) |
| **MEDIUM** | 30-49 | Qualified pipeline (window 12-18mo) |
| **LOW** | 15-29 | Watchlist (review quarterly) |
| **VERY LOW** | <15 | Not currently addressable |

## Friction CredAble

Évaluation de la **difficulté de déploiement** par banque, basée sur core banking et tech stack :

- **★ LOW** : Finastra/Temenos pré-intégré → friction minimale, déploiement 2-3 mois (Banca Transilvania, MAIB, PASHA Bank, Ameriabank, Ardshinbank, Inecobank, BKT, LHV Pank, +autres)
- **MEDIUM** : Sopra/Asseco/FIS → custom integration feasible (27 banques)
- **HIGH** : G-SIB filiales (UC, ISP, KBC, ING, RBI, OTP filiales) + proprietary cores (Citi, Bankinter, SEB) — souvent EXCLU candidates

## Source de transparence

**Tech stack curé manuellement** (training data + public information) — à re-valider lors du discovery call avec chaque banque. Le module `bank_extractor.js` complète automatiquement par analyse des rapports annuels banques quand DeepInfra est disponible.

**Fintech failures curé manuellement** depuis presse pro (GTR, FT, Bloomberg) + observations.

## Régénération

```bash
make all          # recalcule BIS depuis dernières données
make clean        # supprime reports/
make stats        # statistiques
```
