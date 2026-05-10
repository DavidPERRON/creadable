/**
 * Browser utility — auto-installs Chrome if not found for current platform.
 * Eliminates the need to manually run `npx puppeteer browsers install chrome`.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = path.join(__dirname, '../..');

async function getBrowser(extraArgs = []) {
  const chromePath = puppeteer.executablePath();

  if (!fs.existsSync(chromePath)) {
    console.log('[browser] Chrome non trouvé — installation automatique en cours...');
    try {
      execSync('npx puppeteer browsers install chrome', { stdio: 'inherit', cwd: ROOT });
      console.log('[browser] Chrome installé.');
    } catch (e) {
      console.error('[browser] Échec installation:', e.message);
    }
  }

  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--ignore-certificate-errors',
    '--disable-gpu',
    ...extraArgs,
  ];

  const opts = { headless: true, args };
  const finalPath = puppeteer.executablePath();
  if (fs.existsSync(finalPath)) opts.executablePath = finalPath;

  return puppeteer.launch(opts);
}

module.exports = { getBrowser };
