#!/usr/bin/env node
/**
 * Concise Summary Generator — 1-page executive summary
 *
 * Run: node engine/summary.js
 * Reads:  reports/bank_evidence.json (produced by aggregator.js)
 * Writes: reports/summary.md
 *
 * Format: une seule page, listes courtes, action items en clair.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const IN_PATH = path.join(ROOT, 'reports', 'bank_evidence.json');
const OUT_PATH = path.join(ROOT, 'reports', 'summary.md');
const TODAY = new Date('2026-05-10').toISOString().slice(0, 10);

if (!fs.existsSync(IN_PATH)) {
  console.error(`[summary] ${IN_PATH} not found. Run aggregator first.`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(IN_PATH, 'utf8'));
const sweetSpots = data.sweet_spots || [];
const programStats = data.program_stats || {};

const angleLabel = {
  saas_licence: 'SaaS/Licence',
  classic_scf: 'Classic SCF',
  receivables_finance: 'Receivables',
  flash_title_inventory: 'Flash title',
};

// Distribution by angle
const byAngle = {};
sweetSpots.forEach(s => {
  const a = s.credable.recommended_primary_angle;
  byAngle[a] = (byAngle[a] || 0) + 1;
});

// Distribution by country
const byCountry = {};
sweetSpots.forEach(s => {
  byCountry[s.bank.country] = (byCountry[s.bank.country] || 0) + 1;
});
const topCountries = Object.entries(byCountry).sort((a, b) => b[1] - a[1]).slice(0, 8);

// Top 10 sweet-spots
const top10 = sweetSpots.slice(0, 10);

const md = `# Executive Summary — ${TODAY}

## 🎯 Headline

**${sweetSpots.length} banques sweet-spot identifiées** sur ${data.matched_count + data.unmatched_count} banques distinctes mentionnées dans les rapports annuels corporates analysés.

## 🏆 Top 10 cibles prioritaires

| # | Banque | Pays | V4 Pri | Angle reco | Score angle | Total fit /40 |
|---|---|---|---|---|---:|---:|
${top10.map((s, i) =>
  `| ${i+1} | **${s.bank.name}** | ${s.bank.country} | ${s.bank.priority || '?'} | **${angleLabel[s.credable.recommended_primary_angle]}** | ${s.credable.recommended_primary_score}/10 | ${s.credable.total_credable_fit} |`
).join('\n')}

## 📊 Répartition des sweet-spots par angle de vente CredAble

${Object.entries(byAngle).sort((a,b) => b[1]-a[1]).map(([a, n]) =>
  `- **${angleLabel[a]}** : ${n} banques`
).join('\n')}

## 🌍 Top pays par concentration de sweet-spots

${topCountries.map(([c, n]) => `- **${c}** : ${n} banques`).join('\n')}

## 🔍 Univers analysé (rapports corporates)

| Catégorie produit | # corporates avec mention |
|---|---:|
| Payables (reverse factoring, confirming, dynamic discounting) | ${programStats.payables || 0} |
| Receivables (factoring, sale of receivables, securitization) | ${programStats.receivables || 0} |
| Documentary trade (LCs, guarantees, forfaiting) | ${programStats.documentary || 0} |
| Title / inventory (consignment, TradeCo, raw material) | ${programStats.inventory || 0} |
| Working capital générique (revolving, overdraft) | ${programStats.working_capital || 0} |

## ✅ Actions recommandées

${top10.slice(0, 3).map((s, i) => `${i+1}. **${s.bank.name}** (${s.bank.country}) — pitch angle **${angleLabel[s.credable.recommended_primary_angle]}**. ${s.credable.angles[s.credable.recommended_primary_angle].reasoning}`).join('\n')}

## 🆕 Banques nouvelles à évaluer

**${data.unmatched_count}** banques mentionnées par des corporates sont absentes de ta DB de prospection. Détail dans \`reports/new_banks_proposed.json\` et section 4 du rapport long.

---

📄 **Rapport complet** : \`reports/bank_evidence.md\`
🔬 **Méthodologie / sources** : \`reports/methodology.md\`
📊 **Dashboard interactif** : \`reports/dashboard.html\` (double-clic pour ouvrir)
`;

fs.writeFileSync(OUT_PATH, md);
console.log(`[summary] Generated: ${OUT_PATH}`);
console.log(`[summary] ${sweetSpots.length} sweet-spots, top: ${top10.slice(0,3).map(s => s.bank.name).join(', ')}`);
