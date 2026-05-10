#!/usr/bin/env node
/**
 * Corporate-Evidence Aggregator v2 — REFONTE TOTALE
 *
 * Agrège les extractions corporates et identifie pour chaque banque mentionnée :
 *   1) Le contexte produit (payables / receivables / documentary / inventory / WC)
 *   2) Le score d'adéquation à chacun des 4 angles de vente CredAble :
 *        - SaaS / licence
 *        - Classic SCF
 *        - Receivables finance
 *        - Flash title / inventory
 *   3) L'angle de vente recommandé (le plus haut score parmi les 4)
 *   4) Le statut "sweet spot" (bank actively cited + no major competitor platform)
 *
 * Run: node engine/aggregator.js
 */

const fs = require('fs');
const path = require('path');
const { MAJOR_COMPETITOR_PLATFORMS } = require('./extraction_schema');

const ROOT = path.join(__dirname, '..');
const EXTRACTIONS_DIR = path.join(ROOT, 'extractions');
const PROSPECTION_DB_SCORED = path.join(ROOT, '..', 'prospection', 'data', 'banks.scored.json');
const PROSPECTION_DB_RAW = path.join(ROOT, '..', 'prospection', 'data', 'banks.json');
const OUT_JSON = path.join(ROOT, 'reports', 'bank_evidence.json');
const OUT_MD = path.join(ROOT, 'reports', 'bank_evidence.md');
const NEW_BANKS_PATH = path.join(ROOT, 'reports', 'new_banks_proposed.json');

const TODAY = new Date('2026-05-10').toISOString().slice(0, 10);

