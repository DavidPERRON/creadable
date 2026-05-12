#!/usr/bin/env node
/**
 * Cross-Reference Enrichment
 *
 * Reads all corporate extractions and aggregates:
 * - Which banks appear across multiple corporates (demand signal)
 * - Which platform providers are mentioned (competitor mapping)
 * - Which sectors show highest SCF activity
 *
 * Output: corporate_scraper/reports/crossref.json
 *         corporate_scraper/reports/crossref.md (human-readable)
 *
 * Run:
 *   node engine/crossref.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT      = path.join(__dirname, '..');
const EXT_DIR   = path.join(ROOT, 'extractions');
const OUT_JSON  = path.join(ROOT, 'reports', 'crossref.json');
const OUT_MD    = path.join(ROOT, 'reports', 'crossref.md');

function main() {
  const files = fs.readdirSync(EXT_DIR).filter(f => f.endsWith('.json'));
  if (!files.length) { console.log('[crossref] No extractions found.'); return; }

  const bankMap     = {};  // bank_name → { count, corporates[], sectors[] }
  const platformMap = {};  // platform → count
  const sectorMap   = {};  // sector → { count, has_scf }

  for (const f of files) {
    let ext;
    try { ext = JSON.parse(fs.readFileSync(path.join(EXT_DIR, f), 'utf8')); }
    catch (e) { continue; }

    const sector = ext.sector || 'Unknown';
    if (!sectorMap[sector]) sectorMap[sector] = { count: 0, scf: 0 };
    sectorMap[sector].count++;
    const hasScf = (ext.supply_chain_finance?.confidence || 'none') !== 'none' ||
                   (ext.factoring?.confidence || 'none') !== 'none';
    if (hasScf) sectorMap[sector].scf++;

    // Banks mentioned
    const banks = ext.banks_mentioned_in_scf_or_trade_finance_context || [];
    for (const b of banks) {
      const name = (b.bank_name || b.name || '').trim();
      if (!name || name.length < 3) continue;
      if (!bankMap[name]) bankMap[name] = { count: 0, corporates: [], sectors: [] };
      bankMap[name].count++;
      bankMap[name].corporates.push(ext.id || f.replace('.json', ''));
      if (!bankMap[name].sectors.includes(sector)) bankMap[name].sectors.push(sector);
    }

    // Platform providers
    const plat = ext.platform_provider_mentioned;
    if (plat?.found && plat.provider_name) {
      const p = plat.provider_name.trim();
      platformMap[p] = (platformMap[p] || 0) + 1;
    }
  }

  // Sort banks by citation count
  const topBanks = Object.entries(bankMap)
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50);

  const topPlatforms = Object.entries(platformMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const sectorStats = Object.entries(sectorMap)
    .map(([sector, d]) => ({ sector, total: d.count, with_scf: d.scf, rate: Math.round(d.scf / d.count * 100) }))
    .sort((a, b) => b.with_scf - a.with_scf);

  const result = {
    generated_at: new Date().toISOString().slice(0, 10),
    corporates_analyzed: files.length,
    top_banks: topBanks,
    top_platforms: topPlatforms,
    sector_scf_rates: sectorStats,
  };

  fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(result, null, 2));

  // Markdown report
  let md = `# Cross-Reference Corporate SCF — ${result.generated_at}\n\n`;
  md += `**${files.length} extractions analysées**\n\n`;

  md += `## Banques les plus citées (demand signal)\n\n`;
  md += `| # | Banque | Citations | Secteurs |\n|---|--------|-----------|----------|\n`;
  topBanks.slice(0, 20).forEach((b, i) => {
    md += `| ${i+1} | **${b.name}** | ${b.count} corporates | ${b.sectors.join(', ')} |\n`;
  });

  md += `\n## Plateformes détectées\n\n`;
  md += `| Plateforme | Citations |\n|------------|----------|\n`;
  topPlatforms.forEach(p => { md += `| ${p.name} | ${p.count} |\n`; });

  md += `\n## Activité SCF par secteur\n\n`;
  md += `| Secteur | Analysés | Avec SCF | Taux |\n|---------|----------|----------|------|\n`;
  sectorStats.forEach(s => { md += `| ${s.sector} | ${s.total} | ${s.with_scf} | ${s.rate}% |\n`; });

  fs.writeFileSync(OUT_MD, md);

  console.log(`[crossref] ${files.length} extractions → ${topBanks.length} banques uniques`);
  console.log(`[crossref] Top 5 banques:`);
  topBanks.slice(0, 5).forEach((b, i) => console.log(`  ${i+1}. ${b.name} — ${b.count} corporates`));
  console.log(`[crossref] Reports: crossref.json + crossref.md`);
}

main();
