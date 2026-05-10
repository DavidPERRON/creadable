#!/usr/bin/env node
/**
 * Trigger Event Detector
 *
 * Pulls RSS feeds + targeted searches, matches new events to banks in DB,
 * appends new triggers to data/banks.json, and produces a weekly digest.
 *
 * Run:        node trigger_engine/detector.js
 * Cron:       0 6 * * MON  (weekly Monday 06:00)
 *
 * Idempotent: events already present in DB triggers are skipped.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { RSS_FEEDS, GOOGLE_QUERIES } = require('./sources');

const DB_PATH = path.join(__dirname, '..', 'data', 'banks.json');
const DIGEST_DIR = path.join(__dirname, '..', 'reports');
const TODAY = new Date('2026-05-10').toISOString().slice(0,10);
const DIGEST_PATH = path.join(DIGEST_DIR, `digest_${TODAY}.md`);

// ─────────────────────────────────────────────────────────────────
// HTTP fetch with timeout
// ─────────────────────────────────────────────────────────────────
function fetchUrl(url, timeoutMs = 10000) {
  return new Promise((resolve) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ProspectionTriggerEngine/1.0)' },
      timeout: timeoutMs,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location, timeoutMs).then(resolve);
      }
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ ok: res.statusCode < 400, status: res.statusCode, body: data }));
    });
    req.on('error', () => resolve({ ok: false, status: 0, body: '' }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, status: 0, body: '' }); });
  });
}

// ─────────────────────────────────────────────────────────────────
// Minimal RSS/Atom parser
// ─────────────────────────────────────────────────────────────────
function parseFeed(xml, feedId) {
  const items = [];
  const itemRe = /<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/g;
  let m;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[2];
    const get = (tag) => {
      const r = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i').exec(block);
      return r ? r[1].replace(/<!\[CDATA\[(.*?)\]\]>/s, '$1').replace(/<[^>]+>/g, '').trim() : '';
    };
    const title = get('title');
    const link = get('link') || (block.match(/<link[^>]*href="([^"]+)"/) || [])[1] || '';
    const pubDate = get('pubDate') || get('published') || get('updated') || '';
    if (title) items.push({ feedId, title, link, pubDate });
  }
  return items;
}

// ─────────────────────────────────────────────────────────────────
// Bank name matching (fuzzy, case-insensitive)
// ─────────────────────────────────────────────────────────────────
function matchBank(text, banks) {
  if (!text) return null;
  const t = text.toLowerCase();
  // Try exact name first, then key tokens
  for (const b of banks) {
    if (t.includes(b.name.toLowerCase())) return b;
  }
  // Partial match on first significant word for multi-word banks
  for (const b of banks) {
    const tokens = b.name.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    if (tokens.length && tokens.every(tok => t.includes(tok))) return b;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────
// Trigger type inference from event text
// ─────────────────────────────────────────────────────────────────
function inferTriggerType(text) {
  const t = text.toLowerCase();
  if (/\b(appoints?|appointed|named|joins?|hired|new head|new ceo)\b/.test(t)) return 'RECRUITMENT';
  if (/\b(acquires?|acquired|acquisition|merger|merges?)\b.*(?:fintech|platform|provider)/.test(t)) return 'FINTECH_PARTNERSHIP_END';
  if (/\b(acquires?|acquired|merger|takeover)\b/.test(t)) return 'M_AND_A';
  if (/\b(rfp|request for proposal|tender|call for tenders)\b/.test(t)) return 'RFP';
  if (/\b(ebrd|ifc|world bank)\b.*(?:facility|program|signed|partners?)/.test(t)) return 'EBRD_PROGRAM';
  if (/\b(fci|factors chain)\b/.test(t)) return 'FCI_MEMBERSHIP';
  if (/\b(allianz|coface|atradius)\b.*(?:upgrade|downgrade)/.test(t)) return 'ALLIANZ_UPGRADE';
  return 'PROFESSIONAL_PRESS';
}

// ─────────────────────────────────────────────────────────────────
// Date parsing (accept multiple formats)
// ─────────────────────────────────────────────────────────────────
function parseDate(s) {
  if (!s) return TODAY;
  const d = new Date(s);
  if (isNaN(d)) return TODAY;
  return d.toISOString().slice(0,10);
}

// ─────────────────────────────────────────────────────────────────
// Trigger dedup key
// ─────────────────────────────────────────────────────────────────
function triggerKey(t) {
  return `${t.type}|${t.date}|${(t.description || '').slice(0,80)}`;
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────
async function main() {
  const banks = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  console.log(`[detector] Loaded ${banks.length} banks from DB.`);

  const allEvents = [];

  // 1) Pull RSS feeds
  console.log('\n[detector] Pulling RSS feeds...');
  for (const feed of RSS_FEEDS) {
    process.stdout.write(`  ${feed.id.padEnd(8)} ... `);
    const res = await fetchUrl(feed.url, 8000);
    if (!res.ok) { console.log(`FAILED (${res.status})`); continue; }
    const items = parseFeed(res.body, feed.id);
    console.log(`${items.length} items`);
    allEvents.push(...items.map(i => ({ ...i, source: feed.name })));
  }

  // 2) Match events to banks → candidate triggers
  console.log(`\n[detector] Matching ${allEvents.length} events against ${banks.length} banks...`);
  const newTriggers = []; // { bank, trigger }

  for (const ev of allEvents) {
    const bank = matchBank(`${ev.title} ${ev.link || ''}`, banks);
    if (!bank) continue;

    const type = inferTriggerType(ev.title);
    const date = parseDate(ev.pubDate);
    const trigger = {
      type,
      date,
      source: ev.source,
      url: ev.link,
      description: ev.title.slice(0, 200),
    };

    if (!bank.triggers) bank.triggers = [];
    const existingKeys = new Set(bank.triggers.map(triggerKey));
    if (!existingKeys.has(triggerKey(trigger))) {
      bank.triggers.push(trigger);
      newTriggers.push({ bank, trigger });
    }
  }

  // 3) Persist DB
  if (newTriggers.length > 0) {
    fs.writeFileSync(DB_PATH, JSON.stringify(banks, null, 2));
    console.log(`\n[detector] Wrote ${newTriggers.length} new triggers to DB.`);
  } else {
    console.log('\n[detector] No new triggers detected.');
  }

  // 4) Generate weekly digest
  fs.mkdirSync(DIGEST_DIR, { recursive: true });
  const digest = generateDigest(newTriggers, allEvents.length);
  fs.writeFileSync(DIGEST_PATH, digest);
  console.log(`[detector] Digest written to ${DIGEST_PATH}`);

  console.log(`\n[detector] Recommend next: cd prospection && make all`);
}

function generateDigest(newTriggers, eventsScanned) {
  if (newTriggers.length === 0) {
    return `# Trigger Digest — ${TODAY}\n\nAucun nouveau trigger détecté sur ${eventsScanned} événements scannés.\n`;
  }
  const byType = newTriggers.reduce((acc, { trigger }) => {
    acc[trigger.type] = (acc[trigger.type] || 0) + 1;
    return acc;
  }, {});

  return `# Trigger Digest — ${TODAY}

**Événements scannés** : ${eventsScanned}
**Nouveaux triggers ajoutés** : ${newTriggers.length}

## Distribution par type

${Object.entries(byType).map(([t, n]) => `- **${t}** : ${n}`).join('\n')}

## Détail

${newTriggers.map(({ bank, trigger }) => `### ${bank.name} (${bank.country}) — ${trigger.type}
- **Date** : ${trigger.date}
- **Source** : ${trigger.source}
- **URL** : ${trigger.url || '*n/a*'}
- **Description** : ${trigger.description}
`).join('\n')}

---

*Régénérer le rapport : \`cd prospection && make all\`*
`;
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
module.exports = { matchBank, inferTriggerType, parseFeed };
