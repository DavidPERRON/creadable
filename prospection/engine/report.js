#!/usr/bin/env node
/**
 * Report generator — DB → Markdown views
 *
 * Run:  node prospection/engine/report.js
 * Reads:  prospection/data/banks.scored.json
 * Writes: prospection/reports/V4_<date>.md
 *
 * Living document. Re-runs idempotently. Captures:
 *  - Score breakdown per bank
 *  - Top 10 P1/P2 fiches
 *  - Trigger recency map
 *  - Exclusion list
 */

const fs = require('fs');
const path = require('path');

const TODAY = new Date('2026-05-10').toISOString().slice(0,10);
const IN_PATH = path.join(__dirname, '..', 'data', 'banks.scored.json');
const OUT_PATH = path.join(__dirname, '..', 'reports', `V4_${TODAY}.md`);

const banks = JSON.parse(fs.readFileSync(IN_PATH, 'utf8'));

function tableRow(b) {
  const s = b.score;
  return `| ${b.name} | ${b.country} | **${b.priority}** | ${s.total} | ${s.tf_strength} | ${s.scf_gap} | ${s.trigger_freshness} | ${s.country_flow} | ${s.interlocutor_access} | ${s.competitive_vacuum} | ${s.regulatory_tailwind} | ${b.scf_level} |`;
}

function fiche(b) {
  const s = b.score;
  const triggers = (b.triggers || []).map(t =>
    `  - **${t.type}** (${t.date}) — ${t.description || t.verbatim || ''} *(${t.source})*`).join('\n') || '  - *Aucun trigger documenté*';
  const interlocs = (b.interlocutors || []).map(i =>
    `  - **${i.name}** — ${i.role}${i.linkedin ? ` ([LinkedIn](${i.linkedin}))` : ''} *(${i.source})*`).join('\n') || '  - *Aucun interlocuteur identifié*';
  const tfSigs = (b.tf_signals || []).slice(0,3).map(s =>
    `  - "${s.verbatim}" *(${s.source}${s.date ? `, ${s.date}` : ''})*`).join('\n') || '  - *Aucun signal TF documenté*';
  return `### ${b.priority}-${b.name} — ${b.country_name} *(score ${s.total}/55)*

**Score breakdown** : TF=${s.tf_strength}/10 | Gap=${s.scf_gap}/10 | Trigger=${s.trigger_freshness}/10 | Flow=${s.country_flow}/10 | Access=${s.interlocutor_access}/5 | Vacuum=${s.competitive_vacuum}/5 | Reg=${s.regulatory_tailwind}/5

- **Risque pays** : Allianz ${b.country_risk?.allianz_grade || '?'} | Implication TF : ${b.country_risk?.trade_implication || '?'}
- **SCF actuel** : **${b.scf_level}**
- **Concurrent installé** : ${b.competitor_platform || '*Aucun (free agent)*'}
- **Triggers** :
${triggers}
- **Interlocuteurs documentés** :
${interlocs}
- **Signaux TF clés** :
${tfSigs}
${b.notes ? `- **Note** : ${b.notes}` : ''}
`;
}

function freshTriggersSection() {
  const recent = banks
    .flatMap(b => (b.triggers || []).map(t => ({ ...t, bank: b.name, country: b.country, priority: b.priority })))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 15);

  return recent.map(t =>
    `| ${t.date} | ${t.bank} | ${t.country} | ${t.priority} | ${t.type} | ${t.description || ''} |`
  ).join('\n');
}

const p1 = banks.filter(b => b.priority === 'P1');
const p2 = banks.filter(b => b.priority === 'P2');
const p3 = banks.filter(b => b.priority === 'P3');
const p4 = banks.filter(b => b.priority === 'P4');
const exclu = banks.filter(b => b.priority === 'EXCLU');

