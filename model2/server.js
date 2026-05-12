#!/usr/bin/env node
/**
 * CredAble Intelligence — Model 2 (MPS) Control Panel
 * Port 3334 — standalone, does not affect Model 1
 */

const express = require('express');
const { spawn } = require('child_process');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3334;
const ROOT = path.join(__dirname, '..');

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── SSE helper ─────────────────────────────────────────────────
let activeJobs = {};
let jobCounter = 0;

function sseHeaders(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
}
function sseWrite(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function readJson(rel) {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8')); } catch { return null; }
}

// ─── Data endpoints ─────────────────────────────────────────────
app.get('/api/mps', (req, res) => {
  const data = readJson('bank_intelligence/reports/mps_scores.json');
  if (!data) return res.status(404).json({ error: 'mps_scores.json not found — run MPS first' });
  res.json(data);
});

app.get('/api/bis', (req, res) => {
  const data = readJson('bank_intelligence/reports/bis_scores.json');
  if (!data) return res.status(404).json({ error: 'bis_scores.json not found' });
  res.json(data);
});

app.get('/api/catalog', (req, res) => {
  const data = readJson('corporate_scraper/catalog.json');
  if (!data) return res.status(404).json({ error: 'catalog.json not found' });
  res.json(data);
});

app.get('/api/extraction/:id', (req, res) => {
  const fp = path.join(ROOT, 'corporate_scraper/extractions', req.params.id + '.json');
  try {
    res.json(JSON.parse(fs.readFileSync(fp, 'utf8')));
  } catch {
    res.status(404).json({ error: 'not found' });
  }
});

app.get('/api/stats', (req, res) => {
  const mps = readJson('bank_intelligence/reports/mps_scores.json');
  const bis = readJson('bank_intelligence/reports/bis_scores.json');
  const cat = readJson('corporate_scraper/catalog.json');
  const countFiles = (dir, ext) => {
    try { return fs.readdirSync(path.join(ROOT, dir)).filter(f => f.endsWith(ext)).length; } catch { return 0; }
  };
  res.json({
    mps_scored:     mps?.banks_scored ?? 0,
    bis_scored:     bis?.banks?.length ?? 0,
    corporates:     cat?.corporates?.length ?? 0,
    extractions:    countFiles('corporate_scraper/extractions', '.json'),
    mps_generated:  mps?.generated_at ?? null,
    bucket_dist:    mps?.bucket_distribution ?? {},
    bis_max:        bis?.banks ? Math.max(...bis.banks.map(b => b.bis?.bis_total || 0)) : 0,
  });
});

// ─── Run MPS calculator ──────────────────────────────────────────
app.post('/api/run/mps', (req, res) => {
  const jobId = ++jobCounter;
  const proc  = spawn('node', ['engine/mps_calculator.js'], {
    cwd: path.join(ROOT, 'bank_intelligence'),
    env: process.env,
    shell: true,
  });

  activeJobs[jobId] = { proc, clients: [], log: [], done: false, exitCode: null };

  const broadcast = (event, data) => {
    activeJobs[jobId].log.push({ event, data });
    activeJobs[jobId].clients.forEach(c => sseWrite(c, event, data));
  };

  proc.stdout.on('data', d => broadcast('stdout', d.toString()));
  proc.stderr.on('data', d => broadcast('stderr', d.toString()));
  proc.on('close', code => {
    activeJobs[jobId].done     = true;
    activeJobs[jobId].exitCode = code;
    broadcast('done', { code });
    setTimeout(() => delete activeJobs[jobId], 300000);
  });

  res.json({ jobId });
});

app.get('/api/logs/:jobId', (req, res) => {
  const job = activeJobs[parseInt(req.params.jobId)];
  if (!job) return res.status(404).json({ error: 'job not found' });
  sseHeaders(res);
  job.log.forEach(({ event, data }) => sseWrite(res, event, data));
  if (job.done) { sseWrite(res, 'done', { code: job.exitCode }); return res.end(); }
  job.clients.push(res);
  const hb = setInterval(() => res.write(': heartbeat\n\n'), 20000);
  req.on('close', () => { clearInterval(hb); job.clients = job.clients.filter(c => c !== res); });
});

app.listen(PORT, () => {
  console.log(`\n  CredAble Intelligence — Model 2 (MPS)`);
  console.log(`  → http://localhost:${PORT}\n`);
});
