#!/usr/bin/env node
/**
 * Bank Job Postings Signal (Tier 2)
 *
 * Searches for active job postings at each bank for SCF/trade finance/
 * digital banking roles. A bank hiring these profiles = strong buying intent.
 *
 * Signal logic:
 *   - "Head of SCF" / "Supply Chain Finance Manager" → very high intent
 *   - "Trade Finance Digital" / "Transaction Banking Transformation" → high
 *   - "Core Banking Migration" / "Finastra" / "Temenos" → platform change
 *   - Volume of open roles → urgency signal
 *
 * Saves to bank_intelligence/jobs/{bank_id}.json
 * Cache: 3 days (job postings change faster than news)
 *
 * Run:
 *   node engine/bank_jobs.js              # all banks
 *   node engine/bank_jobs.js kb-cz        # specific bank
 *   node engine/bank_jobs.js --limit 10
 *   node engine/bank_jobs.js --force
 */

const fs   = require('fs');
const path = require('path');
const { getBrowser } = require('../../corporate_scraper/engine/browser');

const ROOT           = path.join(__dirname, '..');
const TECHSTACK_PATH = path.join(ROOT, 'data', 'bank_techstack.json');
const JOBS_DIR       = path.join(ROOT, 'jobs');
const CACHE_TTL_MS   = 3 * 24 * 3600 * 1000;

// Job title signals mapped to intent level
const JOB_SIGNALS = [
  { re: /supply.chain.financ|SCF.manager|SCF.director/i,           intent: 'VERY_HIGH', label: 'SCF role' },
  { re: /trade.financ.digital|transaction.banking.transform/i,      intent: 'VERY_HIGH', label: 'TF digital transform' },
  { re: /head.of.transaction.banking|director.transaction.banking/i, intent: 'HIGH',      label: 'Transaction banking leadership' },
  { re: /working.capital.finance|receivables.finance|factoring/i,   intent: 'HIGH',      label: 'Working capital role' },
  { re: /core.banking.migration|Finastra|Temenos|T24/i,             intent: 'HIGH',      label: 'Core banking platform' },
  { re: /digital.banking.product|embedded.finance|open.banking/i,  intent: 'MEDIUM',    label: 'Digital banking product' },
  { re: /trade.finance.analyst|trade.finance.officer/i,             intent: 'MEDIUM',    label: 'Trade finance ops' },
  { re: /fintech.partnership|platform.integration/i,                intent: 'MEDIUM',    label: 'Fintech/platform integration' },
];

const SEARCH_QUERIES = (bank) => [
  `"${bank.name}" jobs "supply chain finance" OR "trade finance" OR "transaction banking"`,
  `"${bank.name}" careers "SCF" OR "working capital" OR "factoring" OR "Finastra" OR "Temenos"`,
  `site:linkedin.com/jobs "${bank.name}" "trade finance" OR "SCF" OR "transaction banking"`,
];

function classifyJob(title, description) {
  for (const sig of JOB_SIGNALS) {
    if (sig.re.test(title) || sig.re.test(description || '')) {
      return { intent: sig.intent, label: sig.label };
    }
  }
  return null;
}

async function fetchJobsForBank(page, bank) {
  const jobs = [];
  const seen = new Set();

  for (const q of SEARCH_QUERIES(bank)) {
    if (jobs.length >= 10) break;
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await new Promise(r => setTimeout(r, 1200));

      const results = await page.evaluate(() => {
        const out = [];
        document.querySelectorAll('.result').forEach(el => {
          const titleEl = el.querySelector('.result__title a');
          const snipEl  = el.querySelector('.result__snippet');
          const urlEl   = el.querySelector('.result__url');
          if (!titleEl) return;
          let href = titleEl.href || '';
          const m = href.match(/uddg=([^&]+)/);
          if (m) href = decodeURIComponent(m[1]);
          out.push({
            title:       (titleEl.textContent || '').trim().slice(0, 120),
            url:         href,
            description: (snipEl?.textContent || '').trim().slice(0, 250),
            source:      (urlEl?.textContent  || '').trim().slice(0, 60),
          });
        });
        return out.slice(0, 8);
      });

      for (const r of results) {
        if (seen.has(r.title)) continue;
        seen.add(r.title);
        const signal = classifyJob(r.title, r.description);
        if (signal) {
          jobs.push({ ...r, ...signal });
        }
      }
    } catch (e) {}
  }

  // Deduplicate by title similarity
  const deduped = [];
  const titlesNorm = new Set();
  for (const j of jobs) {
    const norm = j.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);
    if (!titlesNorm.has(norm)) { titlesNorm.add(norm); deduped.push(j); }
  }

  return deduped.slice(0, 10);
}

