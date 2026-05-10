#!/usr/bin/env node
/**
 * Bank SCF/TF Intelligence Scraper v2
 * Sources: bank sites, press rooms, GTR/TFG/TXF, ECAs, associations, job boards
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { execSync } = require('child_process');

const CHROME = '/home/user/.cache/puppeteer/chrome/linux-148.0.7778.97/chrome-linux64/chrome';
const OUT    = '/home/user/creadable/scraper/output';
const PDFS   = '/home/user/creadable/scraper/pdfs';

// ─── TF/SCF keyword dictionary (multilingual) ──────────────────────────────
const KEYWORDS = [
  // EN
  'supply chain finance','reverse factoring','confirming','dynamic discounting',
  'factoring','forfaiting','letter of credit','documentary credit','trade finance',
  'working capital','without recourse','receivables finance','invoice finance',
  'buyer finance','supplier finance','payables finance','trade receivables',
  'structured trade','SCF platform','fintech partnership','BAFT','ITFA','FCI member',
  'Allianz Trade','Euler Hermes','Coface','Atradius','SACE','Berne Union',
  'ECA financing','export credit','Marco Polo',
  // IT
  'cessione crediti','senza ricorso','filiera','conferma fatture',
  // ES
  'factoring sin recurso','cadena de suministro','financiacion proveedores',
  // DE
  'Factoring','Forfaitierung','Handelsfinanzierung','Lieferkette','Akkreditiv',
  // FR
  'affacturage','escompte','cession de créances','chaîne approvisionnement',
  // PL
  'faktoring odwrotny','faktoring','finansowanie łańcucha',
  // CZ/SK
  'odkup pohledávek','dokumentární akreditiv',
  // RO
  'finantare lant','factoring fara regres',
  // SI/HR
  'faktoring','dobaviteljsko financiranje','odkup terjatev',
];

// ─── BANK TARGETS ──────────────────────────────────────────────────────────
// Each bank has multiple source categories
const BANKS = [
  // ══════════════════ P1 ══════════════════
  {
    name: 'BCGE', country: 'CH', priority: 'P1',
    searchTerms: ['BCGE supply chain finance', 'BCGE trade finance', 'BCGE Eric Balmer SCF', 'Banque Cantonale Genève factoring'],
    bankSite: [
      'https://www.bcge.ch/en/entreprises',
      'https://www.bcge.ch/en/newsroom',
      'https://www.bcge.ch/en/direction-generale',
    ],
    pressPages: ['https://www.bcge.ch/en/actualites'],
    annualReportPage: 'https://www.bcge.ch/en/rapports-financiers',
    linkedinSearch: 'BCGE "trade finance" OR "supply chain finance" site:linkedin.com/jobs',
  },
  {
    name: 'Komercni_banka', country: 'CZ', priority: 'P1',
    searchTerms: ['Komerční banka supply chain finance', 'Komercni banka factoring 2024 2025', 'KB Roger Orbian SCF', 'Factoring KB supply chain'],
    bankSite: [
      'https://www.kb.cz/en/company/press-centre',
      'https://www.kb.cz/en/company/investor-relations/financial-results',
      'https://www.factoringkb.cz/en/supply-chain-finance',
    ],
    pressPages: ['https://www.kb.cz/en/company/press-centre/press-releases'],
    annualReportPage: 'https://www.kb.cz/en/company/investor-relations/financial-results/annual-reports',
    linkedinSearch: 'Komerční banka "trade finance" OR "SCF" site:linkedin.com/jobs',
  },
  {
    name: 'Bankinter', country: 'ES', priority: 'P1',
    searchTerms: ['Bankinter supply chain finance 2024 2025', 'Bankinter confirming SCF growth', 'Bankinter international business trade finance'],
    bankSite: [
      'https://www.bankinter.com/empresas/en/international-currency-market/financing/scf-reverse-factoring-solutions',
      'https://www.bankinter.com/cfo-forum/en/international-business',
      'https://www.bankinter.com/webcorporativa/en/communication-room/news',
    ],
    pressPages: ['https://www.bankinter.com/webcorporativa/en/communication-room/news/business'],
    annualReportPage: 'https://www.bankinter.com/webcorporativa/en/shareholders-investors/financial-information/annual-reports/2024',
    linkedinSearch: 'Bankinter "supply chain finance" OR "confirming" site:linkedin.com/jobs',
  },
  {
    name: 'BPER_Banca', country: 'IT', priority: 'P1',
    searchTerms: ['BPER Banca supply chain finance 2025', 'BPER Factor PlusAdvance confirming', 'BPER BPS fusione factoring 2026'],
    bankSite: [
      'https://www.bper.it/imprese-professionisti/finanziamenti/gestione-crediti/factoring',
      'https://group.bper.it/investor-relations/risultati-gruppo/bilanci-e-relazioni',
      'https://group.bper.it/sala-stampa',
    ],
    pressPages: ['https://group.bper.it/sala-stampa/comunicati-stampa'],
    annualReportPage: 'https://group.bper.it/investor-relations/risultati-gruppo/bilanci-e-relazioni',
    linkedinSearch: 'BPER "supply chain finance" OR "factoring" site:linkedin.com/jobs',
  },
  {
    name: 'Banca_Transilvania', country: 'RO', priority: 'P1',
    searchTerms: ['Banca Transilvania supply chain finance EBRD 2024', 'Banca Transilvania factoring trade finance', 'Banca Transilvania SCF Profi'],
    bankSite: [
      'https://www.bancatransilvania.ro/en/companies/products-and-services/factoring/',
      'https://www.bancatransilvania.ro/en/companies/products-and-services/trade-finance/',
      'https://ir.bancatransilvania.ro/en/press-releases',
    ],
    pressPages: ['https://www.bancatransilvania.ro/en/media/press-releases/'],
    annualReportPage: 'https://ir.bancatransilvania.ro/en/financials/annual-reports',
    linkedinSearch: 'Banca Transilvania "trade finance" OR "supply chain" site:linkedin.com/jobs',
  },
  // ══════════════════ P2 ══════════════════
  {
    name: 'BayernLB', country: 'DE', priority: 'P2',
    searchTerms: ['BayernLB supply chain finance 2024 2025', 'BayernLB Handelsfinanzierung SCF', 'BayernLB trade finance export'],
    bankSite: [
      'https://www.bayernlb.com/internet/en/blb/resp/firmenkunden_3/loesungen_1/trade_export_finance_1/supply_chain_1/supply_chain.jsp',
      'https://www.bayernlb.com/internet/en/blb/resp/bayernlb_2/presse_1/pressemitteilungen_1/pressemitteilungen.jsp',
    ],
    pressPages: ['https://www.bayernlb.com/internet/en/blb/resp/bayernlb_2/presse_1/pressemitteilungen_1/pressemitteilungen.jsp'],
    annualReportPage: 'https://www.bayernlb.com/internet/en/blb/resp/meta_6/about_us/investor_relations_7/veroeffentlichungen_1/finanzberichte_1/financial_reports.jsp',
    linkedinSearch: 'BayernLB "supply chain finance" OR "Handelsfinanzierung" site:linkedin.com/jobs',
  },
  {
    name: 'Helaba', country: 'DE', priority: 'P2',
    searchTerms: ['Helaba supply chain finance platform 2024 2025', 'Helaba Handelsfinanzierung SCF', 'Helaba trade finance factoring'],
    bankSite: [
      'https://www.helaba.com/int/business-sectors/corporate-finance.php',
      'https://www.helaba.com/int/press/press-releases.php',
    ],
    pressPages: ['https://www.helaba.com/int/press/press-releases.php'],
    annualReportPage: 'https://www.helaba.com/int/investor-relations/publications/annual-reports.php',
    linkedinSearch: 'Helaba "trade finance" OR "supply chain" site:linkedin.com/jobs',
  },
  {
    name: 'Belfius', country: 'BE', priority: 'P2',
    searchTerms: ['Belfius supply chain finance 2024 2025', 'Belfius Commercial Finance factoring SCF', 'Belfius trade finance'],
    bankSite: [
      'https://www.belfius.be/professional/en/banking/financing/factoring/index.aspx',
      'https://www.belfius.be/about-us/en/press-room/press-releases',
    ],
    pressPages: ['https://www.belfius.be/about-us/en/press-room/press-releases'],
    annualReportPage: 'https://www.belfius.be/about-us/en/investors/results-reports/reports',
    linkedinSearch: 'Belfius "supply chain finance" OR "factoring" site:linkedin.com/jobs',
  },
  {
    name: 'La_Banque_Postale', country: 'FR', priority: 'P2',
    searchTerms: ['La Banque Postale supply chain finance 2025', 'LBP Factoring affacturage SCF', 'La Banque Postale trade finance'],
    bankSite: [
      'https://leasing-factoring.labanquepostale.fr/',
      'https://www.labanquepostale.fr/newsroom/presse/',
    ],
    pressPages: ['https://www.labanquepostale.fr/newsroom/presse/'],
    annualReportPage: 'https://www.labanquepostale.fr/groupe/finance/resultats-financiers/',
    linkedinSearch: 'La Banque Postale "affacturage" OR "supply chain" OR "factoring" site:linkedin.com/jobs',
  },
  {
    name: 'Banco_BPM', country: 'IT', priority: 'P2',
    searchTerms: ['Banco BPM supply chain finance 2024 2025', 'Banco BPM trade finance factoring SCF', 'Banco BPM YouTrade confirming'],
    bankSite: [
      'https://www.bancobpm.it/imprese/prodotti-servizi/trade-finance/',
      'https://gruppo.bancobpm.it/en/media/press-releases',
    ],
    pressPages: ['https://gruppo.bancobpm.it/en/media/press-releases'],
    annualReportPage: 'https://gruppo.bancobpm.it/en/investor-relations/balance-sheets-and-reports/',
    linkedinSearch: 'Banco BPM "trade finance" OR "supply chain finance" site:linkedin.com/jobs',
  },
  {
    name: 'Bank_Millennium', country: 'PL', priority: 'P2',
    searchTerms: ['Bank Millennium supply chain finance Poland 2025', 'Bank Millennium faktoring SCF', 'Bank Millennium trade finance award 2025'],
    bankSite: [
      'https://www.bankmillennium.pl/en/corporate/factoring',
      'https://www.bankmillennium.pl/en/about-bank/press-room',
    ],
    pressPages: ['https://www.bankmillennium.pl/en/about-bank/press-room'],
    annualReportPage: 'https://ir.bankmillennium.pl/en/financial-results/annual-reports',
    linkedinSearch: 'Bank Millennium "supply chain finance" OR "faktoring" site:linkedin.com/jobs',
  },
  {
    name: 'Citi_Handlowy', country: 'PL', priority: 'P2',
    searchTerms: ['Citi Handlowy supply chain finance Poland 2025', 'Citi Handlowy SCF trade finance', 'Citi Handlowy corporate banking pivot'],
    bankSite: [
      'https://www.citihandlowy.pl/en/corporate/treasury-and-trade-solutions',
      'https://www.citihandlowy.pl/en/about-bank/press-room',
    ],
    pressPages: ['https://www.citihandlowy.pl/en/about-bank/press-room'],
    annualReportPage: 'https://www.citihandlowy.pl/en/investor-relations/reports',
    linkedinSearch: 'Citi Handlowy "supply chain finance" OR "SCF" site:linkedin.com/jobs',
  },
  {
    name: 'NLB', country: 'SI', priority: 'P2',
    searchTerms: ['NLB supply chain finance factoring 2025', 'NLB trade finance Slovenia Balkans', 'NLB Group reverse factoring'],
    bankSite: [
      'https://www.nlb.si/trade-finance',
      'https://www.nlb.si/factoring',
      'https://www.nlbgroup.com/int-en/media/press-releases',
    ],
    pressPages: ['https://www.nlbgroup.com/int-en/media/press-releases'],
    annualReportPage: 'https://www.nlbgroup.com/int-en/investor-relations/financial-reports',
    linkedinSearch: 'NLB "trade finance" OR "factoring" OR "supply chain" site:linkedin.com/jobs',
  },
  {
    name: 'BRD_SocGen', country: 'RO', priority: 'P2',
    searchTerms: ['BRD SocGen supply chain finance Romania 2025', 'BRD factoring trade finance award', 'BRD FINTRA factoring'],
    bankSite: [
      'https://www.brd.ro/en/companies/financing/factoring',
      'https://www.brd.ro/en/about-brd/press-center',
    ],
    pressPages: ['https://www.brd.ro/en/about-brd/press-center/press-releases'],
    annualReportPage: 'https://www.brd.ro/en/about-brd/investor-relations/financial-results-and-reports',
    linkedinSearch: 'BRD "trade finance" OR "supply chain" OR "factoring" site:linkedin.com/jobs',
  },
  // ══════════════════ P3 ══════════════════
  {
    name: 'MAIB', country: 'MD', priority: 'P3',
    searchTerms: ['MAIB Moldova factoring reverse factoring 2025', 'MAIB supply chain finance Moldova', 'MAIB Moldova trade finance'],
    bankSite: [
      'https://www.maib.md/en/business/factoring/',
      'https://www.maib.md/en/media/press-releases/',
    ],
    pressPages: ['https://www.maib.md/en/media/press-releases/'],
    annualReportPage: 'https://www.maib.md/en/about-us/annual-reports/',
    linkedinSearch: 'MAIB Moldova "trade finance" OR "factoring" site:linkedin.com/jobs',
  },
  {
    name: 'Liberty_Bank_GE', country: 'GE', priority: 'P3',
    searchTerms: ['Liberty Bank Georgia FCI factoring 2025', 'Liberty Bank Georgia trade finance SCF', 'Liberty Bank Georgia supply chain'],
    bankSite: [
      'https://www.libertybank.ge/en/business/trade-finance',
      'https://www.libertybank.ge/en/about/press-releases',
    ],
    pressPages: ['https://www.libertybank.ge/en/about/press-releases'],
    annualReportPage: 'https://www.libertybank.ge/en/about/investor-relations',
    linkedinSearch: 'Liberty Bank Georgia "trade finance" OR "factoring" site:linkedin.com/jobs',
  },
  {
    name: 'PASHA_Bank', country: 'AZ', priority: 'P3',
    searchTerms: ['PASHA Bank Azerbaijan factoring export 2025', 'PASHA Bank trade finance SCF', 'PASHA Bank supply chain'],
    bankSite: [
      'https://www.pashabank.az/en/factoring/',
      'https://www.pashabank.az/en/press-center/',
    ],
    pressPages: ['https://www.pashabank.az/en/press-center/press-releases/'],
    annualReportPage: 'https://www.pashabank.az/en/investor-relations/',
    linkedinSearch: 'PASHA Bank "trade finance" OR "factoring" site:linkedin.com/jobs',
  },
  {
    name: 'AikBank_Serbia', country: 'RS', priority: 'P3',
    searchTerms: ['AIK Bank Serbia trade finance 2025', 'AIK Bank Euromoney trade finance award', 'AIK Bank supply chain factoring'],
    bankSite: [
      'https://www.aikbank.rs/privreda/korporativno-bankarstvo/',
      'https://www.aikbank.rs/medija/',
    ],
    pressPages: ['https://www.aikbank.rs/medija/'],
    annualReportPage: 'https://www.aikbank.rs/o-banci/investitori/',
    linkedinSearch: 'AIK Bank "trade finance" OR "faktoring" site:linkedin.com/jobs',
  },
  {
    name: 'LHV_Pank', country: 'EE', priority: 'P3',
    searchTerms: ['LHV Pank factoring trade finance Estonia 2025', 'LHV supply chain finance Baltic'],
    bankSite: [
      'https://www.lhv.ee/en/business/factoring',
      'https://www.lhv.ee/en/investor-relations/news',
    ],
    pressPages: ['https://www.lhv.ee/en/investor-relations/news'],
    annualReportPage: 'https://www.lhv.ee/en/investor-relations/reports',
    linkedinSearch: 'LHV "trade finance" OR "factoring" OR "supply chain" site:linkedin.com/jobs',
  },
];

// ─── Professional press / association URLs to scrape per search term ────────
const PRESS_SOURCES = {
  gtreview: {
    name: 'GTR (Global Trade Review)',
    searchUrl: (q) => `https://www.gtreview.com/?s=${encodeURIComponent(q)}`,
  },
  tradefinanceglobal: {
    name: 'Trade Finance Global',
    searchUrl: (q) => `https://www.tradefinanceglobal.com/?s=${encodeURIComponent(q)}`,
  },
  txf: {
    name: 'TXF News',
    searchUrl: (q) => `https://www.txfnews.com/search?q=${encodeURIComponent(q)}`,
  },
};

// Associations / ECAs to check for bank mentions
const ASSOCIATION_URLS = [
  { name: 'FCI Members', url: 'https://fci.nl/en/members' },
  { name: 'BAFT Members', url: 'https://www.baft.org/page/members' },
  { name: 'ITFA Members', url: 'https://itfa.org/members/' },
  { name: 'ICC Banking Commission', url: 'https://iccwbo.org/resources-for-business/icc-banking-commission/' },
  { name: 'Allianz Trade partners', url: 'https://www.allianz-trade.com/en_global/about-us/partners.html' },
  { name: 'Coface partners', url: 'https://www.coface.com/en/News-Publications/Publications/Partnerships' },
  { name: 'Atradius partners', url: 'https://atradius.com/trade-finance-solutions' },
];

// ─── Utilities ───────────────────────────────────────────────────────────────
function extractKeywords(text) {
  const low = text.toLowerCase();
  const hits = [];
  const seen = new Set();
  for (const kw of KEYWORDS) {
    let idx = 0;
    while ((idx = low.indexOf(kw.toLowerCase(), idx)) !== -1) {
      const key = `${kw}:${Math.floor(idx/200)}`;
      if (!seen.has(key)) {
        seen.add(key);
        const s = Math.max(0, idx - 120);
        const e = Math.min(text.length, idx + kw.length + 250);
        hits.push({ keyword: kw, context: text.slice(s, e).replace(/\s+/g, ' ').trim() });
      }
      idx += kw.length;
    }
  }
  return hits;
}

async function newPage(browser) {
  const p = await browser.newPage();
  await p.setDefaultNavigationTimeout(28000);
  await p.setDefaultTimeout(28000);
  await p.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  );
  await p.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
  return p;
}

async function fetchPage(browser, url) {
  const page = await newPage(browser);
  let result = { url, ok: false, title: '', text: '', links: [], error: '' };
  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 28000 });
    await new Promise(r => setTimeout(r, 1800));
    result.title = await page.title();
    result.text  = await page.evaluate(() => {
      document.querySelectorAll('nav,footer,script,style,iframe,noscript').forEach(e => e.remove());
      return (document.body || {}).innerText || '';
    });
    result.links = await page.evaluate(() =>
      [...document.querySelectorAll('a[href]')].map(a => ({
        txt: (a.innerText || '').trim().slice(0, 120),
        href: a.href,
      })).filter(l => l.href.startsWith('http'))
    );
    result.ok = true;
  } catch (e) {
    result.error = e.message.slice(0, 120);
  }
  await page.close();
  return result;
}

async function downloadPdf(url, dest) {
  if (fs.existsSync(dest + '.txt')) {
    return fs.readFileSync(dest + '.txt', 'utf8');
  }
  return new Promise(resolve => {
    const file = fs.createWriteStream(dest);
    const proto = url.startsWith('https') ? https : http;
    proto.get(url, {
      timeout: 60000,
      headers: { 'User-Agent': 'Mozilla/5.0 (research-bot/2.0)' }
    }, res => {
      if ([301,302,307,308].includes(res.statusCode)) {
        file.close(); fs.unlink(dest, () => {});
        return resolve(downloadPdf(res.headers.location, dest));
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        try {
          execSync(`pdftotext "${dest}" "${dest}.txt"`, { timeout: 30000 });
          resolve(fs.readFileSync(dest + '.txt', 'utf8'));
        } catch { resolve(''); }
      });
    }).on('error', () => { fs.unlink(dest, () => {}); resolve(''); })
      .setTimeout(60000, function() { this.destroy(); resolve(''); });
  });
}

// ─── Scraping modules ─────────────────────────────────────────────────────

async function scrapeBank(browser, bank, log) {
  const res = {
    name: bank.name, country: bank.country, priority: bank.priority,
    bankPages: [], pressPages: [], annualReport: null,
    pressSearch: {}, jobSignals: [],
    allKeywords: [], pdfKeywords: [], summary: '',
  };

  // 1. Bank product + investor pages
  log(`  [1/5] Bank product & IR pages (${bank.bankSite.length} URLs)`);
  for (const url of bank.bankSite) {
    const p = await fetchPage(browser, url);
    const kws = extractKeywords(p.text);
    res.bankPages.push({ url, title: p.title, kwCount: kws.length, keywords: kws, error: p.error, links: p.links });
    res.allKeywords.push(...kws);
    log(`        ${p.ok ? '✓' : '✗'} "${p.title.slice(0,50)}" — ${kws.length} signals`);

    // Try annual report PDF from IR page
    if (!res.annualReport && p.links.length) {
      const pdfLink = p.links.find(l =>
        l.href.endsWith('.pdf') &&
        (/(annual|rapport|relazione|jahres|roczny|bilanz|bilan|výroční).*(2024|2025)/i.test(l.txt) ||
         /(2024|2025).*(annual|rapport|relazione|jahres|roczny)/i.test(l.txt) ||
         (l.href.includes('annual') && l.href.includes('2024')))
      );
      if (pdfLink) {
        log(`        [PDF] Found: "${pdfLink.txt.slice(0,60)}"`);
        const safeName = bank.name.replace(/\W/g,'_');
        const pdfPath = path.join(PDFS, `${safeName}_annual.pdf`);
        const text = await downloadPdf(pdfLink.href, pdfPath);
        if (text.length > 5000) {
          const kws = extractKeywords(text);
          res.annualReport = { url: pdfLink.href, label: pdfLink.txt, chars: text.length, keywords: kws };
          res.pdfKeywords.push(...kws);
          log(`        [PDF] ✓ ${Math.round(text.length/1000)}K chars, ${kws.length} signals`);
        }
      }
    }
    await delay(1200);
  }

  // 2. Press room / News pages
  log(`  [2/5] Press room pages`);
  for (const url of (bank.pressPages || [])) {
    const p = await fetchPage(browser, url);
    const kws = extractKeywords(p.text);
    res.pressPages.push({ url, title: p.title, kwCount: kws.length, keywords: kws.slice(0,15) });
    res.allKeywords.push(...kws);
    // Also grab PDF links from press room
    const pdfLinks = p.links.filter(l => l.href.endsWith('.pdf')).slice(0, 5);
    if (pdfLinks.length) log(`        [PRESS] ${pdfLinks.length} PDF links found`);
    log(`        ${p.ok ? '✓' : '✗'} "${p.title.slice(0,50)}" — ${kws.length} signals`);
    await delay(1200);
  }

  // 3. Professional press search (GTR, TFG, TXF)
  log(`  [3/5] Professional press search`);
  for (const [srcKey, src] of Object.entries(PRESS_SOURCES)) {
    const term = bank.searchTerms[0];
    const url = src.searchUrl(term);
    const p = await fetchPage(browser, url);
    const kws = extractKeywords(p.text);
    // Extract article links from search results
    const articleLinks = p.links
      .filter(l => l.href.includes(srcKey.split('_')[0]) && !l.href.includes('/tag/') && !l.href.includes('/author/'))
      .slice(0, 5);
    res.pressSearch[src.name] = {
      query: term, url, kwCount: kws.length, keywords: kws.slice(0, 10),
      articles: articleLinks.map(l => ({ title: l.txt, url: l.href })),
    };
    res.allKeywords.push(...kws);
    log(`        ${src.name}: ${kws.length} signals, ${articleLinks.length} articles`);
    await delay(1500);
  }

  // 4. Job postings (LinkedIn search via Google)
  log(`  [4/5] Job posting intelligence`);
  const jobQueries = [
    `"${bank.name.replace(/_/g,' ')}" "trade finance" OR "supply chain finance" head OR director job 2025`,
    `"${bank.name.replace(/_/g,' ')}" "SCF" OR "factoring" recruit site:linkedin.com`,
  ];
  for (const q of jobQueries.slice(0, 1)) {
    const url = `https://www.google.com/search?q=${encodeURIComponent(q)}&num=10`;
    const p = await fetchPage(browser, url);
    const text = p.text.toLowerCase();
    const jobSignals = [];
    if (text.includes('head of') && (text.includes('trade finance') || text.includes('supply chain'))) {
      jobSignals.push('Head of TF/SCF position detected');
    }
    if (text.includes('director') && text.includes('trade')) {
      jobSignals.push('Director-level TF position detected');
    }
    if (text.includes('hiring') || text.includes('open position')) {
      jobSignals.push('Active TF recruitment detected');
    }
    res.jobSignals.push(...jobSignals);
    log(`        Jobs: ${jobSignals.length > 0 ? jobSignals.join(', ') : 'no specific signals'}`);
    await delay(2000);
  }

  // 5. Deduplicate and summarize
  const seen = new Set();
  res.allKeywords = res.allKeywords.filter(k => {
    const key = k.keyword + ':' + k.context.slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });

  const pdfSeen = new Set();
  res.pdfKeywords = res.pdfKeywords.filter(k => {
    const key = k.keyword + ':' + k.context.slice(0, 60);
    if (pdfSeen.has(key)) return false;
    pdfSeen.add(key); return true;
  });

  const uniqueKws = [...new Set(res.allKeywords.map(k => k.keyword))];
  res.summary = [
    `Web: ${res.allKeywords.length} hits (${uniqueKws.length} unique terms)`,
    `PDF: ${res.pdfKeywords.length} hits`,
    res.jobSignals.length ? `Jobs: ${res.jobSignals.join('; ')}` : null,
  ].filter(Boolean).join(' | ');

  return res;
}

async function scrapeAssociations(browser, log) {
  log('\n[ASSOCIATIONS & ECAs]');
  const results = [];
  for (const assoc of ASSOCIATION_URLS) {
    log(`  Scraping ${assoc.name}…`);
    const p = await fetchPage(browser, assoc.url);
    const kws = extractKeywords(p.text);
    // Extract all bank names from the member list text
    const bankNames = BANKS.map(b => b.name.replace(/_/g,' ').toLowerCase());
    const mentions = bankNames.filter(name => p.text.toLowerCase().includes(name));
    results.push({
      name: assoc.name, url: assoc.url,
      ok: p.ok, charCount: p.text.length,
      bankMentions: mentions,
      keywords: kws.slice(0, 10),
    });
    log(`    ${p.ok ? '✓' : '✗'} ${p.charCount} chars | Banks found: ${mentions.join(', ') || 'none'}`);
    await delay(1500);
  }
  return results;
}

// ─── Report generation ───────────────────────────────────────────────────────

function buildReport(banks, assocs, filter) {
  const lines = [
    `# Bank Intelligence Report — ${filter.toUpperCase()}`,
    `**Date**: ${new Date().toISOString().slice(0,16).replace('T',' ')} UTC`,
    `**Banks**: ${banks.length} | **Sources**: bank sites, press rooms, GTR, TFG, TXF, ECAs/associations, job signals`,
    '',
    '---',
    '',
    '## SUMMARY TABLE',
    '',
    '| Bank | Country | Priority | Web signals | PDF signals | Unique keywords | Job signal |',
    '|------|---------|----------|------------|-------------|-----------------|-----------|',
  ];
  for (const b of banks) {
    const uq = [...new Set(b.allKeywords.map(k => k.keyword))].length;
    lines.push(`| **${b.name.replace(/_/g,' ')}** | ${b.country} | ${b.priority} | ${b.allKeywords.length} | ${b.pdfKeywords.length} | ${uq} | ${b.jobSignals.length > 0 ? '⚠️ '+b.jobSignals[0] : '—'} |`);
  }
  lines.push('', '---', '');

  for (const b of banks) {
    lines.push(`## [${b.priority}] ${b.name.replace(/_/g,' ')} — ${b.country}`);
    lines.push(`**Signal summary**: ${b.summary}`);
    lines.push('');

    // Top keyword hits from web
    if (b.allKeywords.length > 0) {
      lines.push('### Web — Signaux détectés');
      const byKw = groupBy(b.allKeywords, k => k.keyword);
      for (const [kw, hits] of Object.entries(byKw).slice(0, 12)) {
        lines.push(`\n**${kw}** (${hits.length}×)`);
        lines.push(`> ${hits[0].context.slice(0, 350)}`);
      }
      lines.push('');
    }

    // PDF hits
    if (b.annualReport) {
      lines.push(`### Annual Report PDF — ${b.annualReport.label}`);
      lines.push(`*${Math.round(b.annualReport.chars/1000)}K chars extracted*`);
      const byKw = groupBy(b.pdfKeywords, k => k.keyword);
      for (const [kw, hits] of Object.entries(byKw).slice(0, 10)) {
        lines.push(`\n**${kw}** (${hits.length}×)`);
        lines.push(`> ${hits[0].context.slice(0, 350)}`);
      }
      lines.push('');
    }

    // Professional press
    lines.push('### Presse professionnelle');
    for (const [srcName, src] of Object.entries(b.pressSearch)) {
      lines.push(`\n**${srcName}** — "${src.query}"`);
      if (src.articles.length > 0) {
        lines.push(`Articles trouvés :`);
        src.articles.slice(0, 4).forEach(a =>
          lines.push(`- [${a.title.slice(0,100)}](${a.url})`)
        );
      } else {
        lines.push('*Aucun article indexé pour cette requête*');
      }
      if (src.keywords.length > 0) {
        lines.push(`Signaux dans résultats de recherche :`);
        src.keywords.slice(0,3).forEach(k => lines.push(`> ${k.context.slice(0,200)}`));
      }
    }
    lines.push('');

    // Job signals
    if (b.jobSignals.length > 0) {
      lines.push('### Signaux recrutement TF/SCF');
      b.jobSignals.forEach(s => lines.push(`- ⚠️ ${s}`));
      lines.push('');
    }

    lines.push('---', '');
  }

  // Associations
  if (assocs.length > 0) {
    lines.push('## ASSOCIATIONS & ECAs — PRÉSENCE DES BANQUES');
    lines.push('');
    for (const a of assocs) {
      lines.push(`### ${a.name}`);
      lines.push(`URL: ${a.url}`);
      if (a.bankMentions.length > 0) {
        lines.push(`**Banques cibles trouvées**: ${a.bankMentions.join(', ')}`);
      } else {
        lines.push('*Aucune banque cible mentionnée*');
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

function groupBy(arr, fn) {
  const m = {};
  for (const x of arr) {
    const k = fn(x);
    if (!m[k]) m[k] = [];
    m[k].push(x);
  }
  return m;
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── CLI entry point ─────────────────────────────────────────────────────────

async function main() {
  [OUT, PDFS].forEach(d => fs.mkdirSync(d, { recursive: true }));

  const filter = process.argv[2] || 'P1';
  const targets = filter === 'all'
    ? BANKS
    : filter.startsWith('P')
      ? BANKS.filter(b => b.priority === filter)
      : BANKS.filter(b => b.name.toLowerCase().includes(filter.toLowerCase()));

  if (targets.length === 0) {
    console.error(`No banks match filter "${filter}". Use: P1 P2 P3 all <bank_name>`);
    process.exit(1);
  }

  const withAssocs = process.argv.includes('--assoc');
  const ts = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

  console.log(`\n${'═'.repeat(65)}`);
  console.log(` BANK INTELLIGENCE SCRAPER v2 — ${filter.toUpperCase()}`);
  console.log(` Banks: ${targets.length} | Associations: ${withAssocs} | ${ts}`);
  console.log('═'.repeat(65));

  const browser = await puppeteer.launch({
    headless: true, executablePath: CHROME,
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage',
           '--disable-gpu','--ignore-certificate-errors','--disable-web-security',
           '--window-size=1280,800'],
  });

  const log = (msg) => { console.log(msg); };
  const allBanks = [];

  try {
    for (const bank of targets) {
      console.log(`\n${'─'.repeat(65)}`);
      console.log(` [${bank.priority}] ${bank.name.replace(/_/g,' ')} (${bank.country})`);
      console.log('─'.repeat(65));
      const result = await scrapeBank(browser, bank, log);
      allBanks.push(result);
    }

    let assocs = [];
    if (withAssocs) assocs = await scrapeAssociations(browser, log);

    // Save JSON
    const jsonFile = path.join(OUT, `raw_${filter}_${ts}.json`);
    fs.writeFileSync(jsonFile, JSON.stringify({ banks: allBanks, associations: assocs }, null, 2));
    log(`\n[JSON] ${jsonFile}`);

    // Save markdown report
    const mdFile = path.join(OUT, `report_${filter}_${ts}.md`);
    fs.writeFileSync(mdFile, buildReport(allBanks, assocs, filter));
    log(`[MD]   ${mdFile}`);

    // Print summary
    console.log('\n' + '═'.repeat(65));
    console.log('FINAL SUMMARY');
    console.log('═'.repeat(65));
    for (const b of allBanks) {
      const uq = [...new Set(b.allKeywords.map(k => k.keyword))].length;
      const pdfSig = b.pdfKeywords.length;
      const jobFlag = b.jobSignals.length ? ' ⚠️' : '';
      console.log(`  [${b.priority}] ${b.name.replace(/_/g,' ').padEnd(22)} web:${String(b.allKeywords.length).padStart(3)} pdf:${String(pdfSig).padStart(3)} uniq:${String(uq).padStart(3)}${jobFlag}`);
    }
    console.log('\nDone. Reports saved to:', OUT);

  } finally {
    await browser.close();
  }
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
