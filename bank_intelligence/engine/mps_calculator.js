#!/usr/bin/env node
/**
 * Market Pressure Score (MPS) — Model 2
 *
 * Demand-side scoring: for each bank, how much commercial pressure
 * comes from corporates in its market that need SCF/TF solutions?
 *
 * Inputs  : bis_scores.json (Model 1, read-only) + corporate catalog.json
 * Output  : reports/mps_scores.json
 * Cost    : $0 — pure algorithmic, no LLM, no downloads
 *
 * Run:
 *   node engine/mps_calculator.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT         = path.join(__dirname, '..');
const CS_ROOT      = path.join(ROOT, '..', 'corporate_scraper');
const CATALOG_PATH = path.join(CS_ROOT, 'catalog.json');
const BIS_PATH     = path.join(ROOT, 'reports', 'bis_scores.json');
const EXTRACT_DIR  = path.join(CS_ROOT, 'extractions');
const OUT_PATH     = path.join(ROOT, 'reports', 'mps_scores.json');

// SCF demand intensity by corporate sector (0–1)
// Based on supply chain complexity, payment cycle length, supplier base size
const SECTOR_SCF_WEIGHT = {
  'Automotive':   1.00,  // Long T1/T2/T3 chains, JIT payments
  'Industrial':   0.95,  // Heavy procurement, equipment financing
  'FMCG':         0.90,  // Large supplier bases, fast cycles
  'Chemicals':    0.90,  // Raw material procurement at scale
  'Retail':       0.85,  // Supplier financing programs (DPO extension)
  'Construction': 0.85,  // Sub-contractor payment chains
  'Pharma':       0.80,  // API & CMO procurement, distributor finance
  'Agribusiness': 0.80,  // Seasonal financing, commodity procurement
  'Energy':       0.75,  // Large capex payables management
  'Mining':       0.70,  // Equipment & logistics procurement
  'Logistics':    0.70,  // Fleet financing, carrier payments
  'Aerospace':    0.65,  // Tier suppliers, long payment terms
  'Telecom':      0.55,  // Network equipment procurement
  'Tech':         0.55,  // Hardware/services procurement
  'Utilities':    0.50,  // Long-term contracts, capex
  'Luxury':       0.40,  // Controlled supply chains, lower urgency
  'Media':        0.35,
  'Services':     0.35,
  'Insurance':    0.30,
  'Banking':      0.25,
};

// How large is the SCF gap per bank SCF level (1.0 = full gap, 0 = no gap)
const SCF_GAP = {
  'ABSENT':        1.00,
  'BASIQUE':       0.75,
  'INTERMEDIAIRE': 0.40,
  'AVANCE':        0.10,
};

// European countries that share a banking market (region groups for "nearby" scoring)
const EU_REGIONS = {
  DACH:    ['DE', 'AT', 'CH'],
  BENELUX: ['NL', 'BE', 'LU'],
  NORDICS: ['SE', 'NO', 'DK', 'FI'],
  CEE:     ['PL', 'CZ', 'SK', 'HU', 'SI', 'HR'],
  BALKANS: ['RS', 'BA', 'MK', 'AL', 'BG', 'RO'],
  IBERIA:  ['ES', 'PT'],
  BALTICS: ['EE', 'LV', 'LT'],
  CAUCASUS:['GE', 'AM', 'AZ'],
};

function getRegion(country) {
  for (const [region, countries] of Object.entries(EU_REGIONS)) {
    if (countries.includes(country)) return region;
  }
  return null;
}

function loadExtraction(corpId) {
  const fp = path.join(EXTRACT_DIR, `${corpId}.json`);
  if (!fs.existsSync(fp)) return null;
  try { return JSON.parse(fs.readFileSync(fp, 'utf8')); } catch { return null; }
}

function calcMPS(bank, corporates) {
  const bankCountry = bank.country;
  const bankRegion  = getRegion(bankCountry);

  // Segment corporates: direct market vs regional market
  const directCorps   = corporates.filter(c => c.country === bankCountry);
  const regionalCorps = corporates.filter(c =>
    c.country !== bankCountry && bankRegion && getRegion(c.country) === bankRegion
  );

  // ── Component 1: Geographic density (40 pts) ────────────────────
  // Direct market (30 pts) + regional halo (10 pts)
  const directRevenue   = directCorps.reduce((s, c) => s + (c.revenue_eur_bn || 0), 0);
  const regionalRevenue = regionalCorps.reduce((s, c) => s + (c.revenue_eur_bn || 0), 0);

  // Normalize: DE has 39 corps (max), average country ~9
  const geo_direct   = Math.min(30, (directCorps.length / 40) * 15 + (directRevenue / 2500) * 15);
  const geo_regional = Math.min(10, (regionalCorps.length / 60) * 5 + (regionalRevenue / 3000) * 5);
  const geo_score    = geo_direct + geo_regional;

  // ── Component 2: Sector SCF intensity (25 pts) ──────────────────
  const allMarketCorps = [...directCorps, ...regionalCorps.slice(0, 10)]; // cap regional
  const sectorWeights  = allMarketCorps.map(c => SECTOR_SCF_WEIGHT[c.sector] || 0.50);
  const avgSectorWeight = sectorWeights.length > 0
    ? sectorWeights.reduce((a, b) => a + b, 0) / sectorWeights.length
    : 0.40;
  const sector_score = avgSectorWeight * 25;

  // ── Component 3: Bank SCF gap vs market opportunity (25 pts) ────
  const scfGap       = SCF_GAP[bank.v4_scf_level] ?? 0.60;
  const marketDensity = Math.min(1, (directCorps.length + regionalCorps.length * 0.3) / 25);
  const gap_score    = scfGap * marketDensity * 25;

  // ── Component 4: BIS signal boost (10 pts) ──────────────────────
  // Competitor failure + peer pressure from Model 1 (read-only)
  const sb          = bank.bis?.signal_breakdown || {};
  const signal_boost = Math.min(10,
    ((sb.competitor_failure?.score || 0) / 10) * 6 +
    ((sb.peer_pressure?.score     || 0) / 10) * 4
  );

  const mps_total = Math.round(Math.min(100,
    geo_score + sector_score + gap_score + signal_boost
  ));

  // ── Combined priority: geometric mean of BIS × MPS ──────────────
  const bis_total     = bank.bis?.bis_total || 0;
  const combined_score = Math.round(Math.sqrt(bis_total * mps_total));

  // ── Enrichment from available corporate extractions ──────────────
  const extraction_signals = [];
  for (const corp of directCorps) {
    const ext = loadExtraction(corp.id);
    if (!ext) continue;
    // Banks mentioned by this corporate in working capital context
    const banksMentioned = ext.banks_in_working_capital_context || [];
    if (banksMentioned.length) {
      extraction_signals.push({ corp: corp.name, banks_mentioned: banksMentioned });
    }
  }

  // ── MPS bucket ───────────────────────────────────────────────────
  let mps_bucket;
  if      (mps_total >= 65) mps_bucket = 'HIGH';
  else if (mps_total >= 45) mps_bucket = 'MEDIUM-HIGH';
  else if (mps_total >= 25) mps_bucket = 'MEDIUM';
  else                       mps_bucket = 'LOW';

  // ── Top sectors in direct market ─────────────────────────────────
  const sectorCount = {};
  directCorps.forEach(c => { sectorCount[c.sector] = (sectorCount[c.sector] || 0) + 1; });
  const top_sectors = Object.entries(sectorCount)
    .sort((a, b) => b[1] - a[1]).slice(0, 4)
    .map(([s, n]) => `${s}(${n})`);

  // ── Pitch context ─────────────────────────────────────────────────
  const pitch_context = directCorps.length > 0
    ? `${directCorps.length} corporate(s) en ${bankCountry} — CA cumulé ${Math.round(directRevenue)}Bn EUR — secteurs: ${top_sectors.join(', ')}`
    : `Marché ${bankCountry} limité — opportunité via corporates régionaux (${bankRegion || 'EU'})`;

  return {
    mps_total,
    mps_bucket,
    combined_score,
    components: {
      geo_score:    Math.round(geo_score * 10) / 10,
      sector_score: Math.round(sector_score * 10) / 10,
      gap_score:    Math.round(gap_score * 10) / 10,
      signal_boost: Math.round(signal_boost * 10) / 10,
    },
    market: {
      country:                    bankCountry,
      region:                     bankRegion || 'OTHER',
      corporate_count_direct:     directCorps.length,
      corporate_count_regional:   regionalCorps.length,
      addressable_revenue_eur_bn: Math.round(directRevenue),
      regional_revenue_eur_bn:    Math.round(regionalRevenue),
      top_sectors,
    },
    extraction_signals: extraction_signals.slice(0, 3),
    pitch_context,
  };
}

function main() {
  if (!fs.existsSync(BIS_PATH)) {
    console.error('[mps] bis_scores.json not found — run bi:all first.');
    process.exit(1);
  }
  if (!fs.existsSync(CATALOG_PATH)) {
    console.error('[mps] catalog.json not found.');
    process.exit(1);
  }

  const bisData    = JSON.parse(fs.readFileSync(BIS_PATH, 'utf8'));
  const catData    = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  const banks      = bisData.banks || [];
  const corporates = (catData.corporates || catData || []);

  const extractCount = fs.existsSync(EXTRACT_DIR)
    ? fs.readdirSync(EXTRACT_DIR).filter(f => f.endsWith('.json')).length : 0;

  console.log(`[mps] ${banks.length} banks × ${corporates.length} corporates`);
  console.log(`[mps] ${extractCount} corporate extractions available for enrichment`);
  console.log('[mps] Computing Market Pressure Scores…');

  const results = banks.map(bank => {
    const mps = calcMPS(bank, corporates);
    return {
      bank_id:    bank.bank_id,
      bank_name:  bank.bank_name,
      country:    bank.country,
      v4_priority: bank.v4_priority,
      scf_level:  bank.v4_scf_level,
      // Model 1 reference (read-only, not modified)
      bis_score:  bank.bis?.bis_total  || 0,
      bis_bucket: bank.bis?.bis_bucket || '?',
      // Model 2 output
      ...mps,
    };
  });

  results.sort((a, b) => b.combined_score - a.combined_score);

  // Statistics
  const bucketDist = {};
  results.forEach(r => { bucketDist[r.mps_bucket] = (bucketDist[r.mps_bucket] || 0) + 1; });

  const out = {
    generated_at:   new Date().toISOString().slice(0, 10),
    model:          'mps_v1',
    description:    'Market Pressure Score — demand-side: corporate footprint × bank SCF gap × sector intensity',
    banks_scored:   results.length,
    corporates_used: corporates.length,
    extractions_used: extractCount,
    bucket_distribution: bucketDist,
    results,
  };

  fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));

  console.log(`\n[mps] Bucket distribution: ${JSON.stringify(bucketDist)}`);
  console.log('[mps] Top 10 (combined BIS×MPS):');
  results.slice(0, 10).forEach((r, i) =>
    console.log(`  ${String(i + 1).padStart(2)}. ${r.bank_name.padEnd(32)} BIS=${String(r.bis_score).padStart(3)} MPS=${String(r.mps_total).padStart(3)} Combined=${String(r.combined_score).padStart(3)} — ${r.market.corporate_count_direct} corps (${r.market.addressable_revenue_eur_bn}Bn) [${r.mps_bucket}]`)
  );
  console.log(`\n[mps] Saved → ${OUT_PATH}`);
}

main();