function summarizeIntent(jobs) {
  if (jobs.length === 0) return 'NONE';
  if (jobs.some(j => j.intent === 'VERY_HIGH')) return 'VERY_HIGH';
  if (jobs.some(j => j.intent === 'HIGH'))      return 'HIGH';
  return 'MEDIUM';
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { id: null, limit: null, force: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--limit') opts.limit = parseInt(args[++i], 10);
    else if (a === '--force') opts.force = true;
    else if (!a.startsWith('--')) opts.id = a;
  }
  return opts;
}

async function main() {
  const opts = parseArgs();
  fs.mkdirSync(JOBS_DIR, { recursive: true });

  const techstack = JSON.parse(fs.readFileSync(TECHSTACK_PATH, 'utf8'));
  let banks = techstack.banks;
  if (opts.id)    banks = banks.filter(b => b.bank_id === opts.id);
  if (opts.limit) banks = banks.slice(0, opts.limit);

  console.log(`[bank_jobs] Scanning job postings for ${banks.length} banks…`);

  const browser = await getBrowser();
  let high = 0, medium = 0, none = 0, cached = 0;

  for (const bank of banks) {
    const outPath = path.join(JOBS_DIR, `${bank.bank_id}.json`);
    const label   = bank.name.padEnd(30);

    if (!opts.force && fs.existsSync(outPath)) {
      const age = Date.now() - fs.statSync(outPath).mtimeMs;
      if (age < CACHE_TTL_MS) { console.log(`  ${label} CACHED`); cached++; continue; }
    }

    process.stdout.write(`  ${label} scanning… `);
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
    await page.setViewport({ width: 1280, height: 800 });

    try {
      const jobs = await fetchJobsForBank(page, bank);
      const intent = summarizeIntent(jobs);

      fs.writeFileSync(outPath, JSON.stringify({
        bank_id:       bank.bank_id,
        bank_name:     bank.name,
        country:       bank.country,
        fetched_at:    new Date().toISOString().slice(0, 10),
        hiring_intent: intent,
        open_roles:    jobs.length,
        jobs,
      }, null, 2));

      const tag = intent === 'VERY_HIGH' ? '★★ VERY HIGH' :
                  intent === 'HIGH'      ? '★  HIGH' :
                  intent === 'MEDIUM'    ? '◆  MEDIUM' : '—  none';
      console.log(`${tag} (${jobs.length} roles)`);

      if (intent !== 'NONE') high++;
      else none++;
    } catch (e) {
      console.log(`FAIL — ${e.message.slice(0, 60)}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();

  // Print summary of high-intent banks
  const allResults = fs.readdirSync(JOBS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => { try { return JSON.parse(fs.readFileSync(path.join(JOBS_DIR, f))); } catch { return null; } })
    .filter(Boolean)
    .filter(r => r.hiring_intent !== 'NONE')
    .sort((a, b) => ['VERY_HIGH','HIGH','MEDIUM'].indexOf(a.hiring_intent) -
                    ['VERY_HIGH','HIGH','MEDIUM'].indexOf(b.hiring_intent));

  console.log(`\n[bank_jobs] ${allResults.length} banks with active hiring signals:`);
  for (const r of allResults.slice(0, 15)) {
    console.log(`  ${r.bank_name.padEnd(30)} ${r.hiring_intent.padEnd(10)} ${r.open_roles} roles`);
    for (const j of r.jobs.slice(0, 2)) {
      console.log(`    ↳ ${j.title.slice(0, 70)}`);
    }
  }
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
