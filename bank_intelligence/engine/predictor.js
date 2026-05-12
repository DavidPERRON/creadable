#!/usr/bin/env node
/**
 * Bank Purchase Predictor — LLM-powered
 *
 * Uses BIS scores + signal breakdown + tech stack to generate:
 * - P(buy) at 6/12/18 months
 * - Optimal approach window
 * - Top trigger event to monitor
 * - Recommended pitch angle
 *
 * Cost: ~$0.002/bank × 94 banks ≈ $0.19 total
 *
 * Run:
 *   node engine/predictor.js
 */

const fs    = require('fs');
const path  = require('path');
const https = require('https');

const ROOT        = path.join(__dirname, '..');
const SCORES_PATH = path.join(ROOT, 'reports', 'bis_scores.json');
const OUT_PATH    = path.join(ROOT, 'reports', 'predictions.json');

const MODEL   = process.env.DEEPINFRA_MODEL || 'meta-llama/Meta-Llama-3.1-405B-Instruct';
const API_KEY = process.env.DEEPINFRA_API_KEY;
const TIMEOUT = 60000;

// Fallback algorithmic prediction (no API key needed)
function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }

function predictAlgo(bank) {
  const bis = bank.bis_total || 0;
  const sb  = bank.bis?.signal_breakdown || {};
  const urgency = Math.min(1,
    ((sb.competitor_failure?.score  || 0) / 10) * 0.35 +
    ((sb.strategic_intent?.score    || 0) / 15) * 0.25 +
    ((sb.capability_gap?.score      || 0) / 20) * 0.20 +
    ((sb.peer_pressure?.score       || 0) / 10) * 0.20
  );
  return {
    p_buy_6m:  Math.round(Math.min(0.85, sigmoid((bis - 60) * 0.10) + urgency * 0.15) * 100),
    p_buy_12m: Math.round(Math.min(0.90, sigmoid((bis - 45) * 0.09) + urgency * 0.10) * 100),
    p_buy_18m: Math.round(Math.min(0.95, sigmoid((bis - 30) * 0.08) + urgency * 0.05) * 100),
  };
}

function callDeepInfra(systemPrompt, userPrompt) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (fn, val) => { if (!settled) { settled = true; clearTimeout(timer); fn(val); } };
    const timer = setTimeout(() => { req.destroy(); done(reject, new Error(`timeout after ${TIMEOUT}ms`)); }, TIMEOUT);

    const body = JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      max_tokens: 400,
      temperature: 0.2,
    });

    const req = https.request({
      hostname: 'api.deepinfra.com',
      path: '/v1/openai/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let raw = '';
      res.on('data', d => { raw += d; });
      res.on('end', () => {
        try {
          const j = JSON.parse(raw);
          const content = j.choices?.[0]?.message?.content || '';
          done(resolve, { content, usage: j.usage || {} });
        } catch (e) { done(reject, new Error('JSON parse: ' + e.message)); }
      });
      res.on('error', e => done(reject, e));
    });
    req.on('error', e => done(reject, e));
    req.write(body);
    req.end();
  });
}

const SYSTEM = `You are a B2B sales intelligence analyst specializing in bank trade finance / SCF software sales.
Given a bank's BIS (Buying Intent Score) profile, output ONLY a JSON object with these exact keys:
{
  "p_buy_6m": <integer 0-100>,
  "p_buy_12m": <integer 0-100>,
  "p_buy_18m": <integer 0-100>,
  "optimal_window": "<string: e.g. Q2 2026 or H2 2026>",
  "top_trigger": "<1 sentence: the single most important event to monitor>",
  "pitch_angle": "<1 sentence: recommended first approach angle>",
  "prediction_confidence": "<HIGH|MEDIUM|LOW>"
}
Base probabilities on the BIS score and signal breakdown. Higher BIS = higher probability. Competitor failures or platform orphans = compressed timeline.
Output ONLY valid JSON, no other text.`;

