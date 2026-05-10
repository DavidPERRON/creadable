# Corporate Scraper — Identifier les banques sweet-spot

**Objectif** : Scraper les rapports annuels des grands corporates européens (>€5 Mds CA) pour identifier les **banques actives sur le SCF mais non équipées d'une plateforme sophistiquée** — cibles idéales pour un partenariat CredAble white-label.

## Le concept "sweet spot"

Une banque est en **sweet spot** quand :
1. **Elle est citée par des corporates** dans leurs rapports annuels comme partenaire SCF/TF (signal de demande validé)
2. **Elle n'a pas déployé de plateforme propre** sophistiquée (`scf_level` ≠ `AVANCE`)

C'est la combinaison gagnante : **demande corporate prouvée + absence de concurrent installé**. Bien plus actionnable qu'une simple liste de banques scorées en aveugle.

---

## Architecture

```
corporate_scraper/
├── catalog.json                 ← 159 corporates EU avec IR URLs (croissable)
├── pdfs/                        ← gitignored — PDFs locaux ~10 GB
├── text/                        ← versionné — pdftotext output
├── extractions/                 ← versionné — DeepInfra JSON par corporate
├── engine/
│   ├── discover.js              ← URL discovery (annualreports.com + Bing)
│   ├── downloader.js            ← Puppeteer + curl + pdftotext
│   ├── extractor.js             ← DeepInfra (DeepSeek-V3) avec schema strict
│   ├── extraction_schema.js     ← Schema complet CredAble (4 catégories)
│   └── aggregator.js            ← evidence → sweet-spot prospects
├── reports/
│   ├── bank_evidence.md         ← Rapport humain
│   ├── bank_evidence.json       ← Données structurées
│   ├── new_banks_proposed.json  ← Banques à ajouter manuellement à la DB
│   └── download_manifest.json   ← Statut downloads
└── Makefile
```

---

## Pipeline en 4 étapes

### Stage 1 — `make discover`
Pour chaque corporate sans `direct_pdf_url` :
1. Cherche sur annualreports.com (aggregateur fiable, ~80% succès)
2. Fallback : Bing search avec `filetype:pdf`
3. Persiste `direct_pdf_url` dans `catalog.json`

Idempotent : ne ré-cherche pas les corporates déjà résolus.

### Stage 2 — `make download`
Pour chaque corporate avec `direct_pdf_url` :
1. Télécharge le PDF via curl (avec User-Agent réaliste)
2. Vérifie magic bytes `%PDF`
3. Extrait le texte via `pdftotext -layout`
4. Cache à `pdfs/<id>_<year>.pdf` et `text/<id>_<year>.txt`

Si pas de `direct_pdf_url` : tente l'URL IR + 3 tiers de fallback.

### Stage 3 — `make extract` (requires `DEEPINFRA_API_KEY`)
Pour chaque texte extrait :
1. Pré-filtre les chunks pertinents avec ~80 keywords SCF/TF/factoring multilingues
2. Envoie à DeepSeek-V3 via DeepInfra avec schema JSON strict
3. Parse + persiste à `extractions/<id>.json`

**Coût** : ~$0.005 par corporate × 159 corporates = ~$0.80 pour le full run.

Schema d'extraction couvre la **diversité complète CredAble** :
- Core SCF : reverse factoring, confirming, dynamic discounting, supplier finance
- Receivables : factoring with/without recourse, invoice discounting, securitization
- Channel : distributor finance, pre-shipment, PO finance
- Inventory : inventory finance, floor planning
- Special : ESG-linked, multi-bank, white-label, cross-border
- Volumes EUR + plateformes mentionnées + banques nommées + footprint géographique

### Stage 4 — `make aggregate`
Pour toutes les extractions :
1. Aggrège les mentions de banques (verbatim + contexte + corporate citant)
2. Match contre `prospection/data/banks.scored.json` (V4 score + priorité)
3. Identifie les **sweet-spots** (banques actives + pas de plateforme avancée)
4. Détecte les nouvelles banques à ajouter à la DB
5. Génère `reports/bank_evidence.md`

