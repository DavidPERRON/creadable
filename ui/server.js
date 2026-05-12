#!/usr/bin/env node
/**
 * CredAble Intelligence — Control Panel
 * Web UI pour piloter le pipeline corporate_scraper + bank_intelligence
 */

const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3333;
const ROOT = path.join(__dirname, '..');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── In-memory state ────────────────────────────────────────────
let apiKey = process.env.DEEPINFRA_API_KEY || '';
let activeJobs = {};        // jobId → { proc, clients[], log[] }
let jobCounter = 0;

// ─── SSE helper ─────────────────────────────────────────────────
function sseHeaders(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
}
function sseWrite(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// ─── Config API ─────────────────────────────────────────────────
app.get('/api/config', (req, res) => {
  res.json({
    api_key_set: !!apiKey,
    api_key_preview: apiKey ? apiKey.slice(0, 8) + '...' : null,
  });
});

app.post('/api/config', (req, res) => {
  const { api_key } = req.body;
  if (api_key) apiKey = api_key.trim();
  res.json({ ok: true });
});

// ─── Stats API ───────────────────────────────────────────────────
app.get('/api/stats', (req, res) => {
  const countFiles = (dir, ext) => {
    try { return fs.readdirSync(dir).filter(f => f.endsWith(ext)).length; }
    catch { return 0; }
  };
  const readJson = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } };

  const catalog = readJson(path.join(ROOT, 'corporate_scraper/catalog.json'));
  const bisScores = readJson(path.join(ROOT, 'bank_intelligence/reports/bis_scores.json'));
  const techstack = readJson(path.join(ROOT, 'bank_intelligence/data/bank_techstack.json'));

  res.json({
    corporates: {
      total: catalog?.corporates?.length ?? 0,
      with_url: catalog?.corporates?.filter(c => c.direct_pdf_url)?.length ?? 0,
      pdfs: countFiles(path.join(ROOT, 'corporate_scraper/pdfs'), '.pdf'),
      texts: countFiles(path.join(ROOT, 'corporate_scraper/text'), '.txt'),
      extractions: countFiles(path.join(ROOT, 'corporate_scraper/extractions'), '.json'),
    },
    banks: {
      techstack: techstack?.banks?.length ?? 0,
      bis_scored: bisScores?.banks?.length ?? 0,
      bis_high: bisScores?.banks?.filter(b => b.bucket === 'HIGH')?.length ?? 0,
      bis_extractions: countFiles(path.join(ROOT, 'bank_intelligence/extractions'), '.json'),
    },
    reports: {
      bis_dashboard: fs.existsSync(path.join(ROOT, 'bank_intelligence/reports/bis_dashboard.html')),
      corporate_dashboard: fs.existsSync(path.join(ROOT, 'corporate_scraper/reports/dashboard.html')),
    }
  });
});

// ─── Data files API ─────────────────────────────────────────────
const DATA_FILES = {
  bank_techstack:          'bank_intelligence/data/bank_techstack.json',
  fintech_failures:        'bank_intelligence/data/fintech_failures.json',
  competitor_intelligence: 'bank_intelligence/data/competitor_intelligence.json',
  bis_scores:              'bank_intelligence/reports/bis_scores.json',
  mps_scores:              'bank_intelligence/reports/mps_scores.json',
  predictions:             'bank_intelligence/reports/predictions.json',
  demand_signals:          'corporate_scraper/reports/demand_signals.json',
  catalog:                 'corporate_scraper/catalog.json',
};

app.get('/api/data/:name', (req, res) => {
  const rel = DATA_FILES[req.params.name];
  if (!rel) return res.status(404).json({ error: 'unknown file' });
  try {
    const content = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    res.json({ content });
  } catch (e) {
    res.status(404).json({ error: 'file not found', detail: e.message });
  }
});

app.post('/api/data/:name', (req, res) => {
  const rel = DATA_FILES[req.params.name];
  if (!rel) return res.status(404).json({ error: 'unknown file' });
  const { content } = req.body;
  try {
    JSON.parse(content);  // validate JSON
    fs.writeFileSync(path.join(ROOT, rel), content, 'utf8');
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: 'invalid JSON', detail: e.message });
  }
});