// ─────────────────────────────────────────────────────────────────
// Bank name normalization
// ─────────────────────────────────────────────────────────────────
function normName(name) {
  return name.toLowerCase()
    .replace(/\b(s\.?a\.?|s\.?p\.?a\.?|n\.?v\.?|a\.?g\.?|gmbh|plc|ltd|inc|corp|group|bank|banca|banco|banque|holding)\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function isMajorCompetitor(platformName) {
  if (!platformName) return false;
  const n = platformName.toLowerCase();
  return MAJOR_COMPETITOR_PLATFORMS.some(p => n.includes(p));
}

// ─────────────────────────────────────────────────────────────────
// Build bank → evidence map (with product category per mention)
// ─────────────────────────────────────────────────────────────────
function buildEvidence() {
  const files = fs.readdirSync(EXTRACTIONS_DIR).filter(f => f.endsWith('.json'));
  console.log(`[aggregator] Reading ${files.length} corporate extractions...`);

  const bankMap = {}; // normName -> { canonical, country, evidence: [] }
  const programStats = { payables: 0, receivables: 0, documentary: 0, inventory: 0, working_capital: 0 };

  for (const file of files) {
    const ext = JSON.parse(fs.readFileSync(path.join(EXTRACTIONS_DIR, file), 'utf8'));

    // Tally program presence (corporate-side stats)
    if (hasAnyMention(ext.payables_programs))     programStats.payables++;
    if (hasAnyMention(ext.receivables_programs))  programStats.receivables++;
    if (hasAnyMention(ext.documentary_trade))     programStats.documentary++;
    if (hasAnyMention(ext.title_inventory_arrangements)) programStats.inventory++;
    if (hasAnyMention(ext.working_capital_facilities))   programStats.working_capital++;

    // Process bank mentions (now with product_category)
    const banks = ext.banks_in_working_capital_context || [];

    for (const bm of banks) {
      if (!bm.bank_name) continue;
      const key = normName(bm.bank_name);
      if (!key || key.length < 3) continue;

      if (!bankMap[key]) {
        bankMap[key] = {
          canonical_name: bm.bank_name,
          inferred_country: bm.country_if_specified || null,
          evidence: []
        };
      }

      bankMap[key].evidence.push({
        corporate: ext.corporate_name,
        corporate_country: ext.country,
        corporate_sector: ext.sector,
        role: bm.role || 'unknown',
        product_category: bm.product_category || 'unknown',
        context: bm.context,
        platform: ext.platform_provider_mentioned?.name || null,
        platform_is_major_competitor: isMajorCompetitor(ext.platform_provider_mentioned?.name),
        erp_systems: ext.tech_signals?.erp_systems_mentioned || [],
        flag_multibank: ext.tech_signals?.multi_bank_platform?.mentioned,
        flag_white_label: ext.tech_signals?.white_label_program?.mentioned,
        flag_cross_border: ext.tech_signals?.cross_border_program?.mentioned,
        flag_esg: ext.tech_signals?.esg_or_sustainability_linked?.mentioned,
        flag_api: ext.tech_signals?.api_or_digital_integration?.mentioned,
      });
    }
  }
  return { bankMap, programStats };
}

function hasAnyMention(programs) {
  if (!programs) return false;
  return Object.values(programs).some(p => p?.mentioned === true);
}

// ─────────────────────────────────────────────────────────────────
// 4-ANGLE SCORING — la pierre angulaire
//
// Pour chaque banque, on calcule un score /10 sur chacun des 4 angles
// CredAble. L'angle recommandé est celui avec le score le plus haut.
// ─────────────────────────────────────────────────────────────────
function computeCredableAngles(evidence) {
  // Aggregate signals across all evidence rows
  const cats = evidence.map(e => e.product_category);
  const hasMajorCompetitor = evidence.some(e => e.platform_is_major_competitor);
  const hasErp = evidence.some(e => e.erp_systems?.length > 0);
  const hasMultibank = evidence.some(e => e.flag_multibank);
  const hasWhiteLabel = evidence.some(e => e.flag_white_label);
  const hasCrossBorder = evidence.some(e => e.flag_cross_border);
  const hasEsg = evidence.some(e => e.flag_esg);
  const hasApi = evidence.some(e => e.flag_api);

  const inPayables    = cats.filter(c => c === 'payables').length;
  const inReceivables = cats.filter(c => c === 'receivables').length;
  const inDocumentary = cats.filter(c => c === 'documentary').length;
  const inInventory   = cats.filter(c => c === 'inventory').length;
  const inWc          = cats.filter(c => c === 'working_capital').length;

  const totalEvidence = evidence.length;

  // ──────────────────────────────────────────────────
  // ANGLE 1 — SaaS / licence
  // High when: cited + ERP/digital signals + no major competitor + multibank
  // ──────────────────────────────────────────────────
  let saas = 0;
  if (totalEvidence >= 1) saas += 2;
  if (totalEvidence >= 3) saas += 2;
  if (hasErp) saas += 2;
  if (hasMultibank || hasApi) saas += 2;
  if (hasMajorCompetitor) saas -= 4;
  saas = Math.max(0, Math.min(10, saas));
  const saasReason = `Banque citée ${totalEvidence}× ${hasErp ? '+ ERP signals ' : ''}${hasMultibank ? '+ multibank approach ' : ''}${hasApi ? '+ API/digital ' : ''}${hasMajorCompetitor ? '— concurrent installé (malus)' : '— pas de concurrent'}`;

  // ──────────────────────────────────────────────────
  // ANGLE 2 — Classic SCF (reverse factoring + dynamic discounting)
  // High when: cited as payables-side bank + no major competitor
  // ──────────────────────────────────────────────────
  let classicScf = 0;
  if (inPayables >= 1) classicScf += 4;
  if (inPayables >= 3) classicScf += 2;
  if (hasCrossBorder) classicScf += 1;
  if (hasEsg) classicScf += 1;
  if (hasMajorCompetitor) classicScf -= 5;
  classicScf = Math.max(0, Math.min(10, classicScf));
  const classicReason = `${inPayables} mention(s) côté payables ${hasCrossBorder ? '+ cross-border ' : ''}${hasEsg ? '+ ESG-linked ' : ''}${hasMajorCompetitor ? '— concurrent installé (malus)' : ''}`;

  // ──────────────────────────────────────────────────
  // ANGLE 3 — Receivables finance
  // High when: cited as factor / sale of receivables partner + no platform
  // ──────────────────────────────────────────────────
  let receivables = 0;
  if (inReceivables >= 1) receivables += 4;
  if (inReceivables >= 3) receivables += 2;
  // Boost if bank also acts as factor or in receivables securitization
  if (evidence.some(e => /factor|receivables/i.test(e.role))) receivables += 2;
  if (hasMajorCompetitor) receivables -= 4;
  receivables = Math.max(0, Math.min(10, receivables));
  const receivablesReason = `${inReceivables} mention(s) côté receivables ${evidence.some(e => /factor/i.test(e.role)) ? '+ rôle factor explicit ' : ''}${hasMajorCompetitor ? '— concurrent installé (malus)' : ''}`;

  // ──────────────────────────────────────────────────
  // ANGLE 4 — Flash title / inventory (TradeCo structures)
  // High when: cited in documentary + inventory + no SPV/TradeCo already in place
  // ──────────────────────────────────────────────────
  let flashTitle = 0;
  if (inDocumentary >= 1) flashTitle += 3;
  if (inInventory >= 1) flashTitle += 4;
  if (inDocumentary >= 1 && inInventory >= 1) flashTitle += 2; // strong combo
  if (hasMajorCompetitor) flashTitle -= 3;
  flashTitle = Math.max(0, Math.min(10, flashTitle));
  const flashReason = `${inDocumentary} mention(s) documentary + ${inInventory} mention(s) inventory ${(inDocumentary >= 1 && inInventory >= 1) ? '(combo fort)' : ''}${hasMajorCompetitor ? '— concurrent installé (malus)' : ''}`;

  const angles = {
    saas_licence:            { score: saas,        reasoning: saasReason },
    classic_scf:             { score: classicScf,  reasoning: classicReason },
    receivables_finance:     { score: receivables, reasoning: receivablesReason },
    flash_title_inventory:   { score: flashTitle,  reasoning: flashReason },
  };

  // Recommended angle = highest score
  const sorted = Object.entries(angles).sort((a, b) => b[1].score - a[1].score);
  const primary = sorted[0][0];

  return {
    angles,
    recommended_primary_angle: primary,
    recommended_primary_score: sorted[0][1].score,
    total_credable_fit: Object.values(angles).reduce((s, a) => s + a.score, 0),
  };
}

// ─────────────────────────────────────────────────────────────────
// Match against prospection DB
// ─────────────────────────────────────────────────────────────────
function matchProspectionDb(bankMap) {
  let prospectionBanks = [];
  const dbPath = fs.existsSync(PROSPECTION_DB_SCORED) ? PROSPECTION_DB_SCORED : PROSPECTION_DB_RAW;
  try {
    prospectionBanks = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch (e) {
    console.warn(`[aggregator] cannot read prospection DB: ${e.message}`);
  }

  const dbIndex = {};
  for (const b of prospectionBanks) dbIndex[normName(b.name)] = b;

  const matched = [];
  const unmatched = [];

  for (const [key, info] of Object.entries(bankMap)) {
    const dbBank = dbIndex[key];
    const credableAngles = computeCredableAngles(info.evidence);
    if (dbBank) matched.push({ key, info, db: dbBank, credable: credableAngles });
    else        unmatched.push({ key, info, credable: credableAngles });
  }

  return { matched, unmatched };
}

// ─────────────────────────────────────────────────────────────────
// Identify "sweet spot" prospects
//
// Sweet spot = banque active dans un contexte working capital + ne dispose
// PAS d'une plateforme avancée (SCF level ≠ AVANCE) + au moins 1 angle
// CredAble avec score >= 5.
// ─────────────────────────────────────────────────────────────────
function identifySweetSpots(matched) {
  return matched
    .map(m => ({
      bank: m.db,
      evidence_count: m.info.evidence.length,
      corporates: [...new Set(m.info.evidence.map(e => e.corporate))],
      sectors_served: [...new Set(m.info.evidence.map(e => e.corporate_sector))],
      product_categories: [...new Set(m.info.evidence.map(e => e.product_category))],
      credable: m.credable,
    }))
    .filter(m =>
      m.bank.scf_level !== 'AVANCE' &&
      m.bank.priority !== 'EXCLU' &&
      m.evidence_count >= 1 &&
      m.credable.recommended_primary_score >= 5
    )
    .sort((a, b) => b.credable.total_credable_fit - a.credable.total_credable_fit);
}

// ─────────────────────────────────────────────────────────────────
// Markdown report
// ─────────────────────────────────────────────────────────────────
function angleEmoji(angle) {
  return ({
    saas_licence:          'SaaS/Licence',
    classic_scf:           'Classic SCF',
    receivables_finance:   'Receivables',
    flash_title_inventory: 'Flash title',
  }[angle] || angle);
}

function generateReport(bankMap, matchResult, sweetSpots, programStats) {
  const { matched, unmatched } = matchResult;
  const totalEvidence = Object.values(bankMap).reduce((s, b) => s + b.evidence.length, 0);

  return `# Bank Evidence Report — Corporate Annual Report Analysis (V2 multi-angle)
## Généré le ${TODAY}

## Résumé exécutif

- **${Object.keys(bankMap).length}** banques distinctes mentionnées dans des contextes working-capital / trade / receivables / inventory
- **${totalEvidence}** mentions verbatim au total
- **${matched.length}** banques matched avec la DB de prospection (${unmatched.length} nouvelles)
- **${sweetSpots.length}** banques en SWEET SPOT (au moins 1 angle CredAble ≥ 5/10) → **prospects à fort potentiel**

### Programmes corporates détectés (univers analysé)

| Catégorie | # corporates | % |
|---|---:|---:|
| Payables (reverse factoring, confirming, dynamic discounting) | ${programStats.payables} | — |
| Receivables (factoring, sale of receivables, securitization) | ${programStats.receivables} | — |
| Documentary trade (LCs, guarantees, forfaiting) | ${programStats.documentary} | — |
| Title / inventory (consignment, TradeCo, raw material finance) | ${programStats.inventory} | — |
| Working capital generic (revolving, overdraft, syndicated) | ${programStats.working_capital} | — |

---

## SECTION 1 — TOP 25 SWEET-SPOT PROSPECTS (par fit total CredAble)

> Banques actives dans un contexte working capital + sans plateforme avancée + au moins 1 angle CredAble ≥ 5/10.

| Rang | Banque | Pays | V4 Pri | V4 Score | Mentions | **Angle reco** | SaaS | SCF | Receiv | Flash |
|---|---|---|---|---:|---:|---|---:|---:|---:|---:|
${sweetSpots.slice(0, 25).map((s, i) =>
  `| ${i+1} | **${s.bank.name}** | ${s.bank.country} | ${s.bank.priority || '?'} | ${s.bank.score?.total || '?'} | ${s.evidence_count} | **${angleEmoji(s.credable.recommended_primary_angle)}** | ${s.credable.angles.saas_licence.score} | ${s.credable.angles.classic_scf.score} | ${s.credable.angles.receivables_finance.score} | ${s.credable.angles.flash_title_inventory.score} |`
).join('\n')}

---

## SECTION 2 — DÉTAIL TOP 15 SWEET-SPOTS

${sweetSpots.slice(0, 15).map(s => {
  const evidence = matched.find(m => normName(m.db.name) === normName(s.bank.name))?.info?.evidence || [];
  const ang = s.credable.angles;
  return `### ${s.bank.name} (${s.bank.country}, ${s.bank.priority || '?'}, score V4 ${s.bank.score?.total || '?'})

**Angle de vente recommandé** : **${angleEmoji(s.credable.recommended_primary_angle)}** (score ${s.credable.recommended_primary_score}/10)

**4-angle scoring** :

| Angle | Score | Raisonnement |
|---|---:|---|
| SaaS / Licence | ${ang.saas_licence.score}/10 | ${ang.saas_licence.reasoning} |
| Classic SCF | ${ang.classic_scf.score}/10 | ${ang.classic_scf.reasoning} |
| Receivables Finance | ${ang.receivables_finance.score}/10 | ${ang.receivables_finance.reasoning} |
| Flash Title / Inventory | ${ang.flash_title_inventory.score}/10 | ${ang.flash_title_inventory.reasoning} |

**Catégories produits où la banque est citée** : ${s.product_categories.join(', ')}
**Secteurs corporates servis** : ${s.sectors_served.join(', ')}
**${s.evidence_count} mention(s) corporate** :
${evidence.slice(0, 5).map(e =>
  `- **${e.corporate}** (${e.corporate_country}, ${e.corporate_sector}) → cat: \`${e.product_category}\` / rôle: \`${e.role}\`\n  > "${(e.context || '').slice(0, 280)}"\n  ${e.platform ? `*Plateforme citée: ${e.platform}${e.platform_is_major_competitor ? ' ⚠️ concurrent majeur' : ''}*` : ''}`
).join('\n\n')}

**Insight commercial** : ${s.bank.name} est cité par ${s.evidence_count} corporate(s) dans ${s.product_categories.length} catégorie(s) produit (${s.product_categories.join(', ')}). Niveau plateforme actuel : ${s.bank.scf_level || '?'}. **Angle de vente CredAble recommandé : ${angleEmoji(s.credable.recommended_primary_angle)}** — ${ang[s.credable.recommended_primary_angle].reasoning}

---
`;
}).join('\n')}

## SECTION 3 — RÉPARTITION SWEET-SPOTS PAR ANGLE CREDABLE

${(() => {
  const byAngle = {};
  sweetSpots.forEach(s => {
    const a = s.credable.recommended_primary_angle;
    if (!byAngle[a]) byAngle[a] = [];
    byAngle[a].push(s);
  });
  return Object.entries(byAngle).map(([angle, banks]) => `### Angle : ${angleEmoji(angle)} (${banks.length} banques)

${banks.map(b => `- **${b.bank.name}** (${b.bank.country}, P${b.bank.priority?.replace('P','') || '?'}) — score angle ${b.credable.angles[angle].score}/10 — ${b.evidence_count} mention(s)`).join('\n')}
`).join('\n');
})()}

---

## SECTION 4 — BANQUES NOUVELLES (NON ENCORE DANS DB PROSPECTION)

> Banques mentionnées par des corporates dans des contextes working-capital mais absentes de notre DB. À évaluer manuellement avant ajout.

| Banque (canonical) | Pays | # mentions | Angle reco | Corporates citants |
|---|---|---:|---|---|
${unmatched.slice(0, 30).map(u =>
  `| **${u.info.canonical_name}** | ${u.info.inferred_country || '?'} | ${u.info.evidence.length} | ${angleEmoji(u.credable.recommended_primary_angle)} (${u.credable.recommended_primary_score}/10) | ${[...new Set(u.info.evidence.slice(0,3).map(e => e.corporate))].join(', ')}${u.info.evidence.length > 3 ? '...' : ''} |`
).join('\n')}

---

## SECTION 5 — STATISTIQUES PRODUITS CITÉS

${(() => {
  const allMentions = {};
  Object.values(bankMap).forEach(b => {
    b.evidence.forEach(e => {
      const k = e.product_category;
      allMentions[k] = (allMentions[k] || 0) + 1;
    });
  });
  return Object.entries(allMentions)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, n]) => `- **${cat}** : ${n} mentions banque-corporate`)
    .join('\n');
})()}

---

*Régénérer : \`cd corporate_scraper && node engine/aggregator.js\`*

*4-angle scoring : SaaS/Licence (récurrent), Classic SCF (bps flow), Receivables Finance (bps + risk), Flash Title/Inventory (TradeCo + marge structurante).*
`;
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────
function main() {
  if (!fs.existsSync(EXTRACTIONS_DIR)) {
    console.error(`[aggregator] No extractions/ dir found. Run extractor first.`);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });

  const { bankMap, programStats } = buildEvidence();
  const matchResult = matchProspectionDb(bankMap);
  const sweetSpots = identifySweetSpots(matchResult.matched);

  fs.writeFileSync(OUT_JSON, JSON.stringify({
    generated_at: TODAY,
    program_stats: programStats,
    matched_count: matchResult.matched.length,
    unmatched_count: matchResult.unmatched.length,
    sweet_spots: sweetSpots,
    full_bank_map: bankMap,
  }, null, 2));

  fs.writeFileSync(NEW_BANKS_PATH, JSON.stringify(
    matchResult.unmatched.map(u => ({
      canonical_name: u.info.canonical_name,
      inferred_country: u.info.inferred_country,
      evidence_count: u.info.evidence.length,
      recommended_angle: u.credable.recommended_primary_angle,
      angle_score: u.credable.recommended_primary_score,
      example_context: u.info.evidence[0]?.context,
    })),
    null, 2
  ));

  fs.writeFileSync(OUT_MD, generateReport(bankMap, matchResult, sweetSpots, programStats));

  console.log(`\n[aggregator] Banks identified:        ${Object.keys(bankMap).length}`);
  console.log(`[aggregator] Matched DB:              ${matchResult.matched.length}`);
  console.log(`[aggregator] New banks proposed:      ${matchResult.unmatched.length}`);
  console.log(`[aggregator] Sweet-spot prospects:    ${sweetSpots.length}`);
  console.log(`[aggregator] Programs detected:       payables=${programStats.payables} receivables=${programStats.receivables} documentary=${programStats.documentary} inventory=${programStats.inventory} wc=${programStats.working_capital}`);

  if (sweetSpots.length > 0) {
    console.log(`\n[aggregator] Top 5 sweet-spots by total fit:`);
    sweetSpots.slice(0, 5).forEach(s => {
      console.log(`  ${String(s.credable.total_credable_fit).padStart(2)} ${s.bank.name.padEnd(28)} (${s.bank.country}) — angle: ${s.credable.recommended_primary_angle} (${s.credable.recommended_primary_score}/10)`);
    });
  }
  console.log(`\n[aggregator] Report: ${OUT_MD}`);
}

if (require.main === module) main();
module.exports = { buildEvidence, matchProspectionDb, identifySweetSpots, computeCredableAngles };
