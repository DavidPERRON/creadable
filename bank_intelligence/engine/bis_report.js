#!/usr/bin/env node
/**
 * BIS Report Generator — Markdown + HTML dashboard
 *
 * Reads:  reports/bis_scores.json
 * Writes: reports/bis_report.md  (executive summary)
 *         reports/bis_dashboard.html (interactive)
 *
 * Run: node engine/bis_report.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TODAY = new Date('2026-05-10').toISOString().slice(0, 10);
const IN_PATH = path.join(ROOT, 'reports', 'bis_scores.json');
const OUT_MD = path.join(ROOT, 'reports', 'bis_report.md');
const OUT_HTML = path.join(ROOT, 'reports', 'bis_dashboard.html');

if (!fs.existsSync(IN_PATH)) {
  console.error(`[bis_report] ${IN_PATH} not found. Run bis_calculator first.`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(IN_PATH, 'utf8'));
const banks = data.banks || [];

// Distribution
const distribution = banks.reduce((d, b) => ({ ...d, [b.bis.bis_bucket]: (d[b.bis.bis_bucket] || 0) + 1 }), {});
const byCountry = banks.reduce((d, b) => ({ ...d, [b.country]: (d[b.country] || 0) + 1 }), {});

// Top buckets
const high = banks.filter(b => b.bis.bis_bucket === 'HIGH');
const medHigh = banks.filter(b => b.bis.bis_bucket === 'MEDIUM-HIGH');
const med = banks.filter(b => b.bis.bis_bucket === 'MEDIUM');
const top20 = banks.slice(0, 20);

// ──────────────────────────────────────────────────────────────────
// Markdown report
// ──────────────────────────────────────────────────────────────────
const md = `# Buying Intent Score Report — ${TODAY}

> Score probabiliste 0-100 estimant la probabilité qu'une banque achète un produit white-label CredAble dans les 12 mois.

## Distribution

| Bucket | Banques |
|---|---:|
| **HIGH** (70+) | ${distribution.HIGH || 0} |
| **MEDIUM-HIGH** (50-69) | ${distribution['MEDIUM-HIGH'] || 0} |
| **MEDIUM** (30-49) | ${distribution.MEDIUM || 0} |
| **LOW** (15-29) | ${distribution.LOW || 0} |
| **VERY LOW** (<15) | ${distribution['VERY LOW'] || 0} |

## Top 20 cibles par BIS

| # | BIS | Bucket | Banque | Pays | V4 Pri | Friction | Window | Pitch principal |
|---:|---:|---|---|---|---|---|---:|---|
${top20.map((b, i) =>
  `| ${i+1} | **${b.bis.bis_total}** | ${b.bis.bis_bucket} | ${b.bank_name} | ${b.country} | ${b.v4_priority} | ${b.tech_stack?.credable_friction || '?'} | ${b.bis.estimated_window_months}mo | ${(b.bis.pitch_argument || '').slice(0, 100)}... |`
).join('\n')}

## Argument pitch maître — le "Replacement Gap"

**Greensill 2021 → JPMorgan + Taulia 2024-2025 = 3-4 ans de gap.**
Ce délai historique est notre meilleur argument :
- Banque orpheline aujourd'hui (ex: Komerční post-Roger 2025) → si elle attend, elle subira le même 3-4 ans
- CredAble peut déployer en 3-6 mois → différentiel majeur
- À utiliser systématiquement face à toute banque ayant subi une faillite ou rachat de fintech partenaire

## Détail des HIGH-BIS prospects

${[...high, ...medHigh, ...med.slice(0, 10)].map(b => {
  const sb = b.bis.signal_breakdown;
  return `### ${b.bank_name} (${b.country}) — BIS ${b.bis.bis_total}/100 [${b.bis.bis_bucket}]

**Window de tir** : ${b.bis.estimated_window_months} mois
**V4 priority** : ${b.v4_priority} (score ${b.v4_score || '?'})
**Friction CredAble** : ${b.tech_stack?.credable_friction || '?'}
**Tech stack** : ${b.tech_stack?.core_banking || '?'}
${b.tech_stack?.tf_scf_platform ? `**Plateforme TF/SCF actuelle** : ${b.tech_stack.tf_scf_platform}` : '**Pas de plateforme TF/SCF identifiée**'}
${b.tech_stack?.trade_credit_insurer ? `**TCI partner** : ${b.tech_stack.trade_credit_insurer}` : ''}

**Breakdown des 8 signaux** :
| Signal | Score /10 | Poids | Contribution |
|---|---:|---:|---:|
| Capability gap | ${sb.capability_gap.score} | ${sb.capability_gap.weight}% | ${sb.capability_gap.contribution} |
| Strategic intent | ${sb.strategic_intent.score} | ${sb.strategic_intent.weight}% | ${sb.strategic_intent.contribution} |
| Competitor failure | ${sb.competitor_failure.score} | ${sb.competitor_failure.weight}% | ${sb.competitor_failure.contribution}${sb.competitor_failure.event ? ` *(${sb.competitor_failure.event})*` : ''} |
| Peer pressure | ${sb.peer_pressure.score} | ${sb.peer_pressure.weight}% | ${sb.peer_pressure.contribution} |
| Corporate demand | ${sb.corporate_demand.score} | ${sb.corporate_demand.weight}% | ${sb.corporate_demand.contribution} |
| Pre-integration | ${sb.pre_integration.score} | ${sb.pre_integration.weight}% | ${sb.pre_integration.contribution} |
| TCI partnership | ${sb.tci_partnership.score} | ${sb.tci_partnership.weight}% | ${sb.tci_partnership.contribution} |
| Stress signals | ${sb.stress_signals.score} | ${sb.stress_signals.weight}% | ${sb.stress_signals.contribution} |
| **TOTAL** | | | **${b.bis.bis_total}** |

**Pitch argument généré** :
> ${b.bis.pitch_argument}

**Rationnel tech stack** :
> ${b.tech_stack?.rationale || 'Tech stack non documenté.'}

---
`;
}).join('\n')}

## Légende des signaux

| Signal | Source | Logique |
|---|---|---|
| Capability gap | bank_extractor (rapports annuels banques) | Factoring volume +20% sans plateforme = douleur |
| Strategic intent | bank_extractor + V4 triggers | Recrutement / CEO statement / investor day |
| Competitor failure | fintech_failures.json (curé) | Greensill / Roger / we.trade orphans |
| Peer pressure | V4 DB (peers same country) | % de pairs avec SCF avancé |
| Corporate demand | corporate_scraper (rapports corporates) | Banque citée dans contextes WC/TF |
| Pre-integration | bank_techstack.json + bank_extractor | Finastra/Temenos = friction MIN |
| TCI partnership | bank_techstack.json + bank_extractor | Coface/Allianz Trade = match diff CredAble |
| Stress signals | bank_extractor | NPL rising / RWA pressure / Basel III |

---

*Régénérer : \`cd bank_intelligence && node engine/bis_calculator.js && node engine/bis_report.js\`*
`;

fs.writeFileSync(OUT_MD, md);
console.log(`[bis_report] Markdown: ${OUT_MD}`);

// ──────────────────────────────────────────────────────────────────
// HTML dashboard
// ──────────────────────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>CredAble Buying Intent Score — ${TODAY}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    margin: 0; background: #f7f8fa; color: #1a1f36; font-size: 14px; line-height: 1.5;
  }
  header {
    background: linear-gradient(135deg, #6d28d9 0%, #ec4899 100%);
    color: white; padding: 24px 32px;
  }
  header h1 { margin: 0 0 4px; font-size: 26px; font-weight: 700; }
  header .meta { opacity: 0.9; font-size: 13px; }
  nav {
    background: white; border-bottom: 1px solid #e5e7eb; padding: 0 32px;
    display: flex; gap: 0;
  }
  nav button {
    background: none; border: none; padding: 14px 20px;
    cursor: pointer; font-size: 14px; color: #6b7280;
    border-bottom: 3px solid transparent;
  }
  nav button.active {
    color: #6d28d9; border-bottom-color: #ec4899; font-weight: 600;
  }
  main { padding: 24px 32px; max-width: 1500px; margin: 0 auto; }
  .tab { display: none; }
  .tab.active { display: block; }

  .kpi-row {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 16px; margin-bottom: 24px;
  }
  .kpi {
    background: white; padding: 18px; border-radius: 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .kpi.high  { border-left: 4px solid #16a34a; }
  .kpi.medhigh { border-left: 4px solid #2563eb; }
  .kpi.med   { border-left: 4px solid #ea580c; }
  .kpi.low   { border-left: 4px solid #6b7280; }
  .kpi .value { font-size: 32px; font-weight: 700; line-height: 1; }
  .kpi .label { font-size: 12px; color: #6b7280; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.5px; }

  table {
    width: 100%; border-collapse: collapse; background: white;
    border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    margin-bottom: 16px;
  }
  th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #f3f4f6; }
  th { background: #f9fafb; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #4b5563; }
  th.numeric, td.numeric { text-align: right; font-variant-numeric: tabular-nums; }
  tbody tr:hover { background: #f9fafb; }

  .badge { display: inline-block; padding: 3px 9px; border-radius: 5px; font-size: 11px; font-weight: 700; }
  .bis-high     { background: #16a34a; color: white; }
  .bis-medhigh  { background: #2563eb; color: white; }
  .bis-med      { background: #ea580c; color: white; }
  .bis-low      { background: #94a3b8; color: white; }
  .bis-verylow  { background: #d1d5db; color: #4b5563; }

  .friction-low    { background: #dcfce7; color: #166534; }
  .friction-medium { background: #fef3c7; color: #92400e; }
  .friction-high   { background: #fee2e2; color: #991b1b; }

  .pri-p1 { background: #dcfce7; color: #166534; }
  .pri-p2 { background: #dbeafe; color: #1e40af; }
  .pri-p3 { background: #fef3c7; color: #92400e; }
  .pri-p4 { background: #f3f4f6; color: #6b7280; }
  .pri-exclu { background: #fee2e2; color: #991b1b; }
  .pri-new { background: #ede9fe; color: #5b21b6; }

  .signal-bar {
    display: flex; align-items: center; gap: 6px; margin: 4px 0;
  }
  .signal-bar .label { font-size: 11px; color: #6b7280; min-width: 130px; }
  .signal-bar .bar {
    flex: 1; height: 14px; background: #e5e7eb; border-radius: 4px;
    overflow: hidden; position: relative;
  }
  .signal-bar .bar > div { height: 100%; background: linear-gradient(to right, #6d28d9, #ec4899); }
  .signal-bar .num { font-size: 11px; min-width: 30px; text-align: right; font-variant-numeric: tabular-nums; color: #1a1f36; font-weight: 500; }

  details { margin-bottom: 12px; }
  details > summary {
    cursor: pointer; padding: 12px 16px; background: white;
    border-radius: 8px; font-weight: 500;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    list-style: none;
  }
  details > summary::-webkit-details-marker { display: none; }
  details > summary::before { content: '▸ '; margin-right: 6px; }
  details[open] > summary::before { content: '▾ '; }
  details > div { padding: 16px; background: white; margin-top: 4px; border-radius: 8px; }

  .pitch-box {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    padding: 12px 16px; border-radius: 8px; border-left: 4px solid #f59e0b;
    margin: 12px 0; font-size: 13px;
  }
  .pitch-box strong { color: #92400e; }
  .filter-row {
    display: flex; gap: 12px; align-items: center; margin-bottom: 16px;
    background: white; padding: 12px 16px; border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05); flex-wrap: wrap;
  }
  .filter-row input, .filter-row select {
    padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 6px;
    font-size: 13px; font-family: inherit;
  }
  .filter-row input { flex: 1; min-width: 200px; }

  .footer {
    text-align: center; padding: 24px; color: #6b7280; font-size: 12px;
  }
  code { background: #f3f4f6; padding: 1px 6px; border-radius: 4px; font-size: 12px; }
</style>
</head>
<body>
<header>
  <h1>🎯 CredAble Buying Intent Score</h1>
  <div class="meta">Probabilité d'achat 12 mois · ${banks.length} banques scorées · Généré le ${TODAY}</div>
</header>

<nav>
  <button class="tab-btn active" data-tab="summary">📊 Résumé</button>
  <button class="tab-btn" data-tab="ranking">🎯 Ranking BIS</button>
  <button class="tab-btn" data-tab="byangle">📐 Par friction</button>
  <button class="tab-btn" data-tab="pitch">💬 Pitch master</button>
  <button class="tab-btn" data-tab="weights">⚖️ Pondération</button>
</nav>

<main>
  <section id="tab-summary" class="tab active">
    <div class="kpi-row">
      <div class="kpi high"><div class="value">${distribution.HIGH || 0}</div><div class="label">HIGH (70+)</div></div>
      <div class="kpi medhigh"><div class="value">${distribution['MEDIUM-HIGH'] || 0}</div><div class="label">Med-High (50-69)</div></div>
      <div class="kpi med"><div class="value">${distribution.MEDIUM || 0}</div><div class="label">Medium (30-49)</div></div>
      <div class="kpi low"><div class="value">${distribution.LOW || 0}</div><div class="label">Low (15-29)</div></div>
      <div class="kpi"><div class="value">${distribution['VERY LOW'] || 0}</div><div class="label">Very Low (<15)</div></div>
    </div>
    <h2>🥇 Top 10 cibles par BIS</h2>
    <div id="top10"></div>
    <h2>🌍 Banques par pays (BIS ≥ 30)</h2>
    <div id="bycountry"></div>
  </section>

  <section id="tab-ranking" class="tab">
    <div class="filter-row">
      <input id="filter-text" placeholder="🔍 Filtrer par banque ou pays..." />
      <select id="filter-bucket">
        <option value="">Tous buckets BIS</option>
        <option value="HIGH">HIGH</option>
        <option value="MEDIUM-HIGH">MEDIUM-HIGH</option>
        <option value="MEDIUM">MEDIUM</option>
        <option value="LOW">LOW</option>
      </select>
      <select id="filter-friction">
        <option value="">Toutes frictions</option>
        <option value="low">Friction LOW</option>
        <option value="medium">Friction MEDIUM</option>
        <option value="high">Friction HIGH</option>
      </select>
    </div>
    <div id="ranking-list"></div>
  </section>

  <section id="tab-byangle" class="tab">
    <div id="byfriction-detail"></div>
  </section>

  <section id="tab-pitch" class="tab">
    <h2>💬 Master Pitch — The Replacement Gap</h2>
    <div class="pitch-box">
      <p><strong>Argument central :</strong> When a fintech partner fails, banks live with a 3-4 year gap before a successor enters.</p>
      <ul>
        <li>Greensill (2021) → JPMorgan + Taulia (2024-2025) = <strong>4 ans de gap</strong></li>
        <li>Roger (2025) → ??? (Komerční banka actuellement orpheline)</li>
        <li>we.trade (2022) → KBC, ČSOB, K&H toujours en transition</li>
      </ul>
      <p><strong>Différentiel CredAble :</strong> déploiement en 3-6 mois vs 3-4 ans de gap par défaut.</p>
    </div>
    <h2>Pitch arguments générés par banque (top 15)</h2>
    <div id="pitch-list"></div>
  </section>

  <section id="tab-weights" class="tab">
    <h2>⚖️ Pondération du Buying Intent Score</h2>
    <table>
      <tr><th>Signal</th><th>Source</th><th class="numeric">Poids</th></tr>
      <tr><td>Capability gap révélé</td><td>bank_extractor (rapports annuels banques)</td><td class="numeric">20%</td></tr>
      <tr><td>Strategic intent récent</td><td>bank_extractor + V4 triggers</td><td class="numeric">15%</td></tr>
      <tr><td>Competitor failure / orphelinat</td><td>fintech_failures.json (curé)</td><td class="numeric">20%</td></tr>
      <tr><td>Peer pressure</td><td>V4 DB peers</td><td class="numeric">10%</td></tr>
      <tr><td>Corporate demand revealed</td><td>corporate_scraper</td><td class="numeric">10%</td></tr>
      <tr><td>Pre-integration fit</td><td>bank_techstack (manual) + auto-detect</td><td class="numeric">15%</td></tr>
      <tr><td>TCI partnership</td><td>bank_techstack + extractor</td><td class="numeric">5%</td></tr>
      <tr><td>Stress signals (NPL/RWA)</td><td>bank_extractor</td><td class="numeric">5%</td></tr>
      <tr><th>Total</th><th></th><th class="numeric">100%</th></tr>
    </table>
    <h2>Buckets BIS</h2>
    <table>
      <tr><th>Bucket</th><th>Score</th><th>Action</th></tr>
      <tr><td><span class="badge bis-high">HIGH</span></td><td>70+</td><td>Pursue NOW (window 6mo)</td></tr>
      <tr><td><span class="badge bis-medhigh">MEDIUM-HIGH</span></td><td>50-69</td><td>Active prospecting (window 6-12mo)</td></tr>
      <tr><td><span class="badge bis-med">MEDIUM</span></td><td>30-49</td><td>Qualified pipeline (window 12-18mo)</td></tr>
      <tr><td><span class="badge bis-low">LOW</span></td><td>15-29</td><td>Watchlist (review quarterly)</td></tr>
      <tr><td><span class="badge bis-verylow">VERY LOW</span></td><td>&lt;15</td><td>Not currently addressable</td></tr>
    </table>
  </section>
</main>

<div class="footer">
  Données : <code>reports/bis_scores.json</code> · Régénérer : <code>node engine/bis_calculator.js && node engine/bis_report.js</code>
</div>

<script>
const DATA = ${JSON.stringify({ banks }, null, 0)};

// Tab switching
document.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.tab-btn').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  document.getElementById('tab-' + b.dataset.tab).classList.add('active');
}));

function bucketBadge(b) {
  const cls = { 'HIGH':'bis-high','MEDIUM-HIGH':'bis-medhigh','MEDIUM':'bis-med','LOW':'bis-low','VERY LOW':'bis-verylow' }[b] || 'bis-low';
  return \`<span class="badge \${cls}">\${b}</span>\`;
}
function frictionBadge(f) {
  const cls = { 'low':'friction-low','medium':'friction-medium','high':'friction-high' }[f] || 'friction-medium';
  return \`<span class="badge \${cls}">\${f || '?'}</span>\`;
}
function priBadge(p) {
  const cls = { 'P1':'pri-p1','P2':'pri-p2','P3':'pri-p3','P4':'pri-p4','EXCLU':'pri-exclu','NEW':'pri-new' }[p] || 'pri-p4';
  return \`<span class="badge \${cls}">\${p || '?'}</span>\`;
}
function signalBars(sb) {
  const labels = {
    capability_gap: 'Capability gap',
    strategic_intent: 'Strategic intent',
    competitor_failure: 'Competitor failure',
    peer_pressure: 'Peer pressure',
    corporate_demand: 'Corporate demand',
    pre_integration: 'Pre-integration',
    tci_partnership: 'TCI partnership',
    stress_signals: 'Stress signals',
  };
  return Object.entries(sb).map(([k, v]) => \`
    <div class="signal-bar">
      <span class="label">\${labels[k]} (\${v.weight}%)</span>
      <div class="bar"><div style="width: \${v.score * 10}%"></div></div>
      <span class="num">\${v.score}/10</span>
    </div>\`).join('');
}

function renderTop10() {
  let html = '<table><thead><tr><th>#</th><th>Banque</th><th>Pays</th><th class="numeric">BIS</th><th>Bucket</th><th>V4</th><th>Friction</th><th class="numeric">Window</th></tr></thead><tbody>';
  DATA.banks.slice(0, 10).forEach((b, i) => {
    html += \`<tr>
      <td>\${i+1}</td>
      <td><strong>\${b.bank_name}</strong></td>
      <td>\${b.country}</td>
      <td class="numeric"><strong>\${b.bis.bis_total}</strong></td>
      <td>\${bucketBadge(b.bis.bis_bucket)}</td>
      <td>\${priBadge(b.v4_priority)}</td>
      <td>\${frictionBadge(b.tech_stack?.credable_friction)}</td>
      <td class="numeric">\${b.bis.estimated_window_months}mo</td>
    </tr>\`;
  });
  html += '</tbody></table>';
  document.getElementById('top10').innerHTML = html;
}

function renderByCountry() {
  const map = {};
  DATA.banks.filter(b => b.bis.bis_total >= 30).forEach(b => {
    if (!map[b.country]) map[b.country] = [];
    map[b.country].push(b);
  });
  const sorted = Object.entries(map).sort((a,b) => b[1].length - a[1].length);
  let html = '<div class="kpi-row">';
  sorted.forEach(([c, banks]) => {
    const top = banks.sort((a,b) => b.bis.bis_total - a.bis.bis_total)[0];
    html += \`<div class="kpi"><div class="value">\${banks.length}</div><div class="label">\${c}</div><div style="font-size: 11px; color: #6b7280; margin-top: 4px;">Top: \${top.bank_name} (\${top.bis.bis_total})</div></div>\`;
  });
  html += '</div>';
  document.getElementById('bycountry').innerHTML = html;
}

function renderRanking() {
  const text = document.getElementById('filter-text').value.toLowerCase();
  const bucket = document.getElementById('filter-bucket').value;
  const friction = document.getElementById('filter-friction').value;

  const filtered = DATA.banks.filter(b => {
    if (text && !\`\${b.bank_name} \${b.country}\`.toLowerCase().includes(text)) return false;
    if (bucket && b.bis.bis_bucket !== bucket) return false;
    if (friction && b.tech_stack?.credable_friction !== friction) return false;
    return true;
  });

  let html = \`<div style="margin-bottom: 12px; color: #6b7280; font-size: 12px;">\${filtered.length} résultat(s)</div>\`;
  filtered.forEach(b => {
    const ts = b.tech_stack || {};
    html += \`<details>
      <summary>
        <strong>\${b.bank_name}</strong> (\${b.country}) · BIS <strong>\${b.bis.bis_total}</strong>/100 ·
        \${bucketBadge(b.bis.bis_bucket)} ·
        \${priBadge(b.v4_priority)} ·
        \${frictionBadge(ts.credable_friction)} ·
        Window \${b.bis.estimated_window_months}mo
      </summary>
      <div>
        <div class="pitch-box">
          <strong>💬 Pitch :</strong> \${b.bis.pitch_argument}
        </div>
        <h4>8-signal breakdown</h4>
        \${signalBars(b.bis.signal_breakdown)}
        <h4>Tech stack & rationnel</h4>
        <table>
          <tr><td>Core banking</td><td>\${ts.core_banking || '?'}</td></tr>
          <tr><td>TF/SCF platform</td><td>\${ts.tf_scf_platform || '<em>aucune</em>'}</td></tr>
          <tr><td>TCI partner</td><td>\${ts.trade_credit_insurer || '<em>none</em>'}</td></tr>
          <tr><td>Friction</td><td>\${frictionBadge(ts.credable_friction)}</td></tr>
        </table>
        <p style="font-size: 12px; color: #4b5563; font-style: italic;">\${ts.rationale || ''}</p>
      </div>
    </details>\`;
  });
  document.getElementById('ranking-list').innerHTML = html;
}

['filter-text', 'filter-bucket', 'filter-friction'].forEach(id =>
  document.getElementById(id).addEventListener('input', renderRanking)
);

function renderByFriction() {
  const groups = { low: [], medium: [], high: [], unknown: [] };
  DATA.banks.forEach(b => {
    const f = b.tech_stack?.credable_friction || 'unknown';
    groups[f] = groups[f] || [];
    groups[f].push(b);
  });
  let html = '';
  ['low', 'medium', 'high', 'unknown'].forEach(f => {
    const banks = (groups[f] || []).sort((a,b) => b.bis.bis_total - a.bis.bis_total);
    if (banks.length === 0) return;
    const fLabel = { low: '★ LOW (Finastra/Temenos pré-intégré)', medium: 'MEDIUM', high: 'HIGH (G-SIB / proprietary cores)', unknown: 'Unknown' }[f];
    html += \`<h2>\${fLabel} — \${banks.length} banques</h2>\`;
    html += '<table><thead><tr><th>Banque</th><th>Pays</th><th class="numeric">BIS</th><th>Bucket</th><th>V4 Pri</th><th>Tech stack</th></tr></thead><tbody>';
    banks.forEach(b => {
      html += \`<tr>
        <td><strong>\${b.bank_name}</strong></td>
        <td>\${b.country}</td>
        <td class="numeric"><strong>\${b.bis.bis_total}</strong></td>
        <td>\${bucketBadge(b.bis.bis_bucket)}</td>
        <td>\${priBadge(b.v4_priority)}</td>
        <td style="font-size: 12px; color: #6b7280;">\${b.tech_stack?.core_banking || '?'}</td>
      </tr>\`;
    });
    html += '</tbody></table>';
  });
  document.getElementById('byfriction-detail').innerHTML = html;
}

function renderPitches() {
  let html = '';
  DATA.banks.slice(0, 15).forEach(b => {
    html += \`<details>
      <summary>
        <strong>\${b.bank_name}</strong> (\${b.country}) · BIS \${b.bis.bis_total} · \${bucketBadge(b.bis.bis_bucket)}
      </summary>
      <div>
        <div class="pitch-box">\${b.bis.pitch_argument}</div>
      </div>
    </details>\`;
  });
  document.getElementById('pitch-list').innerHTML = html;
}

renderTop10();
renderByCountry();
renderRanking();
renderByFriction();
renderPitches();
</script>
</body>
</html>`;

fs.writeFileSync(OUT_HTML, html);
console.log(`[bis_report] HTML: ${OUT_HTML}`);
console.log(`[bis_report] Open with: open ${OUT_HTML}`);
