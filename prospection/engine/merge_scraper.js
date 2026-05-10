#!/usr/bin/env node
/**
 * Merge scraper output into the prospection DB
 *
 * Run:  node prospection/engine/merge_scraper.js <scraper_json_path>
 *
 * For each bank in the scraper output:
 *  - If bank exists in DB → append new TF signals (deduplicated by verbatim hash)
 *  - Detect trigger candidates: GTR articles with bank name in title (last 12 mo)
 *  - Update last_updated
 *
 * Idempotent: re-running same scraper output produces no diff.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '..', 'data', 'banks.json');
const TODAY = new Date('2026-05-10').toISOString().slice(0,10);

function hashSignal(s) {
  return crypto.createHash('sha1').update((s.verbatim || '') + (s.source || '')).digest('hex').slice(0,12);
}

function findBankInDb(db, scraperBankName) {
  const norm = (x) => x.toLowerCase().replace(/[^a-z0-9]/g, '');
  const target = norm(scraperBankName);
  return db.find(b =>
    norm(b.name) === target ||
    norm(b.id.split('-')[0]) === target.slice(0, norm(b.id.split('-')[0]).length)
  );
}

function extractGtrArticles(scraperBank) {
  const press = scraperBank.press || {};
  const out = [];
  for (const [src, data] of Object.entries(press)) {
    if (!data?.snippets) continue;
    for (const snippet of data.snippets) {
      const m = snippet.match(/(\d+) post\(s\) for term[^]*?\b(January|February|March|April|May|June|July|August|September|October|November|December) (\d{1,2}),? (\d{4})/i);
      if (m) {
        const date = new Date(`${m[2]} ${m[3]}, ${m[4]}`).toISOString().slice(0,10);
        out.push({ source: src.toUpperCase(), date, verbatim: snippet.slice(0, 200) });
      }
    }
  }
  return out;
}

function mergeBank(dbBank, scraperBank) {
  if (!dbBank.tf_signals) dbBank.tf_signals = [];
  const existingHashes = new Set(dbBank.tf_signals.map(hashSignal));

  let added = 0;

  // 1. Web signals as TF signals (filter for substance)
  const webSignals = scraperBank.web?.signals || {};
  for (const [keyword, hits] of Object.entries(webSignals)) {
    for (const hit of (hits.slice(0,1) || [])) {
      if (!hit || hit.length < 50) continue;
      const sig = { source: 'Scraper-web', date: TODAY, verbatim: hit.slice(0, 240) };
      const h = hashSignal(sig);
      if (!existingHashes.has(h)) {
        dbBank.tf_signals.push(sig);
        existingHashes.add(h);
        added++;
      }
    }
  }

  // 2. PDF signals
  const pdfSignals = scraperBank.pdf?.signals || {};
  for (const [keyword, hits] of Object.entries(pdfSignals)) {
    for (const hit of (hits.slice(0,1) || [])) {
      if (!hit || hit.length < 50) continue;
      const sig = { source: 'Scraper-PDF', date: TODAY, verbatim: hit.slice(0, 240) };
      const h = hashSignal(sig);
      if (!existingHashes.has(h)) {
        dbBank.tf_signals.push(sig);
        existingHashes.add(h);
        added++;
      }
    }
  }

  // 3. Detected GTR trigger candidates
  const triggers = extractGtrArticles(scraperBank);
  if (!dbBank.triggers) dbBank.triggers = [];
  const existingTriggerKeys = new Set(dbBank.triggers.map(t => `${t.type}-${t.date}`));
  for (const t of triggers) {
    const key = `PROFESSIONAL_PRESS-${t.date}`;
    if (!existingTriggerKeys.has(key)) {
      dbBank.triggers.push({
        type: 'PROFESSIONAL_PRESS',
        date: t.date,
        source: t.source,
        description: `Détecté via scraper: ${t.verbatim.slice(0,140)}`
      });
      added++;
    }
  }

  dbBank.last_updated = TODAY;
  return added;
}

function main() {
  const scraperPath = process.argv[2];
  if (!scraperPath) {
    console.error('Usage: node merge_scraper.js <scraper_json_path>');
    process.exit(1);
  }

  const scraperData = JSON.parse(fs.readFileSync(scraperPath, 'utf8'));
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

  let totalAdded = 0;
  let matched = 0;
  let unmatched = [];

  for (const sb of scraperData) {
    const dbBank = findBankInDb(db, sb.name);
    if (!dbBank) {
      unmatched.push(sb.name);
      continue;
    }
    const added = mergeBank(dbBank, sb);
    matched++;
    totalAdded += added;
    if (added > 0) console.log(`  + ${added} signals/triggers → ${dbBank.name}`);
  }

  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  console.log(`\nMatched ${matched}/${scraperData.length} banks. Added ${totalAdded} new entries.`);
  if (unmatched.length) console.log(`Unmatched: ${unmatched.join(', ')}`);
}

if (require.main === module) main();
