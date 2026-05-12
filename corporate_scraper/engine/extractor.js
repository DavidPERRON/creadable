#!/usr/bin/env node
/**
 * DeepInfra Extractor — corporate annual reports → structured JSON
 *
 * For each corporate with an extracted text file:
 *   1) Locate SCF-relevant chunks (regex pre-filter to save tokens)
 *   2) Send to DeepInfra (Llama-3.3-70B) with strict JSON schema prompt
 *   3) Validate + persist to extractions/<id>.json
 *
 * Idempotent: skips corporates already extracted.
 *
 * Run:
 *   export DEEPINFRA_API_KEY=...
 *   node engine/extractor.js                  # all available text/*.txt
 *   node engine/extractor.js nestle           # specific id
 *   node engine/extractor.js --limit 10
 *   node engine/extractor.js --dry-run        # show chunks without API call
 *
 * Cost estimate:
 *   ~25k tokens per corporate (filtered chunks ~15k tokens + ~10k output)
 *   Llama-3.3-70B via DeepInfra: ~$0.0001/1k tokens input, ~$0.0002/1k output
 *   224 corporates × $0.005 ≈ $1.12 for the full run
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { SYSTEM_PROMPT, USER_PROMPT_TEMPLATE, EMPTY_EXTRACTION } = require('./extraction_schema');

const ROOT = path.join(__dirname, '..');
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog.json'), 'utf8')).corporates;
const TXT_DIR  = path.join(ROOT, 'text');
const OUT_DIR  = path.join(ROOT, 'extractions');
const NEWS_DIR = path.join(ROOT, 'news');

const API_URL = 'https://api.deepinfra.com/v1/openai/chat/completions';
const MODEL = process.env.DEEPINFRA_MODEL || 'meta-llama/Meta-Llama-3.1-405B-Instruct';
const API_KEY = process.env.DEEPINFRA_API_KEY;

// ─────────────────────────────────────────────────────────────────
// Pre-filter: extract working-capital / trade / inventory / receivables
// chunks from the txt. Broad multilingual coverage.
// ─────────────────────────────────────────────────────────────────
const SCF_KEYWORDS = [
  // PAYABLES SIDE
  'reverse factoring', 'reverse-factoring', 'confirming', 'dynamic discounting',
  'supply chain finance', 'supply-chain finance', 'supplier finance',
  'supplier financing', 'trade payables', 'early payment program',
  'payable financing', 'payables finance', 'payables financing',

  // RECEIVABLES SIDE
  'factoring', 'invoice discounting', 'receivables finance', 'receivables securit',
  'vendor finance', 'vendor financing', 'sale of receivables', 'sold receivables',
  'transferred receivables', 'derecognition of receivables',
  'cession of receivables', 'cession de créances', 'cession de creances',

  // DOCUMENTARY TRADE
  'letter of credit', 'letters of credit', 'documentary credit', 'documentary collection',
  'trade finance', 'export finance', 'forfaiting', 'forfeiting',
  'bank guarantee', 'standby letter of credit', 'sblc',
  'structured trade', 'commodity trade finance',

  // CHANNEL / PRE-SHIPMENT
  'distributor finance', 'distributor financing', 'pre-shipment', 'preshipment',
  'purchase order finance', 'channel finance', 'channel financing',

  // INVENTORY / TITLE
  'inventory finance', 'inventory financing', 'floor plan', 'consignment',
  'title transfer', 'tradeco', 'spv', 'special purpose vehicle',
  'raw material financing', 'stock financing',

  // GENERIC WORKING CAPITAL
  'working capital facilit', 'working capital line', 'revolving credit',
  'committed credit facilit', 'syndicated facilit', 'overdraft',

  // ERP / TECH (signals readiness)
  'sap ariba', 'oracle ', 'coupa', 'kyriba', 'erp integration',
  'treasury management system',

  // PLATFORM / VENDOR (signals competitor presence)
  'demica', 'orbian', 'taulia', 'primerevenue', 'tradeshift', 'c2fo',
  'liquidx', 'greensill', 'komgo', 'we.trade', 'marco polo', 'contour',
  'plusadvance', 'qualco', 'fintra',

  // ESG-LINKED
  'sustainability-linked supplier', 'sustainable supply chain finance',
  'esg-linked', 'green supplier', 'green trade',

  // TRADE CREDIT INSURANCE (proxy for active TF)
  'coface', 'allianz trade', 'atradius', 'euler hermes', 'credendo',
  'trade credit insur',

  // BANK RELATIONSHIPS
  'syndicat', 'lead bank', 'relationship bank', 'core banks',
  'agent bank', 'security agent', 'mandated lead arranger',

  // MULTI-LANGUAGE (DE, FR, IT, ES, NL, PT, PL, CZ)
  'lieferantenfinanzierung', 'forderungsverkauf', 'forderungen verkauft',
  'akkreditiv', 'avalkredit', 'lieferkettenfinanzierung',
  'affacturage', 'créances cédées', 'creances cedees', 'crédits documentaires',
  'cessione dei crediti', 'cessione del credito', 'finanziamento dei crediti',
  'cesión de créditos', 'cesión de cuentas', 'descuento de facturas',
  'leverancierskrediet', 'verkoop van vorderingen',
  'venda de creditos', 'cessao de creditos',
];

function extractRelevantChunks(fullText, maxChars = 15000) {
  const lines = fullText.split('\n');
  const reLower = new RegExp(SCF_KEYWORDS.map(k => k.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i');

  // Find indexes of relevant lines
  const relevantIdx = [];
  lines.forEach((ln, i) => { if (reLower.test(ln)) relevantIdx.push(i); });

  if (relevantIdx.length === 0) return null; // nothing relevant

  // Build chunks: each relevant line + 6 lines context before / after, deduplicated
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

// ─────────────────────────────────────────────────────────────────
// DeepInfra API call
// ─────────────────────────────────────────────────────────────────
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

function parseExtraction(content, corp) {
  if (!content) return null;
  // Strip markdown fencing if present
  let s = content.trim();
  if (s.startsWith('```')) s = s.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '');
  try {
    const parsed = JSON.parse(s);
    return {
      corporate_id: corp.id,
      corporate_name: corp.name,
      country: corp.country,
      sector: corp.sector,
      revenue_eur_bn: corp.revenue_eur_bn,
      extracted_at: new Date().toISOString().slice(0,10),
      ...parsed,
    };
  } catch (e) {
    console.error(`[extractor] JSON parse failed for ${corp.id}: ${e.message}`);
    return null;
  }
}

function loadNewsSnippets(corpId) {
  const newsPath = path.join(NEWS_DIR, `${corpId}.json`);
  if (!fs.existsSync(newsPath)) return '';
  try {
    const data = JSON.parse(fs.readFileSync(newsPath, 'utf8'));
    const articles = (data.articles || []).filter(a => a.full_text);
    if (!articles.length) return '';
    let block = '\n\n--- RECENT NEWS (web) ---\n';
    let total = 0;
    for (const a of articles.slice(0, 5)) {
      const snippet = (a.full_text || '').slice(0, 1500);
      block += `\n[${a.title}]\n${snippet}\n`;
      total += snippet.length;
      if (total > 6000) break;
    }
    return block;
  } catch (e) { return ''; }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { id: null, limit: null, dryRun: false, withNews: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--limit')     opts.limit = parseInt(args[++i], 10);
    else if (a === '--dry-run')   opts.dryRun = true;
    else if (a === '--with-news') opts.withNews = true;
    else if (!a.startsWith('--')) opts.id = a;
  }
  return opts;
}

async function processOne(corp, opts, counters) {
  const year = new Date().getFullYear();
  const txtPath = path.join(TXT_DIR, `${corp.id}_${year}.txt`);
  const outPath = path.join(OUT_DIR, `${corp.id}.json`);
  const label = corp.id.padEnd(28);

  if (!fs.existsSync(txtPath)) { console.log(`  ${label} SKIP — no txt available`); counters.skipped++; return; }
  if (fs.existsSync(outPath))  { console.log(`  ${label} CACHED`); counters.skipped++; return; }

  const fullText = fs.readFileSync(txtPath, 'utf8');
  const chunk = extractRelevantChunks(fullText);
  if (!chunk) {
    console.log(`  ${label} no_relevant_content`);
    const empty = { corporate_id: corp.id, corporate_name: corp.name, country: corp.country,
                    sector: corp.sector, revenue_eur_bn: corp.revenue_eur_bn,
                    extracted_at: new Date().toISOString().slice(0,10), ...EMPTY_EXTRACTION };
    fs.writeFileSync(outPath, JSON.stringify(empty, null, 2));
    counters.processed++; return;
  }

  console.log(`  ${label} ${chunk.length} chars → calling API…`);
  if (opts.dryRun) { counters.skipped++; return; }

  try {
    const newsBlock = opts.withNews ? loadNewsSnippets(corp.id) : '';
    const userPrompt = USER_PROMPT_TEMPLATE(corp.name, corp.country, corp.sector, chunk + newsBlock);
    const t0 = Date.now();
    const ticker = setInterval(() => console.log(`  ${label} [${Math.round((Date.now()-t0)/1000)}s]…`), 15000);
    const { content, usage } = await callDeepInfra(SYSTEM_PROMPT, userPrompt).finally(() => clearInterval(ticker));
    const parsed = parseExtraction(content, corp);
    if (!parsed) { console.log(`  ${label} FAIL parse`); counters.failed++; return; }

    fs.writeFileSync(outPath, JSON.stringify(parsed, null, 2));
    counters.tokIn  += usage.prompt_tokens || 0;
    counters.tokOut += usage.completion_tokens || 0;
    const banksFound = parsed.banks_mentioned_in_scf_or_trade_finance_context?.length || 0;
    const platformFound = parsed.platform_provider_mentioned?.found ? '+platform' : '';
    console.log(`  ${label} OK (${usage.prompt_tokens}/${usage.completion_tokens} tok, ${Math.round((Date.now()-t0)/1000)}s, ${banksFound} banks${platformFound})`);
    counters.processed++;
  } catch (e) {
    console.log(`  ${label} FAIL — ${e.message.slice(0, 80)}`);
    counters.failed++;
  }
}

async function main() {
  const opts = parseArgs();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let list = CATALOG;
  if (opts.id)    list = list.filter(c => c.id === opts.id);
  if (opts.limit) list = list.slice(0, opts.limit);

  const CONCURRENCY = opts.id ? 1 : 4;
  console.log(`[extractor] Processing ${list.length} corporates (concurrency=${CONCURRENCY})…`);

  const counters = { processed: 0, skipped: 0, failed: 0, tokIn: 0, tokOut: 0 };
  let idx = 0;
  async function worker() {
    while (idx < list.length) {
      const corp = list[idx++];
      await processOne(corp, opts, counters);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log(`\n[extractor] processed=${counters.processed} skipped=${counters.skipped} failed=${counters.failed}`);
  console.log(`[extractor] tokens in=${counters.tokIn} out=${counters.tokOut}`);
  const cost = (counters.tokIn * 0.0001 + counters.tokOut * 0.0002) / 1000;
  console.log(`[extractor] estimated cost: $${cost.toFixed(4)}`);
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
module.exports = { extractRelevantChunks, callDeepInfra, parseExtraction };
