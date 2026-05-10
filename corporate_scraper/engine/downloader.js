#!/usr/bin/env node
/**
 * Annual Report Downloader
 *
 * For each corporate in catalog.json:
 *   1) Visit IR page with Puppeteer (handles JS-rendered pages)
 *   2) Find the most recent annual report PDF link
 *   3) Download to pdfs/<id>_<year>.pdf
 *   4) Extract text via pdftotext (or pdf-parse fallback) to text/<id>_<year>.txt
 *
 * Idempotent: skips already-downloaded files.
 *
 * Run:
 *   node engine/downloader.js              # all corporates
 *   node engine/downloader.js nestle       # specific id
 *   node engine/downloader.js --country DE # all DE corporates
 *   node engine/downloader.js --limit 10   # first 10
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { getBrowser } = require('./browser');
const pdfParse = require('pdf-parse');

const ROOT = path.join(__dirname, '..');
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog.json'), 'utf8'));
const PDF_DIR = path.join(ROOT, 'pdfs');
const TXT_DIR = path.join(ROOT, 'text');

const PDF_LINK_HINTS = /annual.?report|registration document|integrated report|financial report|geschaftsbericht|geschäftsbericht|rapport annuel|rapport.financ|relazione|informe.anual/i;

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { id: null, country: null, limit: null };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--country') opts.country = args[++i];
    else if (a === '--limit')  opts.limit = parseInt(args[++i], 10);
    else if (!a.startsWith('--')) opts.id = a;
  }
  return opts;
}

function corporatesToProcess(opts) {
  let list = CATALOG.corporates;
  if (opts.id)      list = list.filter(c => c.id === opts.id);
  if (opts.country) list = list.filter(c => c.country === opts.country);
  if (opts.limit)   list = list.slice(0, opts.limit);
  return list;
}

async function findPdfLink(page, url, depth = 0) {
  if (depth > 2) return null;
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  } catch (e) {
    return null;
  }
  // Wait for JS-loaded content
  await new Promise(r => setTimeout(r, 3000));

  // Try clicking accept-cookies if present (broad selector)
  try {
    await page.evaluate(() => {
      const buttons = [...document.querySelectorAll('button, a')];
      for (const b of buttons) {
        const t = (b.textContent || '').toLowerCase();
        if (/accept|agree|allow|accepter|ok|got it/.test(t) && t.length < 30) { b.click(); break; }
      }
    });
    await new Promise(r => setTimeout(r, 1000));
  } catch (e) {}

  // Tier 1: direct .pdf links containing annual-report-ish hints
  const directPdfs = await page.evaluate((hintReSrc) => {
    const re = new RegExp(hintReSrc, 'i');
    const out = [];
    document.querySelectorAll('a[href]').forEach(a => {
      const href = a.href;
      const text = (a.textContent || '').trim();
      if (!href || !/\.pdf(\?|$)/i.test(href)) return;
      const score = (re.test(text) ? 2 : 0) + (re.test(href) ? 1 : 0);
      if (score > 0) out.push({ href, text: text.slice(0, 80), score });
    });
    return out.sort((a, b) => b.score - a.score).slice(0, 5);
  }, PDF_LINK_HINTS.source);
  if (directPdfs[0]) return directPdfs[0].href;

  // Tier 2: any direct .pdf link (sites use "Download report" without title hint)
  const anyPdf = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('a[href]').forEach(a => {
      const href = a.href;
      if (!href || !/\.pdf(\?|$)/i.test(href)) return;
      const text = (a.textContent || '').trim().toLowerCase();
      // Skip obviously non-annual-report PDFs
      if (/quarterly|interim|press release|q1|q2|q3|q4|esg only|sustainability only/.test(text)) return;
      out.push({ href, text: text.slice(0, 80) });
    });
    return out.slice(0, 10);
  });
  if (anyPdf[0]) return anyPdf[0].href;

  // Tier 3: navigate to most likely "annual report" sub-page and recurse
  if (depth < 2) {
    const subPages = await page.evaluate((hintReSrc) => {
      const re = new RegExp(hintReSrc, 'i');
      const out = [];
      document.querySelectorAll('a[href]').forEach(a => {
        const href = a.href;
        const text = (a.textContent || '').trim();
        if (!href || /\.(pdf|jpg|png|gif|zip)(\?|$)/i.test(href)) return;
        if (re.test(text) || re.test(href)) {
          out.push({ href, text: text.slice(0, 80) });
        }
      });
      return out.slice(0, 3);
    }, PDF_LINK_HINTS.source);

    for (const sub of subPages) {
      const found = await findPdfLink(page, sub.href, depth + 1);
      if (found) return found;
    }
  }

  return null;
}

async function downloadPdf(url, dest) {
  // Use curl for binary download (more reliable than Puppeteer here)
  try {
    execFileSync('curl', [
      '-L', '-s', '-o', dest, '-A', 'Mozilla/5.0 (compatible; CorporateScraper/1.0)',
      '--max-time', '60', '--max-filesize', '50M', url
    ], { stdio: ['ignore', 'ignore', 'ignore'] });
    const stat = fs.statSync(dest);
    if (stat.size < 10000) {
      fs.unlinkSync(dest); // not a real PDF
      return false;
    }
    // Verify PDF magic bytes
    const fd = fs.openSync(dest, 'r');
    const buf = Buffer.alloc(4);
    fs.readSync(fd, buf, 0, 4, 0);
    fs.closeSync(fd);
    if (buf.toString() !== '%PDF') {
      fs.unlinkSync(dest);
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

async function extractText(pdf, txt) {
  // Try pdftotext first (preserves layout better), fall back to pdf-parse
  try {
    execFileSync('pdftotext', ['-layout', '-enc', 'UTF-8', pdf, txt], {
      stdio: ['ignore', 'ignore', 'ignore'],
    });
    if (fs.existsSync(txt) && fs.statSync(txt).size > 1000) return true;
  } catch (e) { /* pdftotext not available, use pdf-parse */ }

  try {
    const data = await pdfParse(fs.readFileSync(pdf));
    if (!data.text || data.text.length < 1000) return false;
    fs.writeFileSync(txt, data.text, 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

async function searchDuckDuckGoForPdf(page, corp) {
  const queries = [
    `${corp.name} annual report 2024 filetype:pdf`,
    `${corp.name} integrated report 2024 filetype:pdf`,
    `${corp.name} universal registration document 2024 filetype:pdf`,
  ];
  for (const q of queries) {
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await new Promise(r => setTimeout(r, 1500));
      const pdfs = await page.evaluate(() => {
        const out = [];
        document.querySelectorAll('a[href]').forEach(a => {
          let href = a.href;
          // DDG wraps results: //duckduckgo.com/l/?uddg=ENCODED_REAL_URL
          const m = href.match(/uddg=([^&]+)/);
          if (m) href = decodeURIComponent(m[1]);
          if (/\.pdf(\?|$)/i.test(href)) out.push({ href, text: (a.textContent || '').trim().slice(0, 80) });
        });
        return out.slice(0, 5);
      });
      if (pdfs.length > 0) return pdfs[0].href;
    } catch (e) { /* try next query */ }
  }
  return null;
}

async function processCorporate(corp, browser) {
  const year = new Date().getFullYear();
  const pdfPath = path.join(PDF_DIR, `${corp.id}_${year}.pdf`);
  const txtPath = path.join(TXT_DIR, `${corp.id}_${year}.txt`);

  // Check if both already exist
  if (fs.existsSync(pdfPath) && fs.existsSync(txtPath) && fs.statSync(txtPath).size > 1000) {
    return { id: corp.id, status: 'CACHED', pdfPath, txtPath };
  }

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
  await page.setViewport({ width: 1280, height: 800 });

  let result = { id: corp.id, status: 'FAIL', reason: '' };

  try {
    let pdfUrl = null;

    // Tier 0: explicit direct_pdf_url in catalog (most reliable)
    if (corp.direct_pdf_url) pdfUrl = corp.direct_pdf_url;

    // Tier 1+2+3: navigate IR page and find PDF links
    if (!pdfUrl) pdfUrl = await findPdfLink(page, corp.ir_url);

    // Tier 4: DuckDuckGo search fallback
    if (!pdfUrl) pdfUrl = await searchDuckDuckGoForPdf(page, corp);

    if (!pdfUrl) {
      result.reason = 'no_pdf_found_on_ir_page';
    } else {
      const ok = await downloadPdf(pdfUrl, pdfPath);
      if (!ok) {
        result.reason = 'download_failed';
      } else {
        const txtOk = await extractText(pdfPath, txtPath);
        if (!txtOk) {
          result.reason = 'pdftotext_failed';
        } else {
          result = {
            id: corp.id,
            status: 'OK',
            pdfPath,
            txtPath,
            pdfBytes: fs.statSync(pdfPath).size,
            txtBytes: fs.statSync(txtPath).size,
            sourceUrl: pdfUrl,
          };
        }
      }
    }
  } catch (e) {
    result.reason = `exception: ${e.message.slice(0, 80)}`;
  } finally {
    await page.close();
  }

  return result;
}

async function main() {
  const opts = parseArgs();
  const list = corporatesToProcess(opts);
  console.log(`[downloader] Processing ${list.length} corporates...`);

  fs.mkdirSync(PDF_DIR, { recursive: true });
  fs.mkdirSync(TXT_DIR, { recursive: true });

  const browser = await getBrowser();

  const results = [];
  for (const corp of list) {
    process.stdout.write(`  ${corp.id.padEnd(28)} ${corp.country} ... `);
    const r = await processCorporate(corp, browser);
    results.push(r);
    if (r.status === 'OK')          console.log(`OK (${Math.round(r.pdfBytes/1024)}KB pdf, ${Math.round(r.txtBytes/1024)}KB txt)`);
    else if (r.status === 'CACHED') console.log(`cached`);
    else                            console.log(`FAIL — ${r.reason}`);
  }

  await browser.close();

  const stats = results.reduce((s, r) => ({ ...s, [r.status]: (s[r.status] || 0) + 1 }), {});
  console.log(`\n[downloader] Stats:`, stats);

  // Persist manifest
  const manifestPath = path.join(ROOT, 'reports', 'download_manifest.json');
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(results, null, 2));
  console.log(`[downloader] Manifest: ${manifestPath}`);
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
