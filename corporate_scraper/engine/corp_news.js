#!/usr/bin/env node
/**
 * Corporate News Fetcher — full article text
 *
 * 1) Searches DuckDuckGo for recent news per corporate (3 targeted queries)
 * 2) Visits each article URL and extracts the full body text (~3000 chars)
 * 3) Saves to corporate_scraper/news/{id}.json
 *
 * Full text feeds into extractor.js (--with-news flag) for richer LLM signals.
 * Cache: 7 days (use --force to refresh).
 *
 * Run:
 *   node engine/corp_news.js              # all corporates
 *   node engine/corp_news.js nestle       # specific id
 *   node engine/corp_news.js --limit 10
 *   node engine/corp_news.js --force
 */

const fs   = require('fs');
const path = require('path');
const { getBrowser } = require('./browser');

const ROOT     = path.join(__dirname, '..');
const CATALOG  = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog.json'), 'utf8')).corporates;
const NEWS_DIR = path.join(ROOT, 'news');
const CACHE_TTL_MS   = 7 * 24 * 3600 * 1000;
const YEAR           = new Date().getFullYear();
const MAX_ARTICLE_CHARS = 3000;
const MAX_ARTICLES      = 6;

const SIGNAL_RE = /supply.chain|trade.financ|working.capital|SCF|factoring|invoice.financ|payable|receivable|bank|treasury|payment|liquidity|fintech|digital|platform|SAP|Oracle|ERP/i;

const QUERIES = (corp) => [
  `"${corp.name}" supply chain finance working capital trade ${YEAR}`,
  `"${corp.name}" treasury SCF factoring invoice bank partnership ${YEAR - 1} OR ${YEAR}`,
  `"${corp.name}" digital finance ERP treasury transformation ${YEAR}`,
];

async function readArticleText(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1500));

    const text = await page.evaluate((maxChars) => {
      ['nav', 'header', 'footer', 'aside', '.ad', '.cookie', '.newsletter',
       'script', 'style', 'noscript'].forEach(sel => {
        document.querySelectorAll(sel).forEach(el => el.remove());
      });

      const container =
        document.querySelector('article') ||
        document.querySelector('[role="main"]') ||
        document.querySelector('main') ||
        document.body;

      const paras = [...container.querySelectorAll('p')]
        .map(p => p.innerText?.trim() || '')
        .filter(t => t.length > 60);

      return paras.join('\n\n').slice(0, maxChars);
    }, MAX_ARTICLE_CHARS);

    return text && text.length > 100 ? text : null;
  } catch (e) {
    return null;
  }
}

async function searchArticleUrls(page, corp) {
  const candidates = [];
  const seen = new Set();

  for (const q of QUERIES(corp)) {
    if (candidates.length >= MAX_ARTICLES * 2) break;
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await new Promise(r => setTimeout(r, 1200));

      const results = await page.evaluate(() => {
        const out = [];
        document.querySelectorAll('.result').forEach(el => {
          const titleEl = el.querySelector('.result__title a');
          const snipEl  = el.querySelector('.result__snippet');
          if (!titleEl) return;
          let href = titleEl.href || '';
          const m = href.match(/uddg=([^&]+)/);
          if (m) href = decodeURIComponent(m[1]);
          if (/\.(pdf|zip)$/i.test(href)) return;
          if (/linkedin\.com|facebook\.com|twitter\.com|instagram\.com/i.test(href)) return;
          out.push({
            title:   (titleEl.textContent || '').trim().slice(0, 120),
            url:     href,
            snippet: (snipEl?.textContent || '').trim().slice(0, 200),
          });
        });
        return out.slice(0, 6);
      });

      for (const r of results) {
        if (seen.has(r.url)) continue;
        seen.add(r.url);
        if (SIGNAL_RE.test(r.title + ' ' + r.snippet)) candidates.push(r);
      }
    } catch (e) {}
  }

  return candidates.slice(0, MAX_ARTICLES);
}

async function fetchNewsForCorp(page, corp) {
  const candidates = await searchArticleUrls(page, corp);
  const articles = [];

  for (const c of candidates) {
    process.stdout.write('.');
    const body = await readArticleText(page, c.url);
    articles.push({
      title:     c.title,
      url:       c.url,
      snippet:   c.snippet,
      full_text: body || null,
      chars:     body ? body.length : 0,
    });
  }

  return articles;
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

  let corps = CATALOG;
  if (opts.id)    corps = corps.filter(c => c.id === opts.id);
  if (opts.limit) corps = corps.slice(0, opts.limit);

  console.log(`[corp_news] Fetching full-text news for ${corps.length} corporates…`);

  const browser = await getBrowser();
  let found = 0, empty = 0, cached = 0;

  for (const corp of corps) {
    const outPath = path.join(NEWS_DIR, `${corp.id}.json`);
    const label   = corp.name.padEnd(35);

    if (!opts.force && fs.existsSync(outPath)) {
      const age = Date.now() - fs.statSync(outPath).mtimeMs;
      if (age < CACHE_TTL_MS) { console.log(`  ${label} CACHED`); cached++; continue; }
    }

    process.stdout.write(`  ${label} `);
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
    await page.setViewport({ width: 1280, height: 800 });

    try {
      const articles = await fetchNewsForCorp(page, corp);
      const withText = articles.filter(a => a.full_text);

      fs.writeFileSync(outPath, JSON.stringify({
        corp_id:    corp.id,
        corp_name:  corp.name,
        country:    corp.country,
        fetched_at: new Date().toISOString().slice(0, 10),
        articles,
      }, null, 2));

      if (articles.length > 0) {
        console.log(` ${articles.length} articles (${withText.length} avec texte)`);
        found++;
      } else {
        console.log(' no relevant news');
        empty++;
      }
    } catch (e) {
      console.log(` FAIL — ${e.message.slice(0, 60)}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log(`\n[corp_news] done — found=${found} empty=${empty} cached=${cached}`);
}

main().catch(e => { console.error(e); process.exit(1); });