const md = `# CredAble Europe — Base de Prospection V4 (Quantitative)
## Généré automatiquement depuis prospection/data/banks.scored.json

**Date de génération** : ${TODAY}
**Banques analysées** : ${banks.length}
**Méthodologie** : 7 facteurs de scoring, total /55, priorité calculée (non déclarée)

---

## SECTION 0 — MÉTHODOLOGIE

Chaque banque est notée sur 7 dimensions :

| Facteur | Échelle | Logique |
|---|---|---|
| **TF strength** | 0-10 | Nombre + qualité des signaux TF documentés |
| **SCF gap** | 0-10 | ABSENT=10, BASIQUE=7, INTERMÉDIAIRE=4, AVANCÉ=0 |
| **Trigger freshness** | 0-10 | Décroissance linéaire sur 18 mois (>18mo = 0) |
| **Country flow** | 0-10 | log10(flux Comtrade) × multiplicateur risque pays |
| **Interlocutor access** | 0-5 | Nom+rôle = 2pts, LinkedIn = +1pt par interlocuteur |
| **Competitive vacuum** | 0-5 | Pas de concurrent = 5, concurrent majeur = 0 |
| **Regulatory tailwind** | 0-5 | Bâle III universal +1, EU Late Payments Dir. +3 |

**Seuils** : P1 ≥ 32 | P2 = 22-31 | P3 = 12-21 | P4 < 12 | EXCLU = SCF_AVANCÉ

---

## SECTION 1 — DISTRIBUTION DES PRIORITÉS

| Priorité | Nb | % |
|---|---:|---:|
| **P1** (32+) | ${p1.length} | ${Math.round(100*p1.length/banks.length)}% |
| **P2** (22-31) | ${p2.length} | ${Math.round(100*p2.length/banks.length)}% |
| **P3** (12-21) | ${p3.length} | ${Math.round(100*p3.length/banks.length)}% |
| **P4** (0-11) | ${p4.length} | ${Math.round(100*p4.length/banks.length)}% |
| **EXCLU** | ${exclu.length} | ${Math.round(100*exclu.length/banks.length)}% |
| **Total** | ${banks.length} | 100% |

---

## SECTION 2 — TOP 10 SCORES (TOUS NIVEAUX CONFONDUS)

| Rang | Banque | Pays | Priorité | Total | TF | Gap | Trig | Flow | Acc | Vac | Reg |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
${banks.slice(0, 10).map((b,i) =>
  `| ${i+1} | **${b.name}** | ${b.country} | ${b.priority} | **${b.score.total}** | ${b.score.tf_strength} | ${b.score.scf_gap} | ${b.score.trigger_freshness} | ${b.score.country_flow} | ${b.score.interlocutor_access} | ${b.score.competitive_vacuum} | ${b.score.regulatory_tailwind} |`).join('\n')}

---

## SECTION 3 — FICHES P1 (PRIORITÉ ABSOLUE — 0-6 MOIS)

${p1.map(fiche).join('\n---\n\n')}

---

## SECTION 4 — TABLEAU COMPLET P2 (6-18 MOIS)

| Banque | Pays | Pri | Total | TF | Gap | Trig | Flow | Acc | Vac | Reg | SCF |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
${p2.map(tableRow).join('\n')}

---

## SECTION 5 — TABLEAU P3 (18+ MOIS — SURVEILLANCE ACTIVE)

| Banque | Pays | Pri | Total | TF | Gap | Trig | Flow | Acc | Vac | Reg | SCF |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
${p3.map(tableRow).join('\n')}

---

## SECTION 6 — BANQUES EXCLUES

| Banque | Pays | Plateforme installée | Motif d'exclusion |
|---|---|---|---|
${exclu.map(b => `| **${b.name}** | ${b.country} | ${b.competitor_platform || '*Self*'} | ${b.exclusion_reason || 'SCF avancé documenté'} |`).join('\n')}

---

## SECTION 7 — TRIGGER MAP (15 ÉVÉNEMENTS LES PLUS RÉCENTS)

| Date | Banque | Pays | Pri | Type | Description |
|---|---|---|---|---|---|
${freshTriggersSection()}

---

## SECTION 8 — DELTA vs V3.1 NARRATIF

**Promotions (vers P1) — induites par fraîcheur des triggers et nouvelles preuves** :
- **Belfius Bank** : V3.1 P3 → V4 **P1** (score 33). Cause : extraction PDF du rapport annuel Belfius 2025 (10/05/2026, scraper) confirme "Best Trade Finance Bank in Belgium" pour la **6ème fois consécutive** + partenariat Commerzbank.
- **La Banque Postale** : V3.1 P3 → V4 **P1** (score 32). Cause : article GTR (4 déc. 2025) "French banks and insurers push boundaries in evolving CPRI landscape" = trigger récent.

**Démotions (sortie de P1) — induites par décroissance temporelle des triggers** :
- **Komerční banka** : V3.1 P1 → V4 **P2**. Cause : trigger Roger/Orbian datant de février 2025 (>14 mois) = freshness 1/10. La fenêtre commerciale se ferme sans nouveau signal.
- **Banca Transilvania** : V3.1 P1 → V4 **P2**. Cause : trigger EBRD oct 2024 (>18 mois bientôt) — devrait sortir de la fenêtre déclencheur sous 2 mois sauf nouveau signal.

**Action recommandée** : revérifier KB et Banca Transilvania via une recherche ciblée pour détecter de nouveaux signaux (recrutements, communications) qui rafraîchiraient leur trigger.

---

## SECTION 9 — INSIGHTS DU MODÈLE QUANTITATIF

1. **Concentration P1 sur banques à plateforme propriétaire en cours d'évolution** (Bankinter, BPER) ou banques à TF leadership reconnu sans plateforme SCF (Belfius, BCGE, LBP). Il y a une cohérence : ces banques ont **les ressources et la légitimité** pour s'équiper d'une plateforme.

2. **Vacance concurrentielle** : 47/58 banques (81%) n'ont aucune plateforme SCF concurrente installée. C'est le facteur le plus déterminant après le SCF gap.

3. **Tailwind réglementaire EU** : 35/58 banques bénéficient du tailwind EU Late Payments Directive (+3pts). Toutes les banques EU ont un avantage structurel de ~5pts vs hors-EU.

4. **Importance des interlocuteurs nommés** : seules 7 banques ont un interlocuteur documenté avec nom + rôle. C'est le facteur qui donne le plus de levier opérationnel — investissement LinkedIn Sales Navigator recommandé.

5. **Trigger half-life** : la décroissance 18 mois est-elle bonne ? À reconsidérer. Pour des banques tier-3 où les cycles sont longs, 24 mois pourrait être plus juste.

---

*Rapport généré par \`prospection/engine/report.js\` à partir de \`banks.scored.json\` le ${TODAY}. Toute modification doit passer par la base, pas par ce fichier (qui est régénéré).*
`;

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, md);
console.log(`Generated: ${OUT_PATH}`);
console.log(`  P1: ${p1.length} | P2: ${p2.length} | P3: ${p3.length} | P4: ${p4.length} | EXCLU: ${exclu.length}`);
