#!/usr/bin/env node
/**
 * Buying Intent Score (BIS) Calculator
 *
 * Pour chaque banque candidate, calcule un score probabiliste 0-100 estimant
 * la probabilité qu'elle achète un produit white-label CredAble dans 12 mois.
 *
 * 8 SIGNAUX PONDÉRÉS :
 *   1. Capability gap révélé           20%
 *   2. Strategic intent récent         15%
 *   3. Concurrent failure / orphelinat 20%  ★ inclut le replacement-gap
 *   4. Peer pressure                   10%
 *   5. Corporate demand revealed       10%
 *   6. Pre-integration fit (Finastra)  15%
 *   7. TCI partnership existante        5%
 *   8. Stress signals (NPL/RWA)         5%
 *
 * Inputs:
 *   - prospection/data/banks.scored.json    (V4 scoring + priority)
 *   - bank_intelligence/data/bank_techstack.json (Signal 6, 7)
 *   - bank_intelligence/data/fintech_failures.json (Signal 3)
 *   - bank_intelligence/extractions/<bank_id>.json (Signal 1, 2, 7, 8)
 *   - corporate_scraper/reports/bank_evidence.json (Signal 5)
 *
 * Output:
 *   - bank_intelligence/reports/bis_scores.json
 *
 * Run: node engine/bis_calculator.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const REPO = path.join(ROOT, '..');
const TODAY = new Date('2026-05-10');
const TODAY_STR = TODAY.toISOString().slice(0, 10);

const PATHS = {
  v4_scored:        path.join(REPO, 'prospection', 'data', 'banks.scored.json'),
  techstack:        path.join(ROOT, 'data', 'bank_techstack.json'),
  failures:         path.join(ROOT, 'data', 'fintech_failures.json'),
  bank_extractions: path.join(ROOT, 'extractions'),
  corp_evidence:    path.join(REPO, 'corporate_scraper', 'reports', 'bank_evidence.json'),
  jobs_dir:         path.join(ROOT, 'jobs'),
  out_scores:       path.join(ROOT, 'reports', 'bis_scores.json'),
};

const WEIGHTS = {
  capability_gap:      20,
  strategic_intent:    15,
  competitor_failure:  20,
  peer_pressure:       10,
  corporate_demand:    10,
  pre_integration:     15,
  tci_partnership:      5,
  stress_signals:       5,
};

// Friction → pre-integration score 0-10
const FRICTION_TO_SCORE = { low: 10, medium: 6, high: 2 };

// ─────────────────────────────────────────────────────────────────
// Load inputs
// ─────────────────────────────────────────────────────────────────
function loadAll() {
  const v4 = fs.existsSync(PATHS.v4_scored)
    ? JSON.parse(fs.readFileSync(PATHS.v4_scored, 'utf8')) : [];
  const techstack = fs.existsSync(PATHS.techstack)
    ? JSON.parse(fs.readFileSync(PATHS.techstack, 'utf8')).banks : [];
  const failures = fs.existsSync(PATHS.failures)
    ? JSON.parse(fs.readFileSync(PATHS.failures, 'utf8')).events : [];
  const corp = fs.existsSync(PATHS.corp_evidence)
    ? JSON.parse(fs.readFileSync(PATHS.corp_evidence, 'utf8')) : { sweet_spots: [], full_bank_map: {} };

  const extractions = {};
  if (fs.existsSync(PATHS.bank_extractions)) {
    fs.readdirSync(PATHS.bank_extractions).filter(f => f.endsWith('.json')).forEach(f => {
      const ext = JSON.parse(fs.readFileSync(path.join(PATHS.bank_extractions, f), 'utf8'));
      extractions[ext.bank_id] = ext;
    });
  }

  // Job postings (Tier 2 signal)
  const jobs = {};
  if (fs.existsSync(PATHS.jobs_dir)) {
    fs.readdirSync(PATHS.jobs_dir).filter(f => f.endsWith('.json')).forEach(f => {
      try {
        const j = JSON.parse(fs.readFileSync(path.join(PATHS.jobs_dir, f), 'utf8'));
        if (j.bank_id) jobs[j.bank_id] = j;
      } catch (e) {}
    });
  }

  return { v4, techstack, failures, extractions, corp, jobs };
}

// ─────────────────────────────────────────────────────────────────
// Helper: normalize bank name for matching
// ─────────────────────────────────────────────────────────────────
function normName(name) {
  return (name || '').toLowerCase()
    .replace(/\b(s\.?a\.?|s\.?p\.?a\.?|n\.?v\.?|a\.?g\.?|gmbh|plc|ltd|inc|corp|group|bank|banca|banco|banque|holding)\b/gi, '')
    .replace(/[^a-z0-9]/g, '').trim();
}

// ─────────────────────────────────────────────────────────────────
// SIGNAL 1 — Capability gap (0-10)
// Sources: bank_extractor (factoring volume growth, vague vocabulary,
//          manual processes, SCF without platform)
// ─────────────────────────────────────────────────────────────────
function scoreCapabilityGap(bank, ext, ts) {
  if (!ext) {
    // Fallback to techstack-based proxy
    if (!ts) return 0;
    if (ts.tf_scf_platform === null) return 6;     // pas de plateforme = gap clair
    if (ts.tf_scf_platform?.toLowerCase().includes('orphan')) return 9; // orphan
    return 3;
  }
  const cap = ext.capability_gap_signals || {};
  let score = 0;
  if (cap.scf_mentioned_without_platform?.found) score += 4;
  if (cap.factoring_volume_growth_pct?.value > 20) score += 3;
  if (cap.factoring_volume_growth_pct?.value > 35) score += 2; // additional bonus
  if (cap.manual_paper_processes_mentioned?.found) score += 2;
  if (cap.vague_scf_vocabulary?.found) score += 1;
  return Math.min(10, score);
}

// ─────────────────────────────────────────────────────────────────
// SIGNAL 2 — Strategic intent (0-10)
// Sources: bank_extractor (CEO statements, transformation, hiring)
// + V4 triggers (RECRUITMENT, CEO_STATEMENT)
// ─────────────────────────────────────────────────────────────────
function scoreStrategicIntent(bank, ext, v4, jobs) {
  let score = 0;
  if (ext) {
    const s = ext.strategic_intent_signals || {};
    if (s.ceo_statement_on_transaction_banking?.found) score += 3;
    if (s.digital_transformation_priority?.found) score += 2;
    if (s.investor_day_scf_mention?.found) score += 2;
    if (s.new_tf_scf_executive_hired?.found) score += 3;
    // News signals from bank_news.js
    const ns = ext.news_signals || {};
    if (ns.ceo_or_exec_change?.found) score += 1;
    if (ns.platform_or_tech_announced?.found) score += 2;
    if (ns.digital_initiative_public?.found) score += 1;
    if (ns.fintech_partnership?.found) score += 2;
  }
  // V4 triggers fallback
  if (v4?.triggers) {
    const recent = v4.triggers.filter(t => {
      const days = (TODAY - new Date(t.date)) / 86400000;
      return days < 540 && days >= 0;
    });
    if (recent.some(t => t.type === 'RECRUITMENT')) score += 2;
    if (recent.some(t => t.type === 'CEO_STATEMENT')) score += 2;
  }
  // Job postings signal (Tier 2) — active hiring = revealed intent
  if (jobs) {
    if (jobs.hiring_intent === 'VERY_HIGH') score += 3;
    else if (jobs.hiring_intent === 'HIGH') score += 2;
    else if (jobs.hiring_intent === 'MEDIUM') score += 1;
  }
  return Math.min(10, score);
}

// ─────────────────────────────────────────────────────────────────
// SIGNAL 3 — Competitor failure / orphelinat (0-10)
// + REPLACEMENT GAP timeline (Greensill 2021 → JPM/Taulia 2024-25)
// ─────────────────────────────────────────────────────────────────
function scoreCompetitorFailure(bank, failures) {
  const banknNorm = normName(bank.name);
  let bestScore = 0;
  let bestEvent = null;

  for (const event of failures) {
    if (!event.affected_banks) continue;
    for (const ab of event.affected_banks) {
      if (normName(ab.bank_name) !== banknNorm) continue;

      // Score based on event severity + freshness
      const daysSince = (TODAY - new Date(event.date)) / 86400000;
      let s = 0;
      if (event.severity === 'critical')  s = 10;
      else if (event.severity === 'moderate') s = 6;
      else if (event.severity === 'low')      s = 2;

      // Apply replacement-gap penalty: if event is >36 months old, replacement
      // likely happened (JPM/Taulia post-Greensill). Score decays.
      if (daysSince > 1095) s = Math.max(0, s - 5);

      // Status-based adjustment
      if (ab.status?.includes('orphan')) s = Math.min(10, s + 1);
      if (ab.status?.includes('moved on') || ab.status?.includes('exited')) s = Math.max(0, s - 3);
      if (ab.status?.includes('now equipped')) s = 0; // already replaced

      if (s > bestScore) { bestScore = s; bestEvent = event; }
    }
  }
  return { score: bestScore, event: bestEvent };
}

// ─────────────────────────────────────────────────────────────────
// SIGNAL 4 — Peer pressure (0-10)
// Compute % of peer banks (same country, similar tier) that have AVANCE SCF
// ─────────────────────────────────────────────────────────────────
function scorePeerPressure(bank, v4_all) {
  if (!bank) return 0;
  const peers = v4_all.filter(b =>
    b.country === bank.country &&
    b.id !== bank.id &&
    b.scf_level !== undefined
  );
  if (peers.length === 0) return 0;

  const advancedPeers = peers.filter(p => p.scf_level === 'AVANCE');
  const ratio = advancedPeers.length / peers.length;

  // High ratio = high peer pressure
  if (ratio >= 0.5) return 10;
  if (ratio >= 0.3) return 7;
  if (ratio >= 0.2) return 5;
  if (ratio >= 0.1) return 3;
  return 1;
}

// ─────────────────────────────────────────────────────────────────
// SIGNAL 5 — Corporate demand revealed (0-10)
// From corporate_scraper bank_evidence.json
// ─────────────────────────────────────────────────────────────────
function scoreCorporateDemand(bank, corpData) {
  if (!corpData?.full_bank_map) return 0;
  const targetNorm = normName(bank.name);
  // Find bank in corp evidence
  const evidence = corpData.full_bank_map[targetNorm];
  if (!evidence?.evidence) return 0;
  const count = evidence.evidence.length;
  if (count >= 5) return 10;
  if (count >= 3) return 7;
  if (count >= 2) return 5;
  if (count >= 1) return 3;
  return 0;
}

// ─────────────────────────────────────────────────────────────────
// SIGNAL 6 — Pre-integration fit (0-10)
// From bank_techstack.json (manual curation) + bank_extractor (auto-detect)
// ─────────────────────────────────────────────────────────────────
function scorePreIntegrationFit(ts, ext) {
  // Manual curation primary
  if (ts) {
    const baseScore = FRICTION_TO_SCORE[ts.credable_friction] || 5;
    // Bonus: explicit Finastra/Temenos in description
    if ((ts.core_banking || '').toLowerCase().match(/finastra|temenos|misys/)) {
      return Math.min(10, baseScore + 1);
    }
    return baseScore;
  }
  // Fallback: extractor
  if (ext?.tech_stack_signals) {
    const t = ext.tech_stack_signals;
    if (t.core_banking_system?.is_finastra_or_temenos) return 9;
    if (t.cloud_or_api_first?.found) return 8;
    return 5;
  }
  return 4;
}

// ─────────────────────────────────────────────────────────────────
// SIGNAL 7 — TCI partnership (0-10)
// ─────────────────────────────────────────────────────────────────
function scoreTciPartnership(ts, ext) {
  let score = 0;
  if (ts?.trade_credit_insurer) score += 5;
  if (ext?.tci_partnership_signals?.tci_providers_mentioned?.length > 0) score += 5;
  if (ext?.tci_partnership_signals?.tci_program_volume?.value_eur > 100000000) score += 2;
  return Math.min(10, score);
}

// ─────────────────────────────────────────────────────────────────
// SIGNAL 8 — Stress signals (0-10)
// ─────────────────────────────────────────────────────────────────
function scoreStressSignals(ext) {
  if (!ext?.stress_signals) return 0;
  const s = ext.stress_signals;
  let score = 0;
  if (s.npl_ratio?.trend === 'rising') score += 4;
  if (s.npl_ratio?.value_pct > 3.0) score += 3;
  if (s.rwa_pressure?.found) score += 2;
  if (s.capital_optimization_focus?.found) score += 2;
  if (s.basel_iii_scf_treatment?.found) score += 1;
  return Math.min(10, score);
}

// ─────────────────────────────────────────────────────────────────
// Aggregate BIS
// ─────────────────────────────────────────────────────────────────
function calculateBis(bank, v4, ts, ext, failures, corpData, v4_all, jobs) {
  const sig = {
    capability_gap:     scoreCapabilityGap(bank, ext, ts),
    strategic_intent:   scoreStrategicIntent(bank, ext, v4, jobs),
    competitor_failure: scoreCompetitorFailure(bank, failures),
    peer_pressure:      scorePeerPressure(bank, v4_all),
    corporate_demand:   scoreCorporateDemand(bank, corpData),
    pre_integration:    scorePreIntegrationFit(ts, ext),
    tci_partnership:    scoreTciPartnership(ts, ext),
    stress_signals:     scoreStressSignals(ext),
  };

  // Weighted total (out of 100)
  const cf = sig.competitor_failure.score || 0;
  const total =
      sig.capability_gap     * (WEIGHTS.capability_gap / 10)
    + sig.strategic_intent   * (WEIGHTS.strategic_intent / 10)
    + cf                     * (WEIGHTS.competitor_failure / 10)
    + sig.peer_pressure      * (WEIGHTS.peer_pressure / 10)
    + sig.corporate_demand   * (WEIGHTS.corporate_demand / 10)
    + sig.pre_integration    * (WEIGHTS.pre_integration / 10)
    + sig.tci_partnership    * (WEIGHTS.tci_partnership / 10)
    + sig.stress_signals     * (WEIGHTS.stress_signals / 10);

  // BIS bucket
  let bucket;
  if (total >= 70) bucket = 'HIGH';
  else if (total >= 50) bucket = 'MEDIUM-HIGH';
  else if (total >= 30) bucket = 'MEDIUM';
  else if (total >= 15) bucket = 'LOW';
  else bucket = 'VERY LOW';

  // Window estimation
  let window_months;
  if (sig.competitor_failure.score >= 8) window_months = 6;       // fresh orphan
  else if (sig.strategic_intent >= 7) window_months = 9;         // active strategic shift
  else if (sig.capability_gap >= 7) window_months = 12;          // gap revealed
  else if (total >= 50) window_months = 18;
  else window_months = 24;

  return {
    bis_total: Math.round(total),
    bis_bucket: bucket,
    estimated_window_months: window_months,
    signal_breakdown: {
      capability_gap:     { score: sig.capability_gap,     weight: WEIGHTS.capability_gap,     contribution: Math.round(sig.capability_gap * WEIGHTS.capability_gap / 10) },
      strategic_intent:   { score: sig.strategic_intent,   weight: WEIGHTS.strategic_intent,   contribution: Math.round(sig.strategic_intent * WEIGHTS.strategic_intent / 10) },
      competitor_failure: { score: cf,                     weight: WEIGHTS.competitor_failure, contribution: Math.round(cf * WEIGHTS.competitor_failure / 10), event: sig.competitor_failure.event?.event_id || null },
      peer_pressure:      { score: sig.peer_pressure,      weight: WEIGHTS.peer_pressure,      contribution: Math.round(sig.peer_pressure * WEIGHTS.peer_pressure / 10) },
      corporate_demand:   { score: sig.corporate_demand,   weight: WEIGHTS.corporate_demand,   contribution: Math.round(sig.corporate_demand * WEIGHTS.corporate_demand / 10) },
      pre_integration:    { score: sig.pre_integration,    weight: WEIGHTS.pre_integration,    contribution: Math.round(sig.pre_integration * WEIGHTS.pre_integration / 10) },
      tci_partnership:    { score: sig.tci_partnership,    weight: WEIGHTS.tci_partnership,    contribution: Math.round(sig.tci_partnership * WEIGHTS.tci_partnership / 10) },
      stress_signals:     { score: sig.stress_signals,     weight: WEIGHTS.stress_signals,     contribution: Math.round(sig.stress_signals * WEIGHTS.stress_signals / 10) },
    },
    pitch_argument: buildPitchArgument(sig, cf >= 8 ? sig.competitor_failure.event : null),
  };
}

function buildPitchArgument(sig, orphanEvent) {
  const parts = [];
  if (orphanEvent && sig.competitor_failure.score >= 8) {
    const replacers = (orphanEvent.replaced_by || []).map(r => r.replacer).join('/');
    if (replacers) {
      parts.push(`★ ${orphanEvent.fintech_name} ${orphanEvent.event_type} → orphan. Historiquement le gap se ferme à 3-4 ans (cas Greensill→${replacers}). CredAble peut déployer en 3-6 mois.`);
    } else {
      parts.push(`★ ${orphanEvent.fintech_name} ${orphanEvent.event_type} → orphan. Fenêtre 6 mois avant qu'un incumbent (JPM/Taulia) ne prenne la place.`);
    }
  }
  if (sig.pre_integration >= 9)        parts.push('Pré-intégration Finastra/Temenos = friction minimale, déploiement 2-3 mois.');
  if (sig.capability_gap >= 7)         parts.push('Capability gap explicite documenté.');
  if (sig.strategic_intent >= 7)       parts.push('Intention stratégique récente (recrutement / déclaration CEO).');
  if (sig.corporate_demand >= 7)       parts.push('Demande corporate validée (cité par plusieurs grands buyers).');
  if (sig.peer_pressure >= 7)          parts.push('Pression concurrentielle pairs : majorité des concurrents équipés.');
  if (sig.tci_partnership >= 7)        parts.push('Partenariat TCI existant = match avec différenciateur CredAble (TCI integration).');
  return parts.length > 0 ? parts.join(' ') : 'Aucun signal fort. Surveiller pour évolution.';
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────
function main() {
  const { v4, techstack, failures, extractions, corp, jobs } = loadAll();
  console.log(`[bis] Loaded: V4=${v4.length} banks, techstack=${techstack.length}, failures=${failures.length}, extractions=${Object.keys(extractions).length}, jobs=${Object.keys(jobs).length}`);

  const v4Index = {};
  v4.forEach(b => { v4Index[b.id] = b; });

  const tsIndex = {};
  techstack.forEach(b => { tsIndex[b.bank_id] = b; });

  // Score every bank present in BOTH V4 and techstack (top 50 reference set)
  const targetBanks = [...new Set([...Object.keys(v4Index), ...Object.keys(tsIndex)])];

  const scored = targetBanks.map(id => {
    const v4Bank = v4Index[id];
    const ts = tsIndex[id];
    const ext = extractions[id];
    const bank = v4Bank || { id, name: ts?.name, country: ts?.country };
    if (!bank.name) return null;

    const jobData = jobs[id] || null;
    const bis = calculateBis(bank, v4Bank, ts, ext, failures, corp, v4, jobData);
    return {
      bank_id: bank.id,
      bank_name: bank.name,
      country: bank.country,
      v4_priority: v4Bank?.priority || 'NEW',
      v4_score: v4Bank?.score?.total || null,
      v4_scf_level: v4Bank?.scf_level || null,
      tech_stack: ts ? {
        core_banking: ts.core_banking,
        tf_scf_platform: ts.tf_scf_platform,
        trade_credit_insurer: ts.trade_credit_insurer,
        credable_friction: ts.credable_friction,
        rationale: ts.rationale,
      } : null,
      bis,
    };
  }).filter(Boolean);

  scored.sort((a, b) => b.bis.bis_total - a.bis.bis_total);

  fs.mkdirSync(path.dirname(PATHS.out_scores), { recursive: true });
  fs.writeFileSync(PATHS.out_scores, JSON.stringify({
    generated_at: TODAY_STR,
    weights: WEIGHTS,
    total_banks_scored: scored.length,
    banks: scored,
  }, null, 2));

  console.log(`\n[bis] Wrote ${scored.length} BIS scores to ${PATHS.out_scores}`);

  // Distribution
  const dist = scored.reduce((d, s) => ({ ...d, [s.bis.bis_bucket]: (d[s.bis.bis_bucket] || 0) + 1 }), {});
  console.log(`[bis] BIS distribution:`);
  for (const b of ['HIGH', 'MEDIUM-HIGH', 'MEDIUM', 'LOW', 'VERY LOW']) {
    console.log(`     ${b.padEnd(12)} ${dist[b] || 0}`);
  }
  console.log(`\n[bis] Top 10 by BIS:`);
  scored.slice(0, 10).forEach((s, i) => {
    console.log(`  ${String(i+1).padStart(2)}. ${String(s.bis.bis_total).padStart(3)}  ${s.bis.bis_bucket.padEnd(12)} ${s.bank_name.padEnd(28)} (${s.country}) — window ${s.bis.estimated_window_months}mo`);
  });
}

if (require.main === module) main();
module.exports = { calculateBis, WEIGHTS };
