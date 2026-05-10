#!/usr/bin/env node
/**
 * Bank prospection scoring engine — 7 factors, 0-55 total
 *
 * Run:  node prospection/engine/score.js
 * Reads:  prospection/data/banks.json
 * Writes: prospection/data/banks.scored.json (idempotent: same input → same output)
 *
 * Priorities are computed, not declared:
 *   P1 = score >= 35  (and not EXCLU)
 *   P2 = 20-34
 *   P3 = 10-19
 *   P4 = 0-9
 *   EXCLU = scf_level === 'AVANCE' OR exclusion_reason set
 */

const fs = require('fs');
const path = require('path');

const TODAY = new Date('2026-05-10');

const DB_PATH = path.join(__dirname, '..', 'data', 'banks.json');
const OUT_PATH = path.join(__dirname, '..', 'data', 'banks.scored.json');

// ─────────────────────────────────────────────────────────────────
// Factor 1 — TF strength (0-10)
// ─────────────────────────────────────────────────────────────────
function scoreTfStrength(b) {
  const sigs = b.tf_signals || [];
  if (sigs.length === 0) return 0;

  let score = Math.min(sigs.length * 2, 6);

  const sources = new Set(sigs.map(s => s.source.toLowerCase()));
  if ([...sources].some(s => s.includes('global finance') || s.includes('euromoney'))) score += 2;
  if ([...sources].some(s => s.includes('gtr') || s.includes('txf'))) score += 1;
  if ([...sources].some(s => s.includes('annual report'))) score += 1;

  return Math.min(score, 10);
}

// ─────────────────────────────────────────────────────────────────
// Factor 2 — SCF gap (0-10)
//   ABSENT = 10 (max gap = max opportunity)
//   AVANCE = 0  (no opportunity, will be excluded)
// ─────────────────────────────────────────────────────────────────
function scoreScfGap(b) {
  return { ABSENT: 10, BASIQUE: 7, INTERMEDIAIRE: 4, AVANCE: 0 }[b.scf_level] ?? 0;
}

// ─────────────────────────────────────────────────────────────────
// Factor 3 — Trigger freshness (0-10)
//   Linear decay over 18 months. >18mo = 0. Multiple triggers = max.
// ─────────────────────────────────────────────────────────────────
function scoreTriggerFreshness(b) {
  const triggers = b.triggers || [];
  if (triggers.length === 0) return 0;

  const scores = triggers.map(t => {
    const days = (TODAY - new Date(t.date)) / 86400000;
    if (days < 0 || days > 540) return 0;
    return Math.round(10 * (1 - days / 540));
  });
  return Math.max(...scores, 0);
}

// ─────────────────────────────────────────────────────────────────
// Factor 4 — Country flow magnitude (0-10)
//   Pondéré par risque pays : risque élevé → flow * 1.5 (besoin TF doc)
// ─────────────────────────────────────────────────────────────────
function scoreCountryFlow(b) {
  const flows = b.trade_flows_in || [];
  if (flows.length === 0) return 0;

  const totalUsd = flows.reduce((s, f) => s + (f.exports_usd || 0), 0);
  // Reference: Germany 2021 = $1.6T → 10. Linear log-ish.
  let raw = Math.min(Math.round(Math.log10(totalUsd / 1e9 + 1) * 2.5), 10);

  // Risk multiplier: documentary trade = bigger TF need per dollar
  const impl = b.country_risk?.trade_implication;
  if (impl === 'DOCUMENTARY_REQUIRED') raw = Math.min(Math.round(raw * 1.5), 10);
  else if (impl === 'MIXED') raw = Math.min(Math.round(raw * 1.2), 10);

  return raw;
}

// ─────────────────────────────────────────────────────────────────
// Factor 5 — Interlocutor accessibility (0-5)
// ─────────────────────────────────────────────────────────────────
function scoreInterlocutorAccess(b) {
  const interlocs = b.interlocutors || [];
  if (interlocs.length === 0) return 0;

  let score = 0;
  for (const i of interlocs) {
    if (i.name && i.role) score += 2;
    if (i.linkedin) score += 1;
  }
  return Math.min(score, 5);
}

// ─────────────────────────────────────────────────────────────────
// Factor 6 — Competitive vacuum (0-5)
//   No competitor platform = 5; established player = 0.
// ─────────────────────────────────────────────────────────────────
function scoreCompetitiveVacuum(b) {
  if (!b.competitor_platform) return 5;
  const major = ['Demica','Orbian','Taulia','Kyriba','PrimeRevenue','C2FO','Tradeshift'];
  if (major.includes(b.competitor_platform)) return 0;
  return 2; // smaller / regional player
}

// ─────────────────────────────────────────────────────────────────
// Factor 7 — Regulatory tailwind (0-5)
//   EU Late Payments Directive (2024-2025) = +3 if EU member
//   Basel III SCF capital relief = +1 universally
//   Country-specific factor = +1 if recent SCF mandate / EBRD program
// ─────────────────────────────────────────────────────────────────
const EU_MEMBERS = ['DE','FR','IT','ES','BE','NL','LU','AT','PL','CZ','SK','HU','RO','BG','SI','HR','EE','LV','LT','PT','GR','IE','FI','SE','DK','MT','CY'];
function scoreRegulatoryTailwind(b) {
  let score = 1; // Basel III universal
  if (EU_MEMBERS.includes(b.country)) score += 3;
  if ((b.triggers || []).some(t => t.type === 'EBRD_PROGRAM')) score += 1;
  return Math.min(score, 5);
}

// ─────────────────────────────────────────────────────────────────
// Aggregate
// ─────────────────────────────────────────────────────────────────
function scoreBank(b) {
  const score = {
    tf_strength:        scoreTfStrength(b),
    scf_gap:            scoreScfGap(b),
    trigger_freshness:  scoreTriggerFreshness(b),
    country_flow:       scoreCountryFlow(b),
    interlocutor_access:scoreInterlocutorAccess(b),
    competitive_vacuum: scoreCompetitiveVacuum(b),
    regulatory_tailwind:scoreRegulatoryTailwind(b),
  };
  score.total = Object.values(score).reduce((a, c) => a + c, 0);
  return score;
}

function priorityFor(b, score) {
  if (b.scf_level === 'AVANCE' || b.exclusion_reason) return 'EXCLU';
  if (score.total >= 32) return 'P1';
  if (score.total >= 22) return 'P2';
  if (score.total >= 12) return 'P3';
  return 'P4';
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────
function main() {
  const banks = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  console.log(`Loaded ${banks.length} banks from ${DB_PATH}`);

  const scored = banks.map(b => {
    const score = scoreBank(b);
    return { ...b, score, priority: priorityFor(b, score), last_updated: TODAY.toISOString().slice(0,10) };
  });

  scored.sort((a,b) => b.score.total - a.score.total);

  fs.writeFileSync(OUT_PATH, JSON.stringify(scored, null, 2));
  console.log(`Wrote ${scored.length} scored banks to ${OUT_PATH}`);

  const dist = scored.reduce((d,b) => ({ ...d, [b.priority]: (d[b.priority]||0)+1 }), {});
  console.log('\nPriority distribution:');
  for (const [p, n] of Object.entries(dist).sort()) console.log(`  ${p}: ${n}`);

  console.log('\nTop 10 by score:');
  for (const b of scored.slice(0, 10)) {
    console.log(`  ${String(b.score.total).padStart(3)} ${b.priority}  ${b.name.padEnd(28)} ${b.country}`);
  }
}

if (require.main === module) main();
module.exports = { scoreBank, priorityFor };
