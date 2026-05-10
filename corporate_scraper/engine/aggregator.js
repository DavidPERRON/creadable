#!/usr/bin/env node
/**
 * Corporate-Evidence Aggregator
 *
 * Reads extractions/*.json (corporate-side) and produces:
 *   1) bank_evidence.json — for each bank, list of corporates that mention it
 *      in SCF/TF context, with verbatim quotes
 *   2) Auto-detection of NEW banks not yet in prospection/data/banks.json
 *      (proposed additions to evaluate manually)
 *   3) Identification of banks that ARE active in SCF (corp evidence) but
 *      are NOT yet equipped with a sophisticated platform — these are the
 *      sweet-spot prospects for CredAble white-label
 *   4) Output report: corporate_scraper/reports/bank_evidence.md
 *
 * Run: node engine/aggregator.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const EXTRACTIONS_DIR = path.join(ROOT, 'extractions');
const PROSPECTION_DB_SCORED = path.join(ROOT, '..', 'prospection', 'data', 'banks.scored.json');
const PROSPECTION_DB_RAW = path.join(ROOT, '..', 'prospection', 'data', 'banks.json');
const OUT_JSON = path.join(ROOT, 'reports', 'bank_evidence.json');
const OUT_MD = path.join(ROOT, 'reports', 'bank_evidence.md');
const NEW_BANKS_PATH = path.join(ROOT, 'reports', 'new_banks_proposed.json');

const TODAY = new Date('2026-05-10').toISOString().slice(0,10);

// ─────────────────────────────────────────────────────────────────
// Bank name normalization
// ─────────────────────────────────────────────────────────────────
function normName(name) {
  return name.toLowerCase()
    .replace(/\b(s\.?a\.?|s\.?p\.?a\.?|n\.?v\.?|a\.?g\.?|gmbh|plc|ltd|inc|corp|group|bank|banca|banco|banque|holding)\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// ─────────────────────────────────────────────────────────────────
// Build bank → evidence map
// ─────────────────────────────────────────────────────────────────
function buildEvidence() {
  const files = fs.readdirSync(EXTRACTIONS_DIR).filter(f => f.endsWith('.json'));
  console.log(`[aggregator] Reading ${files.length} corporate extractions...`);

  const bankMap = {}; // normName -> { canonical, country, evidence: [] }

  for (const file of files) {
    const ext = JSON.parse(fs.readFileSync(path.join(EXTRACTIONS_DIR, file), 'utf8'));
    const banks = ext.banks_mentioned_in_scf_or_trade_finance_context || [];

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
        role: bm.role,
        context: bm.context,
        platform: ext.platform_provider_mentioned?.name || null,
        scf_program_indicators: collectScfFlags(ext),
      });
    }
  }
  return bankMap;
}

function collectScfFlags(ext) {
  const flags = [];
  for (const cat of ['scf_program_signals', 'receivables_program_signals',
                     'channel_program_signals', 'inventory_program_signals',
                     'special_signals']) {
    for (const [k, v] of Object.entries(ext[cat] || {})) {
      if (v?.mentioned) flags.push(k);
    }
  }
  return flags;
}

// ─────────────────────────────────────────────────────────────────
// Match against prospection DB
// ─────────────────────────────────────────────────────────────────
function matchProspectionDb(bankMap) {
  let prospectionBanks = [];
  // Prefer scored DB (has score + priority), fall back to raw
  const dbPath = fs.existsSync(PROSPECTION_DB_SCORED) ? PROSPECTION_DB_SCORED : PROSPECTION_DB_RAW;
  try {
    prospectionBanks = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch (e) {
    console.warn(`[aggregator] cannot read prospection DB: ${e.message}`);
  }

  const dbIndex = {};
  for (const b of prospectionBanks) {
    dbIndex[normName(b.name)] = b;
  }

  const matched = [];
  const unmatched = [];

  for (const [key, info] of Object.entries(bankMap)) {
    const dbBank = dbIndex[key];
    if (dbBank) {
      matched.push({ key, info, db: dbBank });
    } else {
      unmatched.push({ key, info });
    }
  }

  return { matched, unmatched, dbIndex };
}

// ─────────────────────────────────────────────────────────────────
// Identify "sweet spot" prospects
//
// Sweet spot = bank actively cited in corporate SCF programs but NOT yet
// equipped with sophisticated platform (SCF level ≠ AVANCE).
// These are the highest-value prospects: clear demand signal + no entrenched
// competitor.
// ─────────────────────────────────────────────────────────────────
function identifySweetSpots(matched) {
  return matched
    .map(m => ({
      bank: m.db,
      evidence_count: m.info.evidence.length,
      corporates: m.info.evidence.map(e => e.corporate),
      sectors_served: [...new Set(m.info.evidence.map(e => e.corporate_sector))],
    }))
    .filter(m =>
      m.bank.scf_level !== 'AVANCE' &&
      m.bank.priority !== 'EXCLU' &&
      m.evidence_count >= 1
    )
    .sort((a, b) => b.evidence_count - a.evidence_count);
}

// ─────────────────────────────────────────────────────────────────
// Markdown report
// ─────────────────────────────────────────────────────────────────
function generateReport(bankMap, matchResult, sweetSpots) {
  const { matched, unmatched } = matchResult;

  const totalEvidence = Object.values(bankMap).reduce((s, b) => s + b.evidence.length, 0);

  return `# Bank Evidence Report — Corporate Annual Report Analysis
## Généré le ${TODAY}

## Résumé exécutif

- **${Object.keys(bankMap).length}** banques distinctes mentionnées dans des contextes SCF / Trade Finance
- **${totalEvidence}** mentions verbatim au total
- **${matched.length}** banques matched avec la DB de prospection (${unmatched.length} nouvelles)
- **${sweetSpots.length}** banques en SWEET SPOT — actives sur SCF mais sans plateforme avancée → **prospects à fort potentiel CredAble**

---

## SECTION 1 — TOP 20 SWEET-SPOT PROSPECTS

> Banques que des corporates citent comme partenaires SCF/TF mais qui n'ont pas encore investi dans une plateforme sophistiquée. **Cible idéale CredAble white-label.**

| Rang | Banque | Pays | SCF actuel | V4 Score | V4 Pri | Mentions | Corporates citants |
|---|---|---|---|---:|---|---:|---|
${sweetSpots.slice(0, 20).map((s, i) =>
  `| ${i+1} | **${s.bank.name}** | ${s.bank.country} | ${s.bank.scf_level || '?'} | ${s.bank.score?.total || '?'} | ${s.bank.priority || '?'} | ${s.evidence_count} | ${s.corporates.slice(0, 4).join(', ')}${s.corporates.length > 4 ? '...' : ''} |`
).join('\n')}

---

## SECTION 2 — DÉTAIL PAR SWEET-SPOT

${sweetSpots.slice(0, 10).map(s => {
  const evidence = matched.find(m => normName(m.db.name) === normName(s.bank.name))?.info?.evidence || [];
  return `### ${s.bank.name} (${s.bank.country}, ${s.bank.priority || '?'}, score V4 ${s.bank.score?.total || '?'})

**SCF actuel** : ${s.bank.scf_level || '?'}
**Mentions corporate** : ${s.evidence_count} | **Secteurs** : ${s.sectors_served.join(', ')}

**Verbatim citations** :
${evidence.slice(0, 5).map(e =>
  `- **${e.corporate}** (${e.corporate_country}, ${e.corporate_sector}) — rôle: ${e.role}\n  > "${(e.context || '').slice(0, 250)}"\n  ${e.platform ? `*Plateforme citée: ${e.platform}*` : ''}`
).join('\n\n')}

**Insight commercial** : ${s.bank.name} est cité par ${s.evidence_count} grand(s) corporate(s) européen(s) comme partenaire actif sur des programmes SCF/TF. La banque n'a **pas** déployé de plateforme propre sophistiquée (niveau ${s.bank.scf_level}). Cette combinaison — demande corporate validée + absence d'infrastructure propriétaire — fait de cette banque une cible idéale pour un partenariat CredAble white-label.

---
`;
}).join('\n')}

## SECTION 3 — BANQUES NOUVELLES (NON ENCORE DANS DB PROSPECTION)

> Banques mentionnées par des corporates dans des contextes SCF/TF mais absentes de notre DB. À évaluer manuellement avant ajout.

| Banque (canonical) | Pays inféré | # mentions | Corporates citants |
|---|---|---:|---|
${unmatched.slice(0, 30).map(u =>
  `| **${u.info.canonical_name}** | ${u.info.inferred_country || '?'} | ${u.info.evidence.length} | ${u.info.evidence.slice(0,3).map(e => e.corporate).join(', ')}${u.info.evidence.length > 3 ? '...' : ''} |`
).join('\n')}

---

## SECTION 4 — STATISTIQUES PAR PRODUIT CREDABLE

${(() => {
  const allFlags = {};
  Object.values(bankMap).forEach(b => {
    b.evidence.forEach(e => {
      (e.scf_program_indicators || []).forEach(f => {
        allFlags[f] = (allFlags[f] || 0) + 1;
      });
    });
  });
  return Object.entries(allFlags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([f, n]) => `- **${f}** : ${n} mentions corporate`)
    .join('\n');
})()}

---

*Régénérer : \`cd corporate_scraper && node engine/aggregator.js\`*
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

  const bankMap = buildEvidence();
  const matchResult = matchProspectionDb(bankMap);
  const sweetSpots = identifySweetSpots(matchResult.matched);

  fs.writeFileSync(OUT_JSON, JSON.stringify({
    generated_at: TODAY,
    bank_evidence: bankMap,
    matched_count: matchResult.matched.length,
    unmatched_count: matchResult.unmatched.length,
    sweet_spots: sweetSpots,
  }, null, 2));

  fs.writeFileSync(NEW_BANKS_PATH, JSON.stringify(
    matchResult.unmatched.map(u => ({
      canonical_name: u.info.canonical_name,
      inferred_country: u.info.inferred_country,
      evidence_count: u.info.evidence.length,
      example_context: u.info.evidence[0]?.context,
    })),
    null, 2
  ));

  fs.writeFileSync(OUT_MD, generateReport(bankMap, matchResult, sweetSpots));

  console.log(`\n[aggregator] Banks identified: ${Object.keys(bankMap).length}`);
  console.log(`[aggregator] Matched DB: ${matchResult.matched.length}`);
  console.log(`[aggregator] New banks proposed: ${matchResult.unmatched.length}`);
  console.log(`[aggregator] Sweet-spot prospects: ${sweetSpots.length}`);
  console.log(`[aggregator] Report: ${OUT_MD}`);
}

if (require.main === module) main();
module.exports = { buildEvidence, matchProspectionDb, identifySweetSpots };