// ─── List extractions ─────────────────────────────────────────────
app.get('/api/extractions/:type', (req, res) => {
  const dirs = {
    corporate: path.join(ROOT, 'corporate_scraper/extractions'),
    bank:      path.join(ROOT, 'bank_intelligence/extractions'),
  };
  const dir = dirs[req.params.type];
  if (!dir) return res.status(404).json({ error: 'unknown type' });
  try {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'))
      .map(f => {
        const stat = fs.statSync(path.join(dir, f));
        return { name: f.replace('.json', ''), updated: stat.mtime };
      })
      .sort((a, b) => new Date(b.updated) - new Date(a.updated));
    res.json({ files });
  } catch {
    res.json({ files: [] });
  }
});

app.get('/api/extraction/:type/:id', (req, res) => {
  const dirs = {
    corporate: path.join(ROOT, 'corporate_scraper/extractions'),
    bank:      path.join(ROOT, 'bank_intelligence/extractions'),
  };
  const dir = dirs[req.params.type];
  if (!dir) return res.status(404).json({ error: 'unknown type' });
  try {
    const content = fs.readFileSync(path.join(dir, req.params.id + '.json'), 'utf8');
    res.json({ content });
  } catch (e) {
    res.status(404).json({ error: 'not found' });
  }
});

// ─── Pipeline runner ─────────────────────────────────────────────
const COMMANDS = {
  // Corporate scraper
  'cs:discover':      { cwd: 'corporate_scraper', cmd: 'node', args: ['engine/discover.js'] },
  'cs:download':      { cwd: 'corporate_scraper', cmd: 'node', args: ['engine/downloader.js'] },
  'cs:extract':            { cwd: 'corporate_scraper', cmd: 'node', args: ['engine/extractor.js'] },
  'cs:extract-with-news':  { cwd: 'corporate_scraper', cmd: 'node', args: ['engine/extractor.js', '--with-news'] },
  'cs:extract-dry':        { cwd: 'corporate_scraper', cmd: 'node', args: ['engine/extractor.js', '--dry-run'] },
  'cs:news':               { cwd: 'corporate_scraper', cmd: 'node', args: ['engine/corp_news.js'] },
  'cs:crossref':           { cwd: 'corporate_scraper', cmd: 'node', args: ['engine/crossref.js'] },
  'cs:demand':             { cwd: 'corporate_scraper', cmd: 'node', args: ['engine/demand_signal.js'] },
  'cs:aggregate':          { cwd: 'corporate_scraper', cmd: 'node', args: ['engine/aggregator.js'] },
  'cs:summary':            { cwd: 'corporate_scraper', cmd: 'node', args: ['engine/summary.js'] },
  'cs:dashboard':          { cwd: 'corporate_scraper', cmd: 'node', args: ['engine/dashboard.js'] },
  'cs:full':               { cwd: 'corporate_scraper', cmd: 'make', args: ['full'] },
  // Bank intelligence
  'bi:download':      { cwd: 'bank_intelligence', cmd: 'node', args: ['engine/bank_downloader.js'] },
  'bi:news':          { cwd: 'bank_intelligence', cmd: 'node', args: ['engine/bank_news.js'] },
  'bi:jobs':          { cwd: 'bank_intelligence', cmd: 'node', args: ['engine/bank_jobs.js'] },
  'bi:extract':       { cwd: 'bank_intelligence', cmd: 'node', args: ['engine/bank_extractor.js'] },
  'bi:bis':           { cwd: 'bank_intelligence', cmd: 'node', args: ['engine/bis_calculator.js'] },
  'bi:report':        { cwd: 'bank_intelligence', cmd: 'make', args: ['report'] },
  'bi:all':           { cwd: 'bank_intelligence', cmd: 'make', args: ['all'] },
  'bi:full':          { cwd: 'bank_intelligence', cmd: 'make', args: ['full'] },
  'bi:predict':       { cwd: 'bank_intelligence', cmd: 'node', args: ['engine/predictor.js'] },
  'bi:mps':           { cwd: 'bank_intelligence', cmd: 'node', args: ['engine/mps_calculator.js'] },
};

