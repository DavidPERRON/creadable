#!/usr/bin/env node
/**
 * Corporate Demand Signal
 *
 * From corporate extractions → P(corporate pushes bank to adopt SCF in 12m)
 * Algorithmic, no LLM cost.
 *
 * Output: corporate_scraper/reports/demand_signals.json
 *
 * Run:
 *   node engine/demand_signal.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT     = path.join(__dirname, '..');
const EXT_DIR  = path.join(ROOT, 'extractions');
const OUT_PATH = path.join(ROOT, 'reports', 'demand_signals.json');

const CONF_SCORE = { high: 3, medium: 2, low: 1, none: 0 };

const SCF_FIELDS = [
  'supply_chain_finance', 'reverse_factoring', 'factoring',
  'documentary_trade_finance', 'distributor_finance', 'inventory_finance',
];

function scoreExtraction(ext) {
  let score = 0;
  const signals = [];

  // 1. SCF product depth
  for (const field of SCF_FIELDS) {
    const conf = ext[field]?.confidence || 'none';
    const pts  = CONF_SCORE[conf] || 0;
    if (pts >= 2) signals.push(`${field.replace(/_/g,' ')} (${conf})`);
    score += pts;
  }

  // 2. Banks mentioned (more banks = more relationships to upgrade)
  const banksCount = ext.banks_mentioned_in_scf_or_trade_finance_context?.length || 0;
  if (banksCount >= 5) { score += 3; signals.push(`${banksCount} banques mentionnées`); }
  else if (banksCount >= 3) { score += 2; signals.push(`${banksCount} banques mentionnées`); }
  else if (banksCount >= 1) { score += 1; }

  // 3. ERP integration detected (readiness signal)
  const erpConf = ext.erp_integration?.confidence || 'none';
  if (erpConf === 'high')   { score += 2; signals.push('ERP confirmé'); }
  else if (erpConf === 'medium') { score += 1; }

  // 4. Platform already present = LOWER demand (already served)
  if (ext.platform_provider_mentioned?.found) {
    score -= 2;
    signals.push('Plateforme existante ⚠️');
  }

  // 5. Sustainability-linked SCF = forward-looking demand
  const esgConf = ext.sustainability_linked_scf?.confidence || 'none';
  if (esgConf === 'high') { score += 2; signals.push('SCF ESG confirmé'); }

  // Demand level
  let demand_level, demand_pct;
  if (score >= 10) { demand_level = 'VERY_HIGH'; demand_pct = 80; }
  else if (score >= 7) { demand_level = 'HIGH';      demand_pct = 60; }
  else if (score >= 4) { demand_level = 'MEDIUM';    demand_pct = 35; }
  else if (score >= 2) { demand_level = 'LOW';       demand_pct = 15; }
  else                 { demand_level = 'NONE';      demand_pct = 5;  }

  return {
    id:            ext.id,
    name:          ext.name,
    country:       ext.country,
    sector:        ext.sector,
    demand_level,
    p_push_12m:    demand_pct,
    demand_score:  score,
    banks_count:   banksCount,
    top_signals:   signals.slice(0, 4),
  };
}

function main() {
  const files = fs.readdirSync(EXT_DIR).filter(f => f.endsWith('.json'));
  if (!files.length) { console.log('[demand_signal] No extractions found.'); return; }

  const results = [];
  for (const f of files) {
    try {
      const ext = JSON.parse(fs.readFileSync(path.join(EXT_DIR, f), 'utf8'));
      results.push(scoreExtraction(ext));
    } catch (e) {}
  }

  results.sort((a, b) => b.demand_score - a.demand_score);

  const byLevel = { VERY_HIGH: 0, HIGH: 0, MEDIUM: 0, LOW: 0, NONE: 0 };
  results.forEach(r => { byLevel[r.demand_level] = (byLevel[r.demand_level] || 0) + 1; });

  const output = {
    generated_at: new Date().toISOString().slice(0, 10),
    corporates_analyzed: results.length,
    distribution: byLevel,
    corporates: results,
  };

  fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2));

  console.log(`[demand_signal] ${results.length} corporates scored`);
  console.log('[demand_signal] Distribution:', JSON.stringify(byLevel));
  console.log('[demand_signal] Top 5:');
  results.slice(0, 5).forEach((r, i) => {
    console.log(`  ${i+1}. ${r.name?.padEnd(30) || r.id} P12m=${r.p_push_12m}% (${r.demand_level})`);
  });
}

main();
