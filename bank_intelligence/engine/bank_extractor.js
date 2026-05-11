#!/usr/bin/env node
/**
 * Bank Annual Report Extractor — capability gap signals
 *
 * Analyse les rapports annuels DES BANQUES (différent de corporate_scraper qui
 * analyse les rapports DES CORPORATES) pour extraire :
 *   - Capability gaps (factoring volume sans plateforme, vocabulaire vague)
 *   - Strategic intent (CEO statements, investor day priorities)
 *   - Tech stack (Finastra/Temenos/T24 mentions)
 *   - TCI partnerships (Coface/Allianz Trade/Atradius mentions)
 *   - NPL/RWA stress signals (Early Warning angle)
 *   - SME/Embedded finance volumes (LOS angle)
 *
 * Run:
 *   export DEEPINFRA_API_KEY=...
 *   node engine/bank_extractor.js                  # all available bank texts
 *   node engine/bank_extractor.js bcge-ch          # specific bank
 *   node engine/bank_extractor.js --dry-run
 *
 * Reads:  ../scraper/pdfs/*.txt + ../corporate_scraper/text/<bank>_*.txt
 * Writes: extractions/<bank_id>.json
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const REPO_ROOT = path.join(ROOT, '..');
const SCRAPER_PDF_DIR = path.join(REPO_ROOT, 'scraper', 'pdfs');
const CORP_TEXT_DIR = path.join(REPO_ROOT, 'corporate_scraper', 'text');
const OUT_DIR = path.join(ROOT, 'extractions');
const TECHSTACK_PATH = path.join(ROOT, 'data', 'bank_techstack.json');

const API_URL = 'https://api.deepinfra.com/v1/openai/chat/completions';
const MODEL = process.env.DEEPINFRA_MODEL || 'meta-llama/Llama-3.3-70B-Instruct';
const API_KEY = process.env.DEEPINFRA_API_KEY;

// ─────────────────────────────────────────────────────────────────
// SYSTEM PROMPT — for BANK reports (not corporate reports)
// ─────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You analyze BANK annual reports to identify capability gaps and buying intent signals for a B2B software vendor (CredAble) that sells white-label working-capital infrastructure.

Your job is to find evidence in a bank's own report that signals:
1. The bank is ACTIVE in trade/working capital BUT lacks a sophisticated platform (capability gap)
2. The bank has STRATEGIC INTENT to develop these areas (CEO statements, board priorities, transformation initiatives)
3. The bank uses specific tech stacks (Finastra, Temenos, T24) — relevant for pre-integration
4. The bank has TCI partnerships (Coface, Allianz Trade, Atradius)
5. The bank has stress signals (rising NPL, RWA pressure, capital optimization needs)

EXTRACTION RULES:
- Always provide verbatim quotes for facts
- Mark inference vs facts vs general_knowledge
- For volumes: extract numbers in original currency, year of figure
- Output VALID JSON only`;

const USER_PROMPT_TEMPLATE = (bankName, country, textChunk) => `Bank: ${bankName} (${country})

Extract capability gap and buying intent signals from this BANK annual report excerpt. Output JSON:

{
  "year_of_report": <integer or null>,

  "capability_gap_signals": {
    "factoring_volume_growth_pct":         { "value": <number|null>, "verbatim": <string|null>, "year": <integer|null> },
    "factoring_volume_eur":                { "value": <number|null>, "verbatim": <string|null>, "year": <integer|null> },
    "scf_mentioned_without_platform":      { "found": <bool>, "verbatim": <string|null>, "comment": <string|null> },
    "manual_paper_processes_mentioned":    { "found": <bool>, "verbatim": <string|null> },
    "vague_scf_vocabulary":                { "found": <bool>, "verbatim": <string|null>, "examples": [<list of vague phrases>] },
    "back_office_size_mentioned":          { "found": <bool>, "verbatim": <string|null> },
    "transaction_banking_growth_pct":      { "value": <number|null>, "verbatim": <string|null> }
  },

  "strategic_intent_signals": {
    "ceo_statement_on_transaction_banking":{ "found": <bool>, "verbatim": <string|null> },
    "digital_transformation_priority":     { "found": <bool>, "verbatim": <string|null> },
    "investor_day_scf_mention":            { "found": <bool>, "verbatim": <string|null> },
    "transformation_budget_mentioned":     { "found": <bool>, "verbatim": <string|null>, "amount_eur": <number|null> },
    "new_tf_scf_executive_hired":          { "found": <bool>, "verbatim": <string|null>, "name": <string|null>, "role": <string|null>, "date": <string|null> },
    "roadmap_includes_api_or_platform":    { "found": <bool>, "verbatim": <string|null> }
  },

  "tech_stack_signals": {
    "core_banking_system":      { "name": <string|null>, "verbatim": <string|null>, "is_finastra_or_temenos": <bool> },
    "treasury_management":      { "name": <string|null>, "verbatim": <string|null> },
    "erp_or_partner_systems":   [<list of strings>],
    "cloud_or_api_first":       { "found": <bool>, "verbatim": <string|null> },
    "existing_scf_platform":    { "name": <string|null>, "verbatim": <string|null>, "is_major_competitor": <bool> },
    "fintech_partnerships":     [<list of {name, role, year, verbatim}>],
    "ended_fintech_partnership":{ "found": <bool>, "verbatim": <string|null>, "former_partner": <string|null>, "end_date": <string|null> }
  },

  "tci_partnership_signals": {
    "tci_providers_mentioned": [<list of {name (Coface/Allianz Trade/Atradius/Euler Hermes/Credendo/national ECA), verbatim}>],
    "ecf_or_eca_active":       { "found": <bool>, "verbatim": <string|null> },
    "tci_program_volume":      { "value_eur": <number|null>, "verbatim": <string|null> }
  },

  "stress_signals": {
    "npl_ratio":                  { "value_pct": <number|null>, "verbatim": <string|null>, "trend": "rising|stable|falling|null" },
    "rwa_pressure":               { "found": <bool>, "verbatim": <string|null> },
    "capital_optimization_focus": { "found": <bool>, "verbatim": <string|null> },
    "basel_iii_scf_treatment":    { "found": <bool>, "verbatim": <string|null> }
  },

  "embedded_finance_signals": {
    "sme_lending_volume_eur":     { "value": <number|null>, "verbatim": <string|null> },
    "digital_onboarding":         { "found": <bool>, "verbatim": <string|null> },
    "pos_or_seller_financing":    { "found": <bool>, "verbatim": <string|null> },
    "marketplace_partnerships":   { "found": <bool>, "verbatim": <string|null> }
  },

  "key_quotes_for_review": [<up to 5 most actionable verbatim quotes>],
  "_extraction_notes": <string|null — overall capability assessment>
}

Bank annual report excerpt:
---
${textChunk}
---

Output the JSON object now:`;

// Pre-filter keywords for bank-side signals (broader than corporate-side)
const BANK_SIGNAL_KEYWORDS = [
  // Capability gap
  'factoring', 'invoice discounting', 'reverse factoring', 'supply chain finance',
  'supplier finance', 'trade finance', 'transaction banking',
  'working capital', 'cession de créances', 'forfaiting',
  // Strategic intent
  'digital transformation', 'transformation digital', 'transformation budget',
  'investor day', 'strategic priorities', 'roadmap',
  'innovation', 'modernization', 'transition',
  // Tech stack
  'finastra', 'temenos', 't24', 'misys', 'sopra', 'avaloq', 'asseco',
  'fis profile', 'tcs bancs', 'oracle', 'sap',
  'core banking', 'platform', 'api',
  // TCI
  'coface', 'allianz trade', 'atradius', 'euler hermes', 'credendo',
  'sace', 'eximbank', 'eka', 'ekn', 'kuke', 'sid banka', 'aofi',
  'trade credit insurance', 'export credit insurance',
  // Stress
  'npl', 'non-performing loan', 'rwa', 'risk-weighted asset',
  'capital optimization', 'basel iii', 'basel 3',
  'early warning', 'stress test',
  // Embedded
  'sme lending', 'sme loan', 'embedded finance', 'pos financing',
  'merchant finance', 'seller finance', 'marketplace',
];

function extractRelevantChunks(fullText, maxChars = 15000) {
  const lines = fullText.split('\n');
  const re = new RegExp(BANK_SIGNAL_KEYWORDS.map(k =>
    k.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  ).join('|'), 'i');

  const relevantIdx = [];
  lines.forEach((ln, i) => { if (re.test(ln)) relevantIdx.push(i); });
  if (relevantIdx.length === 0) return null;

  const window = new Set();
  for (const i of relevantIdx) {
    for (let j = Math.max(0, i - 6); j < Math.min(lines.length, i + 7); j++) window.add(j);
  }
  const sortedIdx = [...window].sort((a, b) => a - b);
  let chunk = '';
  let lastIdx = -2;
  for (const i of sortedIdx) {
    if (i !== lastIdx + 1 && chunk) chunk += '\n[...]\n';
    chunk += lines[i] + '\n';
    lastIdx = i;
    if (chunk.length > maxChars) { chunk += '\n[TRUNCATED]'; break; }
  }
  return chunk;
}

async function callDeepInfra(systemPrompt, userPrompt, timeoutMs = 150000) {
  if (!API_KEY) throw new Error('DEEPINFRA_API_KEY env var required');
  const payload = JSON.stringify({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.0,
    max_tokens: 4000,
    response_format: { type: 'json_object' },
  });

  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (fn, val) => { if (!settled) { settled = true; clearTimeout(timer); fn(val); } };

    const timer = setTimeout(() => {
      req.destroy();
      done(reject, new Error(`timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    const req = https.request(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('error', e => done(reject, e));
      res.on('end', () => {
        if (res.statusCode !== 200) return done(reject, new Error(`API ${res.statusCode}: ${data.slice(0, 300)}`));
        try {
          const json = JSON.parse(data);
          done(resolve, { content: json.choices?.[0]?.message?.content, usage: json.usage || {} });
        } catch (e) { done(reject, e); }
      });
    });
    req.on('error', e => done(reject, e));
    req.write(payload);
    req.end();
  });
}

function findBankTextFile(bankId, bankName) {
  if (!fs.existsSync(SCRAPER_PDF_DIR)) return null;
  const files = fs.readdirSync(SCRAPER_PDF_DIR).filter(f => f.endsWith('.txt'));

  // Exact match by bank_id prefix (most reliable — files are named {bank_id}_annual_report.txt)
  for (const f of files) {
    if (f.startsWith(bankId + '_')) return path.join(SCRAPER_PDF_DIR, f);
  }

  // Fuzzy fallback by bank name (first 6 normalised chars)
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const target = norm(bankName);
  for (const f of files) {
    if (norm(f).includes(target.slice(0, 6))) return path.join(SCRAPER_PDF_DIR, f);
  }
  return null;
}

function parseExtraction(content, bank) {
  if (!content) return null;
  let s = content.trim();
  if (s.startsWith('```')) s = s.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '');
  try {
    const parsed = JSON.parse(s);
    return {
      bank_id: bank.bank_id,
      bank_name: bank.name,
      country: bank.country,
      extracted_at: new Date().toISOString().slice(0,10),
      ...parsed,
    };
  } catch (e) {
    console.error(`[bank_extractor] JSON parse failed for ${bank.bank_id}: ${e.message}`);
    return null;
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { id: null, dryRun: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--dry-run') opts.dryRun = true;
    else if (!a.startsWith('--')) opts.id = a;
  }
  return opts;
}

async function main() {
  const opts = parseArgs();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const techstack = JSON.parse(fs.readFileSync(TECHSTACK_PATH, 'utf8'));
  let banks = techstack.banks;
  if (opts.id) banks = banks.filter(b => b.bank_id === opts.id);

  let processed = 0, skipped = 0, failed = 0, totalTokens = { in: 0, out: 0 };

  for (const bank of banks) {
    const txtFile = findBankTextFile(bank.bank_id, bank.name);
    const outPath = path.join(OUT_DIR, `${bank.bank_id}.json`);

    if (fs.existsSync(outPath)) {
      console.log(`  ${bank.name.padEnd(30)} CACHED`);
      skipped++; continue;
    }
    if (!txtFile) {
      console.log(`  ${bank.name.padEnd(30)} no_text_available`);
      skipped++; continue;
    }

    const fullText = fs.readFileSync(txtFile, 'utf8');
    const chunk = extractRelevantChunks(fullText);
    if (!chunk) {
      console.log(`  ${bank.name.padEnd(30)} no_relevant_content`);
      skipped++; continue;
    }

    process.stdout.write(`  ${bank.name.padEnd(30)} ${chunk.length} chars → `);
    if (opts.dryRun) { console.log('(dry-run)'); continue; }

    try {
      const userPrompt = USER_PROMPT_TEMPLATE(bank.name, bank.country, chunk);
      const t0 = Date.now();
      const ticker = setInterval(() => process.stdout.write(`[${Math.round((Date.now()-t0)/1000)}s]`), 15000);
      const { content, usage } = await callDeepInfra(SYSTEM_PROMPT, userPrompt).finally(() => clearInterval(ticker));
      const parsed = parseExtraction(content, bank);
      if (!parsed) { console.log('FAIL parse'); failed++; continue; }

      fs.writeFileSync(outPath, JSON.stringify(parsed, null, 2));
      totalTokens.in += usage.prompt_tokens || 0;
      totalTokens.out += usage.completion_tokens || 0;
      console.log(`OK (${usage.prompt_tokens}/${usage.completion_tokens} tok)`);
      processed++;
    } catch (e) {
      console.log(`FAIL — ${e.message.slice(0, 80)}`);
      failed++;
    }
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n[bank_extractor] processed=${processed} skipped=${skipped} failed=${failed}`);
  console.log(`[bank_extractor] tokens in=${totalTokens.in} out=${totalTokens.out}`);
  const cost = (totalTokens.in * 0.0001 + totalTokens.out * 0.0002) / 1000;
  console.log(`[bank_extractor] estimated cost: $${cost.toFixed(4)}`);
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
module.exports = { extractRelevantChunks };
