#!/usr/bin/env node
/**
 * URL Discoverer — fills `direct_pdf_url` field in catalog.json
 *
 * Strategy (in order):
 *   1) annualreports.com aggregator search
 *   2) ResponsibilityReports.com (sustainability reports)
 *   3) Bing Search (more scraper-friendly than Google)
 *
 * For each corporate without a direct_pdf_url, attempts discovery and
 * writes the URL back to catalog.json. Idempotent — won't override existing.
 *
 * Run:
 *   node engine/discover.js                # all corporates without URL
 *   node engine/discover.js nestle         # specific
 *   node engine/discover.js --limit 10
 */

const fs = require('fs');
const path = require('path');
const { getBrowser } = require('./browser');

const ROOT = path.join(__dirname, '..');
const CATALOG_PATH = path.join(ROOT, 'catalog.json');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { id: null, limit: null };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--limit')   opts.limit = parseInt(args[++i], 10);
    else if (!a.startsWith('--')) opts.id = a;
  }
  return opts;
}

async function searchAnnualReports(page, name) {
  try {
    const searchUrl = `https://www.annualreports.com/Companies?search=${encodeURIComponent(name)}`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await new Promise(r => setTimeout(r, 1500));

    // Find first matching company link
    const compLink = await page.evaluate((searchName) => {
      const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
      const target = norm(searchName);
      for (const a of document.querySelectorAll('a[href]')) {
        const text = (a.textContent || '').trim();
        if (text.length < 3) continue;
        if (norm(text).includes(target.slice(0, 6)) || target.includes(norm(text).slice(0, 6))) {
          return a.href;
        }
      }
      return null;
    }, name);

    if (!compLink) return null;

    // Navigate to company page
    await page.goto(compLink, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await new Promise(r => setTimeout(r, 1500));

    // Find most recent annual report PDF link
    const pdfUrl = await page.evaluate(() => {
      const links = [];
      document.querySelectorAll('a[href]').forEach(a => {
        const href = a.href;
        const text = (a.textContent || '').trim();
        if (!/\.pdf(\?|$)/i.test(href)) return;
        if (/annual/i.test(text) || /annual/i.test(href)) {
          // Try to extract year from text or href for ranking
          const yearMatch = (text + href).match(/20(2[0-9])/);
          const year = yearMatch ? parseInt(yearMatch[0], 10) : 0;
          links.push({ href, year });
        }
      });
      links.sort((a, b) => b.year - a.year);
      return links[0]?.href || null;
    });

    return pdfUrl;
  } catch (e) { return null; }
}

async function searchBing(page, name) {
  try {
    const url = `https://www.bing.com/search?q=${encodeURIComponent(name + ' annual report 2024 filetype:pdf')}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await new Promise(r => setTimeout(r, 1500));

    const pdfs = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('a[href]').forEach(a => {
        const href = a.href;
        if (/\.pdf(\?|$)/i.test(href) && !/bing\.com/i.test(href)) out.push(href);
      });
      return out.slice(0, 5);
    });
    return pdfs[0] || null;
  } catch (e) { return null; }
}

async function discover(corp, browser) {
  if (corp.direct_pdf_url) return { id: corp.id, status: 'CACHED', url: corp.direct_pdf_url };

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

  let url = null;
  let source = '';

  try {
    url = await searchAnnualReports(page, corp.name);
    if (url) source = 'annualreports.com';

    if (!url) {
      url = await searchBing(page, corp.name);
      if (url) source = 'bing';
    }
  } catch (e) {}
  finally { await page.close(); }

  return { id: corp.id, status: url ? 'DISCOVERED' : 'NOT_FOUND', url, source };
}

async function main() {
  const opts = parseArgs();
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  let list = catalog.corporates.filter(c => !c.direct_pdf_url);
  if (opts.id)    list = list.filter(c => c.id === opts.id);
  if (opts.limit) list = list.slice(0, opts.limit);

  console.log(`[discover] Processing ${list.length} corporates lacking direct_pdf_url...`);

  const browser = await getBrowser();

  let found = 0;
  for (const corp of list) {
    process.stdout.write(`  ${corp.id.padEnd(28)} ... `);
    const r = await discover(corp, browser);
    if (r.status === 'DISCOVERED') {
      const idx = catalog.corporates.findIndex(c => c.id === corp.id);
      catalog.corporates[idx].direct_pdf_url = r.url;
      catalog.corporates[idx].direct_pdf_source = r.source;
      found++;
      console.log(`OK (${r.source})`);
    } else {
      console.log('NOT_FOUND');
    }
    // Persist incrementally
    fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2));
  }

  await browser.close();
  console.log(`\n[discover] Found ${found}/${list.length} URLs.`);
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
