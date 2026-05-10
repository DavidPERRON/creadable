#!/usr/bin/env node
/**
 * HTML Dashboard Generator — un seul fichier, autonome
 *
 * Génère reports/dashboard.html : un fichier HTML complet et autonome
 *   - CSS et JS inline (pas de CDN, marche offline)
 *   - Données embedded comme JSON (pas de fetch)
 *   - Double-clic dans le Finder Mac → s'ouvre dans le navigateur par défaut
 *
 * Run: node engine/dashboard.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const IN_PATH = path.join(ROOT, 'reports', 'bank_evidence.json');
const OUT_PATH = path.join(ROOT, 'reports', 'dashboard.html');
const TODAY = new Date('2026-05-10').toISOString().slice(0, 10);

if (!fs.existsSync(IN_PATH)) {
  console.error(`[dashboard] ${IN_PATH} not found. Run aggregator first.`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(IN_PATH, 'utf8'));

// Embed sweet-spots and unmatched in the HTML for client-side filtering
const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>CredAble Sweet-Spot Dashboard — ${TODAY}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    margin: 0; padding: 0;
    background: #f7f8fa; color: #1a1f36;
    font-size: 14px; line-height: 1.5;
  }
  header {
    background: linear-gradient(135deg, #1e3a8a 0%, #6366f1 100%);
    color: white; padding: 24px 32px;
  }
  header h1 { margin: 0 0 4px; font-size: 24px; font-weight: 600; }
  header .meta { opacity: 0.85; font-size: 13px; }
  nav {
    background: white; border-bottom: 1px solid #e5e7eb;
    padding: 0 32px; display: flex; gap: 0;
  }
  nav button {
    background: none; border: none; padding: 14px 20px;
    cursor: pointer; font-size: 14px; color: #6b7280;
    border-bottom: 3px solid transparent;
    transition: all 0.15s;
  }
  nav button:hover { color: #1e3a8a; }
  nav button.active {
    color: #1e3a8a; border-bottom-color: #6366f1;
    font-weight: 600;
  }
  main { padding: 24px 32px; max-width: 1400px; margin: 0 auto; }
  .tab { display: none; }
  .tab.active { display: block; }
  .kpi-row {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px; margin-bottom: 24px;
  }
  .kpi {
    background: white; padding: 18px; border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  }
  .kpi .value { font-size: 28px; font-weight: 700; color: #1e3a8a; line-height: 1; }
  .kpi .label { font-size: 12px; color: #6b7280; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
  table {
    width: 100%; border-collapse: collapse;
    background: white; border-radius: 8px; overflow: hidden;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04); margin-bottom: 16px;
  }
  th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #f3f4f6; }
  th {
    background: #f9fafb; font-weight: 600; color: #4b5563;
    font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;
    cursor: pointer; user-select: none;
  }
  th:hover { background: #f3f4f6; }
  th.numeric, td.numeric { text-align: right; font-variant-numeric: tabular-nums; }
  tbody tr:hover { background: #f9fafb; }
  .badge {
    display: inline-block; padding: 2px 8px; border-radius: 4px;
    font-size: 11px; font-weight: 600;
  }
  .badge-p1 { background: #dcfce7; color: #166534; }
  .badge-p2 { background: #dbeafe; color: #1e40af; }
  .badge-p3 { background: #fef3c7; color: #92400e; }
  .badge-p4 { background: #f3f4f6; color: #6b7280; }
  .badge-exclu { background: #fee2e2; color: #991b1b; }

  .angle-saas_licence          { background: #ddd6fe; color: #5b21b6; }
  .angle-classic_scf           { background: #bfdbfe; color: #1e40af; }
  .angle-receivables_finance   { background: #fed7aa; color: #9a3412; }
  .angle-flash_title_inventory { background: #fecdd3; color: #9f1239; }

  .score-bar {
    display: inline-block; width: 60px; height: 6px;
    background: #e5e7eb; border-radius: 3px; overflow: hidden;
    vertical-align: middle; margin-right: 6px;
  }
  .score-bar > div { height: 100%; background: #6366f1; }

  .filter-row {
    display: flex; gap: 12px; align-items: center; margin-bottom: 16px;
    background: white; padding: 12px 16px; border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  }
  .filter-row input, .filter-row select {
    padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 6px;
    font-size: 13px; font-family: inherit;
  }
  .filter-row input { flex: 1; min-width: 200px; }

  details { margin-bottom: 12px; }
  details > summary {
    cursor: pointer; padding: 12px 16px; background: white;
    border-radius: 8px; font-weight: 500;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  }
  details > div { padding: 16px; background: white; margin-top: 4px; border-radius: 8px; }
  blockquote {
    border-left: 3px solid #6366f1; margin: 8px 0; padding: 4px 12px;
    color: #4b5563; font-style: italic; background: #f9fafb;
  }
  .source-card {
    background: white; padding: 16px; border-radius: 8px; margin-bottom: 12px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    border-left: 4px solid #6366f1;
  }
  .source-card.included { border-left-color: #16a34a; }
  .source-card.excluded { border-left-color: #dc2626; }
  .source-card h3 { margin: 0 0 8px; font-size: 15px; }
  .footer {
    text-align: center; padding: 24px;
    color: #6b7280; font-size: 12px;
  }
  code {
    background: #f3f4f6; padding: 1px 6px; border-radius: 4px;
    font-size: 12px; font-family: 'SF Mono', Monaco, monospace;
  }
</style>
</head>
<body>
<header>
  <h1>CredAble Sweet-Spot Dashboard</h1>
  <div class="meta">Généré le ${TODAY} · ${data.sweet_spots?.length || 0} sweet-spots · ${data.matched_count + data.unmatched_count} banques distinctes</div>
</header>

<nav>
  <button class="tab-btn active" data-tab="summary">📊 Résumé</button>
  <button class="tab-btn" data-tab="sweetspots">🎯 Sweet-spots</button>
  <button class="tab-btn" data-tab="newbanks">🆕 Banques nouvelles</button>
  <button class="tab-btn" data-tab="byangle">📐 Par angle</button>
  <button class="tab-btn" data-tab="methodology">🔬 Méthodologie</button>
</nav>

<main>
  <!-- TAB: SUMMARY -->
  <section id="tab-summary" class="tab active">
    <div class="kpi-row">
      <div class="kpi"><div class="value">${data.sweet_spots?.length || 0}</div><div class="label">Sweet-spots</div></div>
      <div class="kpi"><div class="value">${data.matched_count}</div><div class="label">Banques DB matched</div></div>
      <div class="kpi"><div class="value">${data.unmatched_count}</div><div class="label">Banques nouvelles</div></div>
      <div class="kpi"><div class="value">${data.program_stats?.payables || 0}</div><div class="label">Corp. payables</div></div>
      <div class="kpi"><div class="value">${data.program_stats?.receivables || 0}</div><div class="label">Corp. receivables</div></div>
      <div class="kpi"><div class="value">${data.program_stats?.documentary || 0}</div><div class="label">Corp. documentary</div></div>
      <div class="kpi"><div class="value">${data.program_stats?.inventory || 0}</div><div class="label">Corp. inventory</div></div>
    </div>

    <h2>🏆 Top 10 cibles</h2>
    <div id="top10"></div>

    <h2>📐 Répartition par angle CredAble</h2>
    <div id="byangle-summary"></div>

    <h2>🌍 Concentration géographique</h2>
    <div id="bycountry"></div>
  </section>

  <!-- TAB: SWEETSPOTS -->
  <section id="tab-sweetspots" class="tab">
    <div class="filter-row">
      <input id="filter-text" placeholder="🔍 Filtrer par nom de banque ou pays..." />
      <select id="filter-angle">
        <option value="">Tous les angles</option>
        <option value="saas_licence">SaaS / Licence</option>
        <option value="classic_scf">Classic SCF</option>
        <option value="receivables_finance">Receivables Finance</option>
        <option value="flash_title_inventory">Flash Title / Inventory</option>
      </select>
      <select id="filter-priority">
        <option value="">Toutes priorités V4</option>
        <option value="P1">P1</option>
        <option value="P2">P2</option>
        <option value="P3">P3</option>
        <option value="P4">P4</option>
      </select>
    </div>
    <div id="sweetspots-table"></div>
  </section>

  <!-- TAB: NEW BANKS -->
  <section id="tab-newbanks" class="tab">
    <h2>🆕 Banques mentionnées par corporates mais absentes de la DB de prospection</h2>
    <p>À évaluer manuellement avant ajout à <code>prospection/data/banks.json</code>.</p>
    <div id="newbanks-table"></div>
  </section>

  <!-- TAB: BY ANGLE -->
  <section id="tab-byangle" class="tab">
    <div id="byangle-detail"></div>
  </section>

  <!-- TAB: METHODOLOGY -->
  <section id="tab-methodology" class="tab">
    <h2>🔬 Sources utilisées par le modèle DeepInfra</h2>

    <div class="source-card included">
      <h3>✅ Sources fournies au modèle (Llama-3.3-70B)</h3>
      <p><strong>Uniquement</strong> des extraits filtrés de rapports annuels corporates (PDF → texte → chunks par mots-clés).</p>
      <ul>
        <li>Source : sites Investor Relations officiels des corporates listés dans <code>catalog.json</code></li>
        <li>Format : texte filtré par ~120 mots-clés multilingues (working capital, factoring, supplier finance, letter of credit, inventory, cession de créances, Akkreditiv, etc.)</li>
        <li>Volume : ~25K tokens par corporate (vs ~500K tokens dans le PDF complet)</li>
        <li>Modèle : Llama-3.3-70B via DeepInfra, température 0.0 (déterministe)</li>
      </ul>
    </div>

    <div class="source-card excluded">
      <h3>❌ Sources INTERDITES au modèle</h3>
      <p>Le prompt système contient cette consigne stricte :</p>
      <blockquote>"Only extract what is EXPLICITLY stated in the text. Never infer, assume, or hallucinate. Always provide the verbatim quote."</blockquote>
      <ul>
        <li>Pas d'accès web (DeepInfra n'expose pas cette capacité)</li>
        <li>Pas de training data (interdit par consigne)</li>
        <li>Pas de cross-reference entre corporates (chaque appel isolé)</li>
        <li>Pas d'autres rapports / press / news</li>
      </ul>
      <p><strong>Garde-fou</strong> : chaque "fait" extrait est accompagné d'un <code>verbatim</code>. Tu peux vérifier en cherchant la phrase exacte dans <code>text/&lt;corp&gt;.txt</code>.</p>
    </div>

    <div class="source-card">
      <h3>ℹ️ Sources externes utilisées par d'AUTRES modules (PAS par DeepInfra)</h3>
      <p>L'écosystème complet utilise plusieurs sources, mais aucune n'est fournie au modèle pour l'extraction des rapports annuels :</p>
      <ul>
        <li><strong>prospection/</strong> : Aequitas Consultus, Allianz Trade Atlas 2026, Marsh PRR 2026, UN Comtrade, FCI</li>
        <li><strong>prospection/trigger_engine/</strong> : RSS GTR, TFG, TXF, BAFT, FCI, EBRD, EIB, IFC</li>
        <li><strong>scraper/</strong> : sites bancaires, salles de presse, recherches GTR/TFG/TXF</li>
        <li><strong>corporate_scraper/</strong> (CE module) : <strong>uniquement</strong> les rapports annuels corporates filtrés</li>
      </ul>
    </div>

    <div class="source-card">
      <h3>📊 Statistiques du run</h3>
      <p>Voir <code>reports/methodology.md</code> pour les chiffres précis (corporates analysés, tokens consommés, coverage gap).</p>
    </div>

    <div class="source-card">
      <h3>⚠️ Limitations honnêtes</h3>
      <ul>
        <li>LLM peut halluciner malgré la consigne → vérification possible via grep</li>
        <li>Pré-filtre keywords pas exhaustif → liste extensible</li>
        <li>PDFs scannés non extraits (OCR à ajouter)</li>
        <li>Anti-bot sur certains sites IR → workflow manuel possible</li>
        <li>Corporates privés (Bosch, Ferrero) hors périmètre</li>
        <li>Couverture multi-langue partielle pour HU/RO/CZ/PL</li>
      </ul>
    </div>
  </section>
</main>

<div class="footer">
  Données : <code>reports/bank_evidence.json</code> · Régénérer : <code>cd corporate_scraper &amp;&amp; ./go.sh</code>
</div>

<script>
const DATA = ${JSON.stringify({
  sweet_spots: data.sweet_spots || [],
  unmatched: Object.entries(data.full_bank_map || {})
    .filter(([k, info]) => !data.sweet_spots?.some(s => s.bank.name && s.bank.name.toLowerCase().includes(info.canonical_name.toLowerCase().split(' ')[0])))
    .map(([k, info]) => ({ key: k, ...info })),
  program_stats: data.program_stats || {},
  matched_count: data.matched_count,
  unmatched_count: data.unmatched_count,
  generated_at: data.generated_at,
}, null, 0)};

const ANGLE_LABEL = {
  saas_licence: 'SaaS / Licence',
  classic_scf: 'Classic SCF',
  receivables_finance: 'Receivables',
  flash_title_inventory: 'Flash title',
};

// ─────── Tab switching ───────
document.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', e => {
  document.querySelectorAll('.tab-btn').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  document.getElementById('tab-' + b.dataset.tab).classList.add('active');
}));

// ─────── Helpers ───────
function angleBadge(a) {
  return \`<span class="badge angle-\${a}">\${ANGLE_LABEL[a] || a}</span>\`;
}
function priBadge(p) {
  return \`<span class="badge badge-\${(p || 'p4').toLowerCase()}">\${p || '?'}</span>\`;
}
function scoreBar(score, max) {
  const pct = Math.round(score / max * 100);
  return \`<span class="score-bar"><div style="width: \${pct}%"></div></span><span style="font-variant-numeric: tabular-nums">\${score}/\${max}</span>\`;
}

// ─────── TAB: Summary ───────
function renderSummary() {
  const top = DATA.sweet_spots.slice(0, 10);
  let html = '<table><thead><tr><th>#</th><th>Banque</th><th>Pays</th><th>V4 Pri</th><th>Angle reco</th><th class="numeric">Score angle</th><th class="numeric">Total fit</th></tr></thead><tbody>';
  top.forEach((s, i) => {
    html += \`<tr>
      <td>\${i+1}</td>
      <td><strong>\${s.bank.name}</strong></td>
      <td>\${s.bank.country}</td>
      <td>\${priBadge(s.bank.priority)}</td>
      <td>\${angleBadge(s.credable.recommended_primary_angle)}</td>
      <td class="numeric">\${scoreBar(s.credable.recommended_primary_score, 10)}</td>
      <td class="numeric">\${s.credable.total_credable_fit}/40</td>
    </tr>\`;
  });
  html += '</tbody></table>';
  document.getElementById('top10').innerHTML = html;

  // by angle
  const byAngle = {};
  DATA.sweet_spots.forEach(s => {
    const a = s.credable.recommended_primary_angle;
    byAngle[a] = (byAngle[a] || 0) + 1;
  });
  let angHtml = '<div class="kpi-row">';
  Object.entries(byAngle).sort((a,b) => b[1]-a[1]).forEach(([a, n]) => {
    angHtml += \`<div class="kpi"><div class="value">\${n}</div><div class="label">\${ANGLE_LABEL[a]}</div></div>\`;
  });
  angHtml += '</div>';
  document.getElementById('byangle-summary').innerHTML = angHtml;

  // by country
  const byCountry = {};
  DATA.sweet_spots.forEach(s => byCountry[s.bank.country] = (byCountry[s.bank.country] || 0) + 1);
  let cHtml = '<div class="kpi-row">';
  Object.entries(byCountry).sort((a,b) => b[1]-a[1]).slice(0, 8).forEach(([c, n]) => {
    cHtml += \`<div class="kpi"><div class="value">\${n}</div><div class="label">\${c}</div></div>\`;
  });
  cHtml += '</div>';
  document.getElementById('bycountry').innerHTML = cHtml;
}

// ─────── TAB: Sweet-spots (filterable) ───────
function renderSweetspots() {
  const text = document.getElementById('filter-text').value.toLowerCase();
  const angle = document.getElementById('filter-angle').value;
  const priority = document.getElementById('filter-priority').value;

  const filtered = DATA.sweet_spots.filter(s => {
    if (text && !(\`\${s.bank.name} \${s.bank.country}\`.toLowerCase().includes(text))) return false;
    if (angle && s.credable.recommended_primary_angle !== angle) return false;
    if (priority && s.bank.priority !== priority) return false;
    return true;
  });

  let html = \`<div style="margin-bottom: 12px; color: #6b7280; font-size: 12px;">\${filtered.length} résultat(s)</div>\`;
  filtered.forEach(s => {
    const a = s.credable.angles;
    html += \`<details>
      <summary>
        <strong>\${s.bank.name}</strong> (\${s.bank.country}) ·
        \${priBadge(s.bank.priority)} ·
        \${angleBadge(s.credable.recommended_primary_angle)} ·
        Total fit \${s.credable.total_credable_fit}/40 ·
        \${s.evidence_count} mention(s)
      </summary>
      <div>
        <h4>4-angle scoring</h4>
        <table>
          <tr><td>SaaS / Licence</td><td class="numeric">\${scoreBar(a.saas_licence.score, 10)}</td><td>\${a.saas_licence.reasoning}</td></tr>
          <tr><td>Classic SCF</td><td class="numeric">\${scoreBar(a.classic_scf.score, 10)}</td><td>\${a.classic_scf.reasoning}</td></tr>
          <tr><td>Receivables</td><td class="numeric">\${scoreBar(a.receivables_finance.score, 10)}</td><td>\${a.receivables_finance.reasoning}</td></tr>
          <tr><td>Flash title</td><td class="numeric">\${scoreBar(a.flash_title_inventory.score, 10)}</td><td>\${a.flash_title_inventory.reasoning}</td></tr>
        </table>
        <h4>Catégories produits & secteurs</h4>
        <p>Catégories : \${(s.product_categories || []).join(', ') || '-'} · Secteurs : \${(s.sectors_served || []).join(', ') || '-'}</p>
      </div>
    </details>\`;
  });
  document.getElementById('sweetspots-table').innerHTML = html;
}

['filter-text', 'filter-angle', 'filter-priority'].forEach(id =>
  document.getElementById(id).addEventListener('input', renderSweetspots)
);

// ─────── TAB: New banks ───────
function renderNewBanks() {
  let html = '<table><thead><tr><th>Banque</th><th>Pays</th><th class="numeric"># mentions</th><th>Corporates citants</th></tr></thead><tbody>';
  DATA.unmatched.slice(0, 50).forEach(u => {
    const corps = [...new Set((u.evidence || []).map(e => e.corporate))].join(', ');
    html += \`<tr>
      <td><strong>\${u.canonical_name}</strong></td>
      <td>\${u.inferred_country || '?'}</td>
      <td class="numeric">\${(u.evidence || []).length}</td>
      <td>\${corps || '-'}</td>
    </tr>\`;
  });
  html += '</tbody></table>';
  document.getElementById('newbanks-table').innerHTML = html;
}

// ─────── TAB: By angle ───────
function renderByAngle() {
  const groups = {};
  DATA.sweet_spots.forEach(s => {
    const a = s.credable.recommended_primary_angle;
    if (!groups[a]) groups[a] = [];
    groups[a].push(s);
  });

  let html = '';
  ['saas_licence', 'classic_scf', 'receivables_finance', 'flash_title_inventory'].forEach(a => {
    const banks = groups[a] || [];
    html += \`<h2>\${angleBadge(a)} <span style="color: #6b7280; font-weight: normal">— \${banks.length} banques</span></h2>\`;
    if (banks.length === 0) {
      html += '<p style="color: #6b7280">Aucune banque dans cet angle pour ce run.</p>';
      return;
    }
    html += '<table><thead><tr><th>Banque</th><th>Pays</th><th>V4</th><th class="numeric">Score angle</th><th class="numeric">Total fit</th><th class="numeric">Mentions</th></tr></thead><tbody>';
    banks.forEach(s => {
      html += \`<tr>
        <td><strong>\${s.bank.name}</strong></td>
        <td>\${s.bank.country}</td>
        <td>\${priBadge(s.bank.priority)}</td>
        <td class="numeric">\${scoreBar(s.credable.angles[a].score, 10)}</td>
        <td class="numeric">\${s.credable.total_credable_fit}/40</td>
        <td class="numeric">\${s.evidence_count}</td>
      </tr>\`;
    });
    html += '</tbody></table>';
  });
  document.getElementById('byangle-detail').innerHTML = html;
}

// ─────── Init ───────
renderSummary();
renderSweetspots();
renderNewBanks();
renderByAngle();
</script>
</body>
</html>`;

fs.writeFileSync(OUT_PATH, html);
console.log(`[dashboard] Generated: ${OUT_PATH}`);
console.log(`[dashboard] Open with: open ${OUT_PATH} (Mac) or double-click in Finder`);