---

## Usage

### Premier run complet
```bash
cd corporate_scraper
export DEEPINFRA_API_KEY=...

make discover            # 30 min — résout ~80% des URLs
make download            # 30 min — télécharge les PDFs (~10 GB)
make extract             # 10 min + ~$0.80 — DeepInfra extraction
make aggregate           # < 1 min — génère le rapport final

cat reports/bank_evidence.md
```

### Run incrémental (mise à jour)
```bash
make full                # rejoue tout le pipeline (idempotent)
```

### Ajouter une banque candidate
Lire `reports/new_banks_proposed.json`, sélectionner les pertinentes, et les
ajouter manuellement à `../prospection/data/banks.json`. Puis relancer
`cd ../prospection && make all` pour les scorer.

---

## Sur ton Mac avec Git — comment ça marche

```bash
# Sur ton Mac (premier setup)
git clone <repo>
cd creadable
npm install                                       # installe puppeteer
brew install poppler                              # installe pdftotext
cd corporate_scraper
make full                                         # ~1 heure, ~$0.80 DeepInfra

# Tout est sur ton Mac (10 GB de PDFs) + sur Git (extractions JSON, rapports)
git push                                          # pousse les extractions JSON
```

Les PDFs sont **gitignored** (10 GB ne tient pas sur Git). Si tu changes de
machine ou Mac plante :

```bash
git clone <repo>                                  # récupère le code + extractions
cd corporate_scraper
make bootstrap                                    # re-télécharge les PDFs (~30 min)
                                                  # depuis catalog.json URLs
```

Tu n'es jamais bloqué : **l'intelligence (extractions JSON, rapports)** vit
dans Git ; les PDFs sont juste un cache local re-téléchargeable.

---

## Croître le catalogue

Le `catalog.json` actuel contient 159 corporates EU/UK/CH/NO/FI. Pour étendre :

1. Ajouter manuellement des entrées dans `catalog.json`
2. Run `make discover --limit N` pour récupérer leurs URLs
3. Run le pipeline complet

Sources externes pour étendre :
- STOXX 600 (toutes >€1 Md de market cap)
- EU Industrial R&D Investment Scoreboard (top 1000)
- Forbes Global 2000 filtré EU

---

## Coûts complets

| Étape | Volume | Coût |
|---|---|---|
| Discovery (annualreports.com / Bing) | 159 corps × ~30s | $0 (gratuit) |
| Download (Puppeteer + curl) | ~120 PDFs × ~5 MB | $0 (bande passante) |
| Text extraction (pdftotext) | 120 fichiers | $0 (CPU local) |
| **DeepInfra (DeepSeek-V3)** | ~120 × 25K tokens | **~$0.80** |
| Stockage Mac | ~10 GB pdf + 1 GB text | $0 |
| Stockage Git | ~50 MB JSON | $0 (GitHub gratuit) |

**Total** : moins de $1 pour scanner 159 corporates européens.

---

## Limitations connues

1. **Discovery pas universelle** : ~70-80% des URLs sont trouvées automatiquement, le reste nécessite une recherche manuelle (5 sec/corp)
2. **Anti-bot** : certains sites IR bloquent (Akamai, Cloudflare). Solutions : VPN résidentiel ou téléchargement manuel.
3. **PDFs scannés** : `pdftotext` échoue sur les PDFs images. Solution : Tesseract OCR (non implémenté V1).
4. **Multi-langue** : le pré-filtre couvre EN/FR/DE/IT/ES/NL — pour PL/CZ/HU/RO il faudrait étendre les keywords.
5. **Corporates privés** : Bosch, Boehringer, Ferrero publient peu/rien. Pas de moyen automatique de récupérer leurs comptes.
