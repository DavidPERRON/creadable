#!/usr/bin/env node
/**
 * Bank Annual Report Downloader
 *
 * For each bank in bank_techstack.json:
 *   1) direct_pdf_url → curl download (Tier 0, most reliable)
 *   2) ir_url → Puppeteer scrape for PDF link (Tier 1-3)
 *   3) DuckDuckGo fallback (Tier 4)
 *
 * Downloads to: ../../scraper/pdfs/<bank_id>_annual_report.pdf
 * Extracts text: ../../scraper/pdfs/<bank_id>_annual_report.txt
 *
 * Idempotent: skips already-downloaded files.
 *
 * Run:
 *   node engine/bank_downloader.js            # all banks
 *   node engine/bank_downloader.js kb-cz      # specific id
 *   node engine/bank_downloader.js --limit 10
 *   node engine/bank_downloader.js --retry    # retry previously failed only
 */

const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const { getBrowser } = require('../../corporate_scraper/engine/browser');
const pdfParse = require('pdf-parse');

const ROOT = path.join(__dirname, '..');
const REPO_ROOT = path.join(ROOT, '..');
const TECHSTACK_PATH = path.join(ROOT, 'data', 'bank_techstack.json');
const PDF_DIR = path.join(REPO_ROOT, 'scraper', 'pdfs');

const CHROME_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const PDF_LINK_HINTS = /annual.?report|registration document|integrated report|financial report|rapport annuel|jahresbericht|annual results|informe.anual|pillar.?3|annual review|geschäftsbericht|relazione annuale|memoria anual|raport roczny|výroční zpráva|éves jelentés/i;

const CONSENT_PATTERNS = /accept|agree|allow|accepter|akzeptieren|accepteren|aceptar|accetto|zgadzam|accetta|souhlasim|elfogad|ok$|got it|understood|i understand|continue|proceed|close|dismiss|no thanks|later/i;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { id: null, limit: null, retryFailed: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--limit') opts.limit = parseInt(args[++i], 10);
    else if (a === '--retry') opts.retryFailed = true;
    else if (!a.startsWith('--')) opts.id = a;
  }
  return opts;
}

async function dismissConsent(page) {
  try {
    await page.evaluate((patSrc) => {
      const re = new RegExp(patSrc, 'i');
      const candidates = [...document.querySelectorAll('button, a[role="button"], input[type="button"], input[type="submit"], [class*="cookie"] button, [class*="consent"] button, [class*="gdpr"] button, [id*="cookie"] button, [id*="consent"] button')];
      for (const el of candidates) {
        const t = (el.textContent || el.value || el.ariaLabel || '').trim();
        if (re.test(t) && t.length < 50) { el.click(); return true; }
      }
      return false;
    }, CONSENT_PATTERNS.source);
    await sleep(800);
  } catch (e) {}
}

async function waitForPdfLinks(page, maxWait = 6000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    const count = await page.evaluate(() =>
      document.querySelectorAll('a[href$=".pdf"], a[href*=".pdf?"]').length
    ).catch(() => 0);
    if (count > 0) break;
    await sleep(500);
  }
}

