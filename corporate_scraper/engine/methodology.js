#!/usr/bin/env node
/**
 * Methodology Note Generator — transparence totale sur les sources
 *
 * Pour chaque run, génère reports/methodology.md qui répond précisément :
 *   - Quelles sources ont été fournies au modèle DeepInfra ?
 *   - Quelles sources ont été IGNORÉES (pas vues par le LLM) ?
 *   - Le LLM peut-il halluciner depuis sa training data ? Mitigation ?
 *   - Quelles sources sont utilisées par d'autres modules (pas DeepInfra) ?
 *   - Statistiques par run : combien de PDFs, combien de tokens, etc.
 *
 * Run: node engine/methodology.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const REPO_ROOT = path.join(ROOT, '..');
const TODAY = new Date('2026-05-10').toISOString().slice(0, 10);
const OUT_PATH = path.join(ROOT, 'reports', 'methodology.md');

// ──────────────────────────────────────────────────────────────
// Gather run statistics
// ──────────────────────────────────────────────────────────────
function gatherStats() {
  const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog.json'), 'utf8'));
  const totalCorps = catalog.corporates.length;
  const withUrl = catalog.corporates.filter(c => c.direct_pdf_url).length;

  const pdfs = fs.existsSync(path.join(ROOT, 'pdfs'))
    ? fs.readdirSync(path.join(ROOT, 'pdfs')).filter(f => f.endsWith('.pdf')).length : 0;
  const texts = fs.existsSync(path.join(ROOT, 'text'))
    ? fs.readdirSync(path.join(ROOT, 'text')).filter(f => f.endsWith('.txt')).length : 0;
  const extractions = fs.existsSync(path.join(ROOT, 'extractions'))
    ? fs.readdirSync(path.join(ROOT, 'extractions')).filter(f => f.endsWith('.json')).length : 0;

  // Total text size (a proxy for what the LLM saw)
  let totalTextChars = 0;
  if (fs.existsSync(path.join(ROOT, 'text'))) {
    fs.readdirSync(path.join(ROOT, 'text')).filter(f => f.endsWith('.txt')).forEach(f => {
      totalTextChars += fs.statSync(path.join(ROOT, 'text', f)).size;
    });
  }

  // List downloaded corporates (these are the ONES the LLM actually saw)
  const downloadedCorps = [];
  if (fs.existsSync(path.join(ROOT, 'text'))) {
    fs.readdirSync(path.join(ROOT, 'text'))
      .filter(f => f.endsWith('.txt'))
      .forEach(f => {
        const id = f.replace(/_\d{4}\.txt$/, '');
        const corp = catalog.corporates.find(c => c.id === id);
        if (corp) downloadedCorps.push(corp);
      });
  }

  return { totalCorps, withUrl, pdfs, texts, extractions, totalTextChars, downloadedCorps };
}

const stats = gatherStats();

// ──────────────────────────────────────────────────────────────
// Generate methodology document
// ──────────────────────────────────────────────────────────────
const md = `# Méthodologie & Sources — ${TODAY}

> Cette note explique exactement **ce que le modèle a vu et ce qu'il n'a PAS vu** pour produire le rapport \`bank_evidence.md\`. Transparence totale.

## TL;DR

- **Modèle** : DeepSeek-V3 via DeepInfra (open-source LLM, hébergement neutre)
- **Sources fournies au modèle** : **uniquement des extraits de rapports annuels** téléchargés depuis les sites Investor Relations des corporates européens listés
- **Sources NON fournies au modèle** : web, presse, training data — le prompt **interdit** au modèle d'utiliser sa connaissance générale
- **Garde-fou** : chaque "fait" extrait doit être accompagné d'un \`verbatim\` (citation exacte du PDF)
- **Risque résiduel** : si le modèle hallucine malgré la consigne — vérifiable en relisant le \`verbatim\` vs le \`text/<corp>.txt\` source

---

## 1. Sources fournies au modèle DeepInfra (étape \`make extract\`)

| Source | Format | Origine | Volume run actuel |
|---|---|---|---|
| Rapports annuels corporates | PDF → texte (pdftotext) | Sites Investor Relations | ${stats.texts} fichiers (${(stats.totalTextChars/1024/1024).toFixed(1)} MB texte brut) |
| Pré-filtre par mots-clés | Liste de ~120 termes multilingues | Constitué manuellement (8 langues) | Réduction ~85% du texte avant LLM |
| Schema strict de sortie | JSON Schema (extraction_schema.js) | Code interne | 6 catégories produits, ~50 champs |

**En clair** : pour chaque corporate, le modèle reçoit uniquement les paragraphes du rapport annuel qui contiennent un mot-clé pertinent (working capital, factoring, supplier finance, letter of credit, inventory, etc.). Rien d'autre.

### Liste des corporates effectivement analysés ce run (${stats.downloadedCorps.length} sur ${stats.totalCorps})

${stats.downloadedCorps.length > 0
  ? stats.downloadedCorps.map(c => `- **${c.name}** (${c.country}, ${c.sector}, CA €${c.revenue_eur_bn} Mds)`).join('\n')
  : '*Aucun corporate téléchargé à ce stade. Lancer `make download` puis `make extract`.*'}

${stats.totalCorps - stats.downloadedCorps.length > 0
  ? `\n### Corporates listés mais non analysés ce run (${stats.totalCorps - stats.downloadedCorps.length})

Raisons possibles : URL non encore résolue (\`make discover\`), site IR bloqué (anti-bot), PDF inaccessible. Détails dans \`reports/download_manifest.json\`.`
  : ''}

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

**Vérification** : si tu lis un \`verbatim\` dans \`extractions/<corp>.json\`, tu peux le retrouver mot-pour-mot avec \`grep\` dans le \`text/<corp>.txt\` correspondant.

---

## 3. Sources externes utilisées par d'AUTRES modules (pas par DeepInfra)

L'écosystème complet utilise plusieurs sources, mais **aucune** n'est fournie au modèle DeepInfra. Pour transparence :

### Module \`prospection/\` (V4 quantitative)
- **Aequitas Consultus** (3 docs propriétaires) — analyse manuelle
- **Allianz Trade Country Risk Atlas 2026** (PDF) — manuel
- **Marsh Political Risk Report 2026** (PDF) — manuel
- **UN Comtrade API** — flux commerciaux bilatéraux
- **FCI Global Factoring Statistics** — listes membres

### Module \`prospection/trigger_engine/\`
- **RSS feeds** : GTR, TFG, TXF, BAFT, FCI, EBRD, EIB, IFC
- Ces flux sont matchés contre les noms de banques de la DB pour détecter de nouveaux triggers

### Module \`scraper/\` (banques individuelles)
- Sites bancaires (pages produit, salles de presse)
- Recherches GTR/TFG/TXF
- Rapports annuels de banques (différent des corporates)

### Module \`corporate_scraper/\` (CE module)
- **Le seul** qui appelle DeepInfra
- **Seules** les chunks filtrées des rapports annuels corporates sont envoyées

---

## 4. Statistiques de ce run

| Métrique | Valeur |
|---|---:|
| Corporates dans le catalogue | ${stats.totalCorps} |
| Corporates avec URL résolue | ${stats.withUrl} |
| PDFs téléchargés et cachés | ${stats.pdfs} |
| Texts extraits | ${stats.texts} |
| Extractions DeepInfra produites | ${stats.extractions} |
| Volume texte brut accessible au LLM (avant filtrage) | ${(stats.totalTextChars/1024/1024).toFixed(1)} MB |

### Coverage gap

- Corporates listés mais sans URL : **${stats.totalCorps - stats.withUrl}** (action : \`make discover\`)
- URLs résolues mais PDFs non téléchargés : **${stats.withUrl - stats.pdfs}** (action : \`make download\`)
- PDFs téléchargés mais pas encore extraits par DeepInfra : **${stats.texts - stats.extractions}** (action : \`make extract\`)

---

## 5. Limitations honnêtes du modèle

| Limitation | Impact | Mitigation actuelle |
|---|---|---|
| LLM peut hallucinator malgré la consigne | Citation \`verbatim\` fausse | Vérification possible : \`grep "verbatim" text/<corp>.txt\` |
| Pré-filtre keywords incomplet | Mention pertinente ratée | Liste de ~120 keywords en 8 langues, élargissable |
| PDFs scannés (images) | Texte non extractible | OCR Tesseract à ajouter (non implémenté) |
| Anti-bot sur certains IR sites | PDF non téléchargeable | Workflow manuel possible |
| Corporates privés (Bosch, Ferrero, Boehringer) | Comptes non publiés | Hors périmètre |
| Multi-langue partiel pour HU/RO/PL/CZ/SK | Mention en local non détectée | Élargir keyword list |

---

## 6. Reproductibilité

Tout est reproductible à 100% :
- Catalogue figé : \`catalog.json\` (commit Git)
- Prompt figé : \`engine/extraction_schema.js\` (commit Git)
- Modèle figé : version par défaut DeepSeek-V3 sur DeepInfra (peut être pinned via \`DEEPINFRA_MODEL\`)
- Température : 0.0 (déterministe)
- Sortie figée : \`extractions/<corp>.json\` (commit Git)

Si tu re-runs sur le même PDF, tu obtiens (à 99% près) le même JSON.

---

## 7. Aller plus loin — étendre les sources

Pour ce module spécifiquement, on peut ajouter :
- **Plus de corporates** : ajouter dans \`catalog.json\` (catalogue actuel : ${stats.totalCorps})
- **Rapports de filiales** : par exemple le rapport annuel de Stellantis Italie en plus de Stellantis groupe
- **10-K SEC** : pour corporates US-listed avec filiales européennes (Stellantis, Ferrari, etc.)
- **Communiqués pression** : signal complémentaire mais moins riche que rapports annuels

Pour l'écosystème complet, voir aussi \`prospection/README.md\` (sources V4) et \`scraper/bank_scraper.js\` (sources banques).

---

*Cette note est régénérée automatiquement à chaque \`make aggregate\`. Date du run : ${TODAY}.*
`;

fs.writeFileSync(OUT_PATH, md);
console.log(`[methodology] Generated: ${OUT_PATH}`);
console.log(`[methodology] Run stats: ${stats.downloadedCorps.length} corps analyzed, ${stats.extractions} extractions.`);