function buildPrompt(bank) {
  const ts  = bank.tech_stack || {};
  const bis = bank.bis || {};
  const sb  = bis.signal_breakdown || {};
  return `Bank: ${bank.bank_name} (${bank.country})
BIS Score: ${bis.bis_total || 0} / 100 — Bucket: ${bis.bis_bucket || '?'}
Estimated window: ${bis.estimated_window_months || '?'} months

Tech stack:
- Core banking: ${ts.core_banking || '?'}
- SCF/TF platform: ${ts.tf_scf_platform || '?'}
- Friction: ${ts.credable_friction || '?'}
- Rationale: ${(ts.rationale || '').slice(0, 200)}

Signal breakdown:
- Capability gap: ${sb.capability_gap?.score || 0}/10
- Strategic intent: ${sb.strategic_intent?.score || 0}/10
- Competitor failure: ${sb.competitor_failure?.score || 0}/10
- Peer pressure: ${sb.peer_pressure?.score || 0}/10
- Pre-integration: ${sb.pre_integration?.score || 0}/10

Pitch argument: ${(bis.pitch_argument || '').slice(0, 300)}`;
}

async function predictBank(bank) {
  const base = predictAlgo(bank);

  if (!API_KEY) {
    return {
      bank_id: bank.bank_id,
      bank_name: bank.bank_name,
      country: bank.country,
      bis_score: bank.bis_total || 0,
      ...base,
      optimal_window: base.p_buy_6m >= 40 ? 'Q1–Q2 2026' : base.p_buy_12m >= 35 ? 'H2 2026' : '2027',
      top_trigger: bank.bis?.pitch_argument?.slice(0, 100) || 'Surveiller actualités',
      pitch_angle: `Approche sur ${bank.tech_stack?.tf_scf_platform || 'gap plateforme'}`,
      prediction_confidence: bank.bis_total >= 60 ? 'HIGH' : bank.bis_total >= 40 ? 'MEDIUM' : 'LOW',
      method: 'algorithmic',
    };
  }

  try {
    const { content } = await callDeepInfra(SYSTEM, buildPrompt(bank));
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('no JSON in response');
    const llm = JSON.parse(jsonMatch[0]);
    return {
      bank_id:   bank.bank_id,
      bank_name: bank.bank_name,
      country:   bank.country,
      bis_score: bank.bis_total || 0,
      p_buy_6m:  llm.p_buy_6m  ?? base.p_buy_6m,
      p_buy_12m: llm.p_buy_12m ?? base.p_buy_12m,
      p_buy_18m: llm.p_buy_18m ?? base.p_buy_18m,
      optimal_window: llm.optimal_window || '',
      top_trigger:    llm.top_trigger    || '',
      pitch_angle:    llm.pitch_angle    || '',
      prediction_confidence: llm.prediction_confidence || 'MEDIUM',
      method: 'llm',
    };
  } catch (e) {
    return {
      bank_id: bank.bank_id, bank_name: bank.bank_name, country: bank.country,
      bis_score: bank.bis_total || 0, ...base, method: 'algo_fallback',
      top_trigger: 'LLM error — algorithmic fallback', pitch_angle: '', prediction_confidence: 'LOW',
    };
  }
}

async function main() {
  if (!fs.existsSync(SCORES_PATH)) {
    console.log('[predictor] bis_scores.json not found. Run bi:bis first.');
    process.exit(1);
  }

  const data  = JSON.parse(fs.readFileSync(SCORES_PATH, 'utf8'));
  const banks = data.banks || [];
  const useLLM = !!API_KEY;

  console.log(`[predictor] ${banks.length} banks — mode: ${useLLM ? 'LLM (405B)' : 'algorithmic'}`);
  if (!useLLM) console.log('[predictor] Set DEEPINFRA_API_KEY for LLM predictions');

  const predictions = [];
  for (let i = 0; i < banks.length; i++) {
    const b = banks[i];
    process.stdout.write(`  [${i+1}/${banks.length}] ${b.bank_name.padEnd(30)} `);
    const p = await predictBank(b);
    predictions.push(p);
    console.log(`P6m=${p.p_buy_6m}% P12m=${p.p_buy_12m}% (${p.method})`);
  }

  predictions.sort((a, b) => b.p_buy_12m - a.p_buy_12m);

  fs.writeFileSync(OUT_PATH, JSON.stringify({
    generated_at: new Date().toISOString().slice(0, 10),
    banks_scored: banks.length,
    method: useLLM ? 'llm' : 'algorithmic',
    predictions,
  }, null, 2));

  console.log(`\n[predictor] Top 5 (P12m):`);
  predictions.slice(0, 5).forEach((p, i) =>
    console.log(`  ${i+1}. ${p.bank_name.padEnd(30)} P12m=${p.p_buy_12m}% — ${p.top_trigger?.slice(0,60)}`)
  );
  console.log(`[predictor] Saved → ${OUT_PATH}`);
}

main().catch(e => { console.error(e); process.exit(1); });