app.post('/api/run/:cmd', (req, res) => {
  const def = COMMANDS[req.params.cmd];
  if (!def) return res.status(404).json({ error: 'unknown command' });

  if (req.params.cmd.includes('extract') && !apiKey && !req.params.cmd.includes('dry')) {
    return res.status(400).json({ error: 'DEEPINFRA_API_KEY not set — configure it first' });
  }

  const jobId = ++jobCounter;
  const env = { ...process.env, DEEPINFRA_API_KEY: apiKey };
  const cwd = path.join(ROOT, def.cwd);
  const proc = spawn(def.cmd, def.args, { cwd, env, shell: true });

  activeJobs[jobId] = { proc, clients: [], log: [], done: false, exitCode: null };

  const broadcast = (event, data) => {
    activeJobs[jobId].log.push({ event, data, ts: Date.now() });
    activeJobs[jobId].clients.forEach(c => sseWrite(c, event, data));
  };

  proc.stdout.on('data', d => broadcast('stdout', d.toString()));
  proc.stderr.on('data', d => broadcast('stderr', d.toString()));
  proc.on('close', code => {
    activeJobs[jobId].done = true;
    activeJobs[jobId].exitCode = code;
    broadcast('done', { code });
    setTimeout(() => delete activeJobs[jobId], 300000); // cleanup after 5min
  });

  res.json({ jobId });
});

// Target-specific extraction (corporate or bank by ID)
app.post('/api/run/extract-id/:type/:id', (req, res) => {
  if (!apiKey) return res.status(400).json({ error: 'DEEPINFRA_API_KEY not set' });

  const configs = {
    corporate: { cwd: 'corporate_scraper', cmd: 'node', args: ['engine/extractor.js', req.params.id] },
    bank:      { cwd: 'bank_intelligence',  cmd: 'node', args: ['engine/bank_extractor.js', req.params.id] },
  };
  const def = configs[req.params.type];
  if (!def) return res.status(404).json({ error: 'unknown type' });

  const jobId = ++jobCounter;
  const env = { ...process.env, DEEPINFRA_API_KEY: apiKey };
  const proc = spawn(def.cmd, def.args, { cwd: path.join(ROOT, def.cwd), env, shell: true });

  activeJobs[jobId] = { proc, clients: [], log: [], done: false, exitCode: null };

  const broadcast = (event, data) => {
    activeJobs[jobId].log.push({ event, data, ts: Date.now() });
    activeJobs[jobId].clients.forEach(c => sseWrite(c, event, data));
  };

  proc.stdout.on('data', d => broadcast('stdout', d.toString()));
  proc.stderr.on('data', d => broadcast('stderr', d.toString()));
  proc.on('close', code => {
    activeJobs[jobId].done = true;
    activeJobs[jobId].exitCode = code;
    broadcast('done', { code });
    setTimeout(() => delete activeJobs[jobId], 300000);
  });

  res.json({ jobId });
});

// ─── SSE log stream ──────────────────────────────────────────────
app.get('/api/logs/:jobId', (req, res) => {
  const jobId = parseInt(req.params.jobId);
  const job = activeJobs[jobId];
  if (!job) return res.status(404).json({ error: 'job not found' });

  sseHeaders(res);
  // replay buffered log
  job.log.forEach(({ event, data }) => sseWrite(res, event, data));
  if (job.done) { sseWrite(res, 'done', { code: job.exitCode }); return res.end(); }

  job.clients.push(res);
  const heartbeat = setInterval(() => res.write(": heartbeat\n\n"), 20000);
  req.on('close', () => {
    clearInterval(heartbeat);
    job.clients = job.clients.filter(c => c !== res);
  });
});

// ─── Serve generated reports ─────────────────────────────────────
app.use('/reports/bis', express.static(path.join(ROOT, 'bank_intelligence/reports')));
app.use('/reports/corporate', express.static(path.join(ROOT, 'corporate_scraper/reports')));

app.listen(PORT, () => {
  console.log(`\n  CredAble Intelligence Control Panel`);
  console.log(`  → http://localhost:${PORT}\n`);
});
