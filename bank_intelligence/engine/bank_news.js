#!/usr/bin/env node
/**
 * Bank News Fetcher
 *
 * Searches DuckDuckGo for recent news per bank and saves snippets to
 * bank_intelligence/news/{bank_id}.json
 *
 * Results feed into bank_extractor.js as additional signal context.
 * Cache: 7 days (use --force to refresh).
 *
 * Run:
 *   node engine/bank_news.js              # all banks
 *   node engine/bank_news.js kb-cz        # specific bank
 *   node engine/bank_news.js --limit 10
 *   node engine/bank_news.js --force      # ignore cache
 */

const fs   = require('fs');
const path = require('path');
const { getBrowser } = require('../../corporate_scraper/engine/browser');

const ROOT          = path.join(__dirname, '..');
const TECHSTACK_PATH = path.join(ROOT, 'data', 'bank_techstack.json');
const NEWS_DIR      = path.join(ROOT, 'news');
const CACHE_TTL_MS  = 7 * 24 * 3600 * 1000;
const YEAR          = new Date().getFullYear();

// Only keep articles that mention at least one of these signals
const SIGNAL_RE = /digital.transform|fintech|SCF|supply.chain.financ|trade.financ|working.capital|platform|transaction.banking|CEO|appoint|acqui|merger|Finastra|Temenos|Asseco|T24|partnership|factoring|invoice/i;

const QUERIES = (bank) => [
  `"${bank.name}" digital transformation trade finance ${YEAR}`,
  `"${bank.name}" fintech SCF working capital platform ${YEAR - 1} OR ${YEAR}`,
  `"${bank.name}" CEO appointment merger acquisition ${YEAR}`,
];

async function fetchNewsForBank(page, bank) {
  const articles = [];
  const seen = new Set();

  for (const q of QUERIES(bank)) {
    if (articles.length >= 8) break;
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await new Promise(r => setTimeout(r, 1200));

      const results = await page.evaluate(() => {
        const out = [];
        document.querySelectorAll('.result').forEach(el => {
          const titleEl  = el.querySelector('.result__title a');
          const snipEl   = el.querySelector('.result__snippet');
          const dateEl   = el.querySelector('.result__timestamp, .result__url');
          if (!titleEl) return;
          let href = titleEl.href || '';
          const m = href.match(/uddg=([^&]+)/);
          if (m) href = decodeURIComponent(m[1]);
          out.push({
            title:   (titleEl.textContent || '').trim().slice(0, 120),
            url:     href,
            snippet: (snipEl?.textContent  || '').trim().slice(0, 300),
            date:    (dateEl?.textContent  || '').trim().slice(0, 30),
          });
        });
        return out.slice(0, 8);
      });

      for (const r of results) {
        if (seen.has(r.url)) continue;
        seen.add(r.url);
        if (SIGNAL_RE.test(r.title + ' ' + r.snippet)) {
          articles.push(r);
        }
      }
    } catch (e) { /* ignore individual query failures */ }
  }

  return articles.slice(0, 8);
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
  fs.mkdirSync(NEWS_DIR, { recursive: true });

  const techstack = JSON.parse(fs.readFileSync(TECHSTACK_PATH, 'utf8'));
  let banks = techstack.banks;
  if (opts.id)    banks = banks.filter(b => b.bank_id === opts.id);
  if (opts.limit) banks = banks.slice(0, opts.limit);

  console.log(`[bank_news] Fetching news for ${banks.length} banks…`);

  const browser = await getBrowser();
  let found = 0, empty = 0, cached = 0;

  for (const bank of banks) {
    const outPath = path.join(NEWS_DIR, `${bank.bank_id}.json`);
    const label   = bank.name.padEnd(32);

    if (!opts.force && fs.existsSync(outPath)) {
      const age = Date.now() - fs.statSync(outPath).mtimeMs;
      if (age < CACHE_TTL_MS) { console.log(`  ${label} CACHED`); cached++; continue; }
    }

    process.stdout.write(`  ${label} searching… `);
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
    await page.setViewport({ width: 1280, height: 800 });

    try {
      const articles = await fetchNewsForBank(page, bank);
      fs.writeFileSync(outPath, JSON.stringify({
        bank_id:    bank.bank_id,
        bank_name:  bank.name,
        country:    bank.country,
        fetched_at: new Date().toISOString().slice(0, 10),
        articles,
      }, null, 2));

      if (articles.length > 0) { console.log(`${articles.length} articles`); found++; }
      else                      { console.log('no relevant news'); empty++; }
    } catch (e) {
      console.log(`FAIL — ${e.message.slice(0, 60)}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log(`\n[bank_news] found=${found} empty=${empty} cached=${cached}`);
  console.log(`[bank_news] News saved to: ${NEWS_DIR}`);
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