async function findPdfLink(page, url, depth = 0) {
  if (depth > 2) return null;
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 35000 });
  } catch (e) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await sleep(3000);
    } catch (e2) { return null; }
  }

  await dismissConsent(page);
  await waitForPdfLinks(page, 5000);

  // Tier 1: PDF links with annual report hints
  const directPdfs = await page.evaluate((hintReSrc) => {
    const re = new RegExp(hintReSrc, 'i');
    const out = [];
    document.querySelectorAll('a[href]').forEach(a => {
      const href = a.href;
      const text = (a.textContent || a.title || '').trim();
      if (!href) return;
      const isPdf = /\.pdf(\?|#|$)/i.test(href);
      const isDataHref = (a.getAttribute('data-href') || '').match(/\.pdf/i);
      if (!isPdf && !isDataHref) return;
      const finalHref = isPdf ? href : a.getAttribute('data-href');
      const score = (re.test(text) ? 2 : 0) + (re.test(finalHref) ? 1 : 0);
      if (score > 0) out.push({ href: finalHref, text: text.slice(0, 80), score });
    });
    return out.sort((a, b) => b.score - a.score).slice(0, 5);
  }, PDF_LINK_HINTS.source);
  if (directPdfs[0]) return directPdfs[0].href;

  // Tier 2: Any PDF link (skip quarterly/interim)
  const anyPdf = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('a[href]').forEach(a => {
      const href = a.href;
      if (!href || !/\.pdf(\?|#|$)/i.test(href)) return;
      const text = (a.textContent || '').trim().toLowerCase();
      if (/quarterly|interim|press release|q[1-4][\s_-]|q[1-4]$|pillar.?2|pillar.?1\b/.test(text)) return;
      out.push({ href, text: text.slice(0, 80) });
    });
    return out.slice(0, 10);
  });
  if (anyPdf[0]) return anyPdf[0].href;

  // Tier 3: Follow sub-pages with annual report hints
  if (depth < 2) {
    const subPages = await page.evaluate((hintReSrc) => {
      const re = new RegExp(hintReSrc, 'i');
      const currentHost = location.hostname;
      const out = [];
      document.querySelectorAll('a[href]').forEach(a => {
        const href = a.href;
        const text = (a.textContent || '').trim();
        if (!href || /\.(pdf|jpg|png|gif|zip|xlsx|doc)(\?|$)/i.test(href)) return;
        try { if (new URL(href).hostname !== currentHost) return; } catch (e) {}
        if (re.test(text) || re.test(href)) out.push({ href, text: text.slice(0, 80) });
      });
      return out.slice(0, 4);
    }, PDF_LINK_HINTS.source);
    for (const sub of subPages) {
      const found = await findPdfLink(page, sub.href, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

async function downloadPdf(url, dest, referer = '') {
  const curlArgs = [
    '-L', '-s', '-o', dest,
    '-A', CHROME_UA,
    '-H', 'Accept: application/pdf,application/octet-stream,*/*;q=0.8',
    '-H', 'Accept-Language: en-US,en;q=0.9',
    '-H', 'Accept-Encoding: gzip, deflate, br',
    '--compressed',
    '--max-time', '90',
    '--max-filesize', '80M',
    '--retry', '2',
    '--retry-delay', '3',
  ];
  if (referer) curlArgs.push('-H', `Referer: ${referer}`);
  curlArgs.push(url);

  try {
    execFileSync('curl', curlArgs, { stdio: ['ignore', 'ignore', 'ignore'] });
    if (!fs.existsSync(dest)) return false;
    const stat = fs.statSync(dest);
    if (stat.size < 10000) { fs.unlinkSync(dest); return false; }
    const fd = fs.openSync(dest, 'r');
    const buf = Buffer.alloc(4);
    fs.readSync(fd, buf, 0, 4, 0);
    fs.closeSync(fd);
    if (buf.toString() !== '%PDF') { fs.unlinkSync(dest); return false; }
    return true;
  } catch (e) { return false; }
}

async function extractText(pdf, txt) {
  try {
    execFileSync('pdftotext', ['-layout', '-enc', 'UTF-8', pdf, txt], {
      stdio: ['ignore', 'ignore', 'ignore'],
    });
    if (fs.existsSync(txt) && fs.statSync(txt).size > 1000) return true;
  } catch (e) {}
  try {
    const data = await pdfParse(fs.readFileSync(pdf));
    if (!data.text || data.text.length < 1000) return false;
    fs.writeFileSync(txt, data.text, 'utf8');
    return true;
  } catch (e) { return false; }
}

async function searchDuckDuckGoForPdf(page, bank) {
  const queries = [
    `"${bank.name}" annual report 2024 filetype:pdf`,
    `"${bank.name}" annual report 2023 filetype:pdf`,
    `"${bank.name}" rapport annuel 2024 filetype:pdf`,
    `"${bank.name}" jahresbericht 2024 filetype:pdf`,
    `site:${(bank.ir_url || '').replace(/https?:\/\/([^/]+).*/, '$1')} annual report 2024 pdf`,
  ];
  for (const q of queries) {
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await sleep(1500);
      const pdfs = await page.evaluate(() => {
        const out = [];
        document.querySelectorAll('a[href]').forEach(a => {
          let href = a.href;
          const m = href.match(/uddg=([^&]+)/);
          if (m) href = decodeURIComponent(m[1]);
          if (/\.pdf(\?|#|$)/i.test(href)) out.push(href);
        });
        return out.slice(0, 5);
      });
      if (pdfs.length > 0) return pdfs[0];
    } catch (e) {}
  }
  return null;
}

async function processBank(bank, browser, attempt = 1) {
  const pdfPath = path.join(PDF_DIR, `${bank.bank_id}_annual_report.pdf`);
  const txtPath = path.join(PDF_DIR, `${bank.bank_id}_annual_report.txt`);

  if (fs.existsSync(pdfPath) && fs.existsSync(txtPath) && fs.statSync(txtPath).size > 1000) {
    return { id: bank.bank_id, status: 'CACHED' };
  }

  const page = await browser.newPage();
  await page.setUserAgent(CHROME_UA);
  await page.setViewport({ width: 1280, height: 800 });
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  });

  let result = { id: bank.bank_id, status: 'FAIL', reason: '' };
  let pdfUrl = null;
  let referer = '';

  try {
    if (bank.direct_pdf_url) {
      pdfUrl = bank.direct_pdf_url;
      referer = bank.ir_url || '';
    }
    if (!pdfUrl && bank.ir_url) {
      referer = bank.ir_url;
      pdfUrl = await findPdfLink(page, bank.ir_url);
    }
    if (!pdfUrl) {
      pdfUrl = await searchDuckDuckGoForPdf(page, bank);
    }

    if (!pdfUrl) {
      result.reason = 'no_pdf_found';
    } else {
      const ok = await downloadPdf(pdfUrl, pdfPath, referer);
      if (!ok) {
        if (attempt < 3) {
          await page.close();
          await sleep(attempt * 2000);
          return processBank(bank, browser, attempt + 1);
        }
        result.reason = 'download_failed';
      } else {
        const txtOk = await extractText(pdfPath, txtPath);
        if (!txtOk) {
          result.reason = 'text_extraction_failed';
        } else {
          result = {
            id: bank.bank_id,
            status: 'OK',
            pdfBytes: fs.statSync(pdfPath).size,
            txtBytes: fs.statSync(txtPath).size,
            sourceUrl: pdfUrl,
          };
        }
      }
    }
  } catch (e) {
    result.reason = `exception: ${e.message.slice(0, 120)}`;
    if (attempt < 3) {
      await page.close().catch(() => {});
      await sleep(attempt * 3000);
      return processBank(bank, browser, attempt + 1);
    }
  } finally {
    await page.close().catch(() => {});
  }
  return result;
}

async function main() {
  const opts = parseArgs();
  fs.mkdirSync(PDF_DIR, { recursive: true });

  const techstack = JSON.parse(fs.readFileSync(TECHSTACK_PATH, 'utf8'));
  let banks = techstack.banks;

  if (opts.id) {
    banks = banks.filter(b => b.bank_id === opts.id);
  } else if (opts.retryFailed) {
    const manifestPath = path.join(ROOT, 'reports', 'bank_download_manifest.json');
    if (fs.existsSync(manifestPath)) {
      const prev = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      const failedIds = new Set(prev.filter(r => r.status === 'FAIL').map(r => r.id));
      banks = banks.filter(b => failedIds.has(b.bank_id));
      console.log(`[bank_downloader] Retrying ${banks.length} previously failed banks...`);
    }
  }

  if (opts.limit) banks = banks.slice(0, opts.limit);

  console.log(`[bank_downloader] Processing ${banks.length} banks...`);
  const browser = await getBrowser();
  const results = [];

  for (const bank of banks) {
    process.stdout.write(`  ${bank.bank_id.padEnd(32)} ${(bank.country||'??').padEnd(3)} ... `);
    const r = await processBank(bank, browser);
    results.push(r);
    if (r.status === 'OK')          console.log(`OK (${Math.round(r.pdfBytes/1024)}KB pdf, ${Math.round(r.txtBytes/1024)}KB txt)`);
    else if (r.status === 'CACHED') console.log('cached');
    else                            console.log(`FAIL — ${r.reason}`);
    // Polite delay between banks to avoid rate limiting
    if (r.status !== 'CACHED') await sleep(1500);
  }

  await browser.close();

  const stats = results.reduce((s, r) => ({ ...s, [r.status]: (s[r.status] || 0) + 1 }), {});
  console.log(`\n[bank_downloader] Stats:`, stats);

  const manifestPath = path.join(ROOT, 'reports', 'bank_download_manifest.json');
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });

  // Merge with existing manifest if present (preserve cached results)
  let existing = [];
  if (fs.existsSync(manifestPath)) {
    try { existing = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch (e) {}
  }
  const merged = Object.values(
    [...existing, ...results].reduce((m, r) => { m[r.id] = r; return m; }, {})
  );
  fs.writeFileSync(manifestPath, JSON.stringify(merged, null, 2));
  console.log(`[bank_downloader] Manifest: ${manifestPath}`);
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
