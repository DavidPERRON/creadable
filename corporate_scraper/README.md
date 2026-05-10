# Corporate Scraper v2 — Identifier les banques sweet-spot par angle CredAble

**Objectif** : Scraper les rapports annuels des grands corporates européens (>€5 Mds CA) pour identifier les **banques actives sur le working capital / trade / receivables / inventory mais non équipées d'une plateforme sophistiquée**, et déterminer **quel angle CredAble** (SaaS, Classic SCF, Receivables, Flash title) est le bon pour chacune.

## CredAble — pas un prêteur, un fournisseur d'infrastructure de flux

CredAble vend du white-label working-capital infrastructure aux banques selon **4 lignes de revenus distinctes** :

| Angle | Revenu type | Risque crédit | Profil banque cible |
|---|---|---|---|
| **SaaS / Licence** | Annual fee + platform + APIs + onboarding + maintenance | Aucun | Banque sans plateforme propre, ERP modernisé |
| **Classic SCF** | Programme fees + servicing + bps sur volumes flow | Reste à la banque/anchor | Banque active reverse factoring sans tech moderne |
| **Receivables Finance** | bps plus élevés (assume dilution + dispute risks) | Partagé / structuré | Banque active factoring / cession sans plateforme |
| **Flash Title / Inventory** | bps + marge commerciale + structuring fees | TradeCo s'insère légalement | Banque active LCs / inventory sans structuration |

**Pour chaque banque sweet-spot, on identifie l'angle de vente recommandé.**

## Le concept "sweet spot"

Une banque est en **sweet spot** quand :
1. **Elle est citée par des corporates** dans des contextes working capital / trade / receivables / inventory (signal de demande validé)
2. **Elle n'a pas déployé de plateforme propre** sophistiquée (`scf_level` ≠ `AVANCE`)
3. **Au moins un angle CredAble score ≥ 5/10**

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
1. Pré-filtre les chunks pertinents avec ~120 keywords multilingues couvrant **6 catégories** : payables / receivables / documentary / title-inventory / working-capital / tech-ERP
2. Envoie à DeepSeek-V3 via DeepInfra avec schema JSON strict
3. Parse + persiste à `extractions/<id>.json`

**Coût** : ~$0.005 par corporate × 159 corporates = ~$0.80 pour le full run.

**Schema d'extraction v2** couvre la **diversité complète CredAble** en 6 catégories :

| Catégorie | Champs extraits |
|---|---|
| **Payables programs** | reverse_factoring, confirming, dynamic_discounting, supplier_finance, early_payment, trade_payables_financing (avec volumes EUR) |
| **Receivables programs** | factoring with/without recourse, invoice_discounting, securitization, sale_of_receivables, vendor_finance |
| **Documentary trade** | LCs, bank_guarantees, SBLCs, forfaiting, structured_trade, pre_shipment, PO_finance, export_finance |
| **Title / Inventory** | inventory_finance, floor_planning, consignment_stock, title_transfer, raw_material_financing, distributor/channel_finance, TradeCo/SPV |
| **Working capital** | bank_facilities, revolving_credit, overdraft (génériques) |
| **Tech signals** | ERP systems (SAP/Oracle/Coupa), multi-bank, white-label, cross-border, ESG-linked, API/digital |

Plus : platform_provider mentionné, trade_credit_insurers (Coface/Allianz Trade/Atradius), banques nommées avec **product_category** (payables/receivables/documentary/inventory/wc) et rôle (lead/factor/issuing_bank/etc.), footprint géographique, volumes totaux par catégorie.

### Stage 4 — `make aggregate`
Pour toutes les extractions :
1. Aggrège les mentions de banques (verbatim + contexte + corporate citant)
2. Match contre `prospection/data/banks.scored.json` (V4 score + priorité)
3. **Calcule le 4-angle scoring CredAble** : pour chaque banque, score /10 sur SaaS/Licence, Classic SCF, Receivables Finance, Flash Title/Inventory
4. **Détermine l'angle de vente recommandé** (l'angle avec le score le plus haut)
5. Identifie les **sweet-spots** (au moins 1 angle ≥ 5/10 + pas de plateforme avancée)
6. Détecte les nouvelles banques à ajouter à la DB
7. Génère `reports/bank_evidence.md` avec pour chaque sweet-spot : breakdown 4 angles + insight commercial

## Le 4-angle scoring CredAble

Pour chaque banque mentionnée par des corporates, l'aggregator calcule un score sur chacun des 4 angles de vente :

```
SaaS / Licence (0-10)            ← cité + ERP/multibank/API + pas de concurrent
Classic SCF (0-10)               ← cité côté payables + cross-border / ESG
Receivables Finance (0-10)       ← cité côté receivables / rôle factor
Flash Title / Inventory (0-10)   ← cité côté documentary + inventory (combo fort)
```

Malus universel : **-3 à -5 points si plateforme concurrente majeure installée** (Demica, Orbian, Taulia, Kyriba, etc.).

L'angle recommandé = celui avec le score le plus haut. Le **fit total CredAble** (somme) sert au tri sweet-spot.

### Exemple de sortie (test 3 corporates)

Sur les 3 mocks (Stellantis, Shell, Siemens) :

```
Top sweet-spots par fit total :
  18  Komerční banka  (CZ) → SaaS/Licence (cited × Stellantis-receiv + Siemens-payables)
  17  BPER Banca      (IT) → SaaS/Licence (cited × Stellantis-payables + receivables)
  12  BayernLB        (DE) → SaaS/Licence (cited × Siemens-payables)
  12  Helaba          (DE) → SaaS/Licence (cited × Siemens-payables)
  12  Citi Handlowy   (PL) → SaaS/Licence (cited × Stellantis + Siemens)

Banques nouvelles (à évaluer pour DB) :
  BNP Paribas → Flash title 9/10 (cited Shell-LCs + Shell-inventory + Stellantis-payables)
  HSBC, Standard Chartered, Société Générale → Flash title contexts (Shell)
  Deutsche Bank, Commerzbank → SaaS/Licence (Siemens)
```

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
