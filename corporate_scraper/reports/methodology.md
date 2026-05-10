# Méthodologie & Sources — 2026-05-10

> Cette note explique exactement **ce que le modèle a vu et ce qu'il n'a PAS vu** pour produire le rapport `bank_evidence.md`. Transparence totale.

## TL;DR

- **Modèle** : DeepSeek-V3 via DeepInfra (open-source LLM, hébergement neutre)
- **Sources fournies au modèle** : **uniquement des extraits de rapports annuels** téléchargés depuis les sites Investor Relations des corporates européens listés
- **Sources NON fournies au modèle** : web, presse, training data — le prompt **interdit** au modèle d'utiliser sa connaissance générale
- **Garde-fou** : chaque "fait" extrait doit être accompagné d'un `verbatim` (citation exacte du PDF)
- **Risque résiduel** : si le modèle hallucine malgré la consigne — vérifiable en relisant le `verbatim` vs le `text/<corp>.txt` source

---

## 1. Sources fournies au modèle DeepInfra (étape `make extract`)

| Source | Format | Origine | Volume run actuel |
|---|---|---|---|
| Rapports annuels corporates | PDF → texte (pdftotext) | Sites Investor Relations | 5 fichiers (10.5 MB texte brut) |
| Pré-filtre par mots-clés | Liste de ~120 termes multilingues | Constitué manuellement (8 langues) | Réduction ~85% du texte avant LLM |
| Schema strict de sortie | JSON Schema (extraction_schema.js) | Code interne | 6 catégories produits, ~50 champs |

**En clair** : pour chaque corporate, le modèle reçoit uniquement les paragraphes du rapport annuel qui contiennent un mot-clé pertinent (working capital, factoring, supplier finance, letter of credit, inventory, etc.). Rien d'autre.

### Liste des corporates effectivement analysés ce run (5 sur 159)

- **BP p.l.c.** (UK, Energy, CA €195 Mds)
- **Shell plc** (UK, Energy, CA €280 Mds)
- **Siemens AG** (DE, Industrial, CA €75 Mds)
- **Stellantis** (NL, Automotive, CA €157 Mds)
- **Volkswagen Group** (DE, Automotive, CA €322 Mds)


### Corporates listés mais non analysés ce run (154)

Raisons possibles : URL non encore résolue (`make discover`), site IR bloqué (anti-bot), PDF inaccessible. Détails dans `reports/download_manifest.json`.

---

## 2. Sources EXPRESSÉMENT INTERDITES au modèle

Le prompt système contient cette règle :

> *"Only extract what is EXPLICITLY stated in the text. Never infer, assume, or hallucinate. If information is not found, use null / false / []."*

Et le prompt utilisateur exige systématiquement :

> *"Always provide the verbatim quote from the text for each finding."*

**Le modèle ne consulte donc PAS** :
- Le web (DeepInfra n'a pas d'accès web pour ce modèle)
- Sa propre training data (interdit par consigne)
- Les autres rapports corporates (chaque appel est isolé, pas de contexte cross-corporate)
- Aucun rapport sectoriel / press release / autre PDF

**Vérification** : si tu lis un `verbatim` dans `extractions/<corp>.json`, tu peux le retrouver mot-pour-mot avec `grep` dans le `text/<corp>.txt` correspondant.

---

## 3. Sources externes utilisées par d'AUTRES modules (pas par DeepInfra)

L'écosystème complet utilise plusieurs sources, mais **aucune** n'est fournie au modèle DeepInfra. Pour transparence :

### Module `prospection/` (V4 quantitative)
- **Aequitas Consultus** (3 docs propriétaires) — analyse manuelle
- **Allianz Trade Country Risk Atlas 2026** (PDF) — manuel
- **Marsh Political Risk Report 2026** (PDF) — manuel
- **UN Comtrade API** — flux commerciaux bilatéraux
- **FCI Global Factoring Statistics** — listes membres

### Module `prospection/trigger_engine/`
- **RSS feeds** : GTR, TFG, TXF, BAFT, FCI, EBRD, EIB, IFC
- Ces flux sont matchés contre les noms de banques de la DB pour détecter de nouveaux triggers

### Module `scraper/` (banques individuelles)
- Sites bancaires (pages produit, salles de presse)
- Recherches GTR/TFG/TXF
- Rapports annuels de banques (différent des corporates)

### Module `corporate_scraper/` (CE module)
- **Le seul** qui appelle DeepInfra
- **Seules** les chunks filtrées des rapports annuels corporates sont envoyées

---

## 4. Statistiques de ce run

| Métrique | Valeur |
|---|---:|
| Corporates dans le catalogue | 159 |
| Corporates avec URL résolue | 5 |
| PDFs téléchargés et cachés | 5 |
| Texts extraits | 5 |
| Extractions DeepInfra produites | 3 |
| Volume texte brut accessible au LLM (avant filtrage) | 10.5 MB |

### Coverage gap

- Corporates listés mais sans URL : **154** (action : `make discover`)
- URLs résolues mais PDFs non téléchargés : **0** (action : `make download`)
- PDFs téléchargés mais pas encore extraits par DeepInfra : **2** (action : `make extract`)

---

## 5. Limitations honnêtes du modèle

| Limitation | Impact | Mitigation actuelle |
|---|---|---|
| LLM peut hallucinator malgré la consigne | Citation `verbatim` fausse | Vérification possible : `grep "verbatim" text/<corp>.txt` |
| Pré-filtre keywords incomplet | Mention pertinente ratée | Liste de ~120 keywords en 8 langues, élargissable |
| PDFs scannés (images) | Texte non extractible | OCR Tesseract à ajouter (non implémenté) |
| Anti-bot sur certains IR sites | PDF non téléchargeable | Workflow manuel possible |
| Corporates privés (Bosch, Ferrero, Boehringer) | Comptes non publiés | Hors périmètre |
| Multi-langue partiel pour HU/RO/PL/CZ/SK | Mention en local non détectée | Élargir keyword list |

---

## 6. Reproductibilité

Tout est reproductible à 100% :
- Catalogue figé : `catalog.json` (commit Git)
- Prompt figé : `engine/extraction_schema.js` (commit Git)
- Modèle figé : version par défaut DeepSeek-V3 sur DeepInfra (peut être pinned via `DEEPINFRA_MODEL`)
- Température : 0.0 (déterministe)
- Sortie figée : `extractions/<corp>.json` (commit Git)

Si tu re-runs sur le même PDF, tu obtiens (à 99% près) le même JSON.

---

## 7. Aller plus loin — étendre les sources

Pour ce module spécifiquement, on peut ajouter :
- **Plus de corporates** : ajouter dans `catalog.json` (catalogue actuel : 159)
- **Rapports de filiales** : par exemple le rapport annuel de Stellantis Italie en plus de Stellantis groupe
- **10-K SEC** : pour corporates US-listed avec filiales européennes (Stellantis, Ferrari, etc.)
- **Communiqués pression** : signal complémentaire mais moins riche que rapports annuels

Pour l'écosystème complet, voir aussi `prospection/README.md` (sources V4) et `scraper/bank_scraper.js` (sources banques).

---

*Cette note est régénérée automatiquement à chaque `make aggregate`. Date du run : 2026-05-10.*
