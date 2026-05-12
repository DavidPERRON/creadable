// CredAble Intelligence Platform — Demo Worker
// Restricted preview: 10 of 99 banks, 10 of 224 corporates

const META = { banks: 99, corps: 224, markets: 12, extractions: 1840, version: '2.4' };

const BANKS = [
  {
    id:'mtf-de', n:'Meridian Trade Finance SA', c:'DE', region:'DACH',
    bis:76, mps:82, score:79, tier:'HIGH', scf:'BASIC', priority:'A+',
    stack:{ core:'Temenos T24', friction:'low', platform:'Orphaned (TradeFlow GmbH, 2023)' },
    mkt:{ corps:8, rev:38.2, reg_rev:142.6, sectors:['Automotive','Chemicals','Industrial','Energy'] },
    comp:{ geo:36, sector:22, gap:19, sig:8 },
    window: 6,
    ctx:'Eight direct corporates in Germany account for €38.2Bn in combined revenue. Automotive and Chemicals dominate — highest SCF demand density in Europe. Regional pipeline adds €142.6Bn of addressable flow across DACH.',
    pitch:[
      '★ Platform orphan: TradeFlow GmbH collapsed in March 2023, leaving 340 active supplier finance programs without infrastructure. Meridian Trade Finance SA was a participant bank — CredAble deploys in 90 days, no core banking change.',
      '◆ Market anchor: Meridian Auto Group AG (€19.2Bn) is actively seeking a second SCF bank. Program structured, 420 suppliers pre-onboarded — you enter as co-financer with immediate volume.',
      '▸ SCF gap (BASIC level): current setup covers <30% of addressable flow. CredAble closes the remaining 70% and adds TCI integration as a differentiator vs. incumbent banks.',
    ],
    sigs:[
      { corp:'Meridian Auto Group AG', mentions:[
        { n:'Meridian Trade Finance SA', role:'lead', prod:'payables', ctx:'Meridian Trade Finance SA serves as lead bank for our supplier finance program covering 420 German tier-1 suppliers across automotive and industrial sectors.' },
        { n:'Rhine Corporate Finance AG', role:'participant', prod:'payables', ctx:'Rhine Corporate Finance AG participates as secondary bank in our SCF program for Hessen-based suppliers.' }
      ]},
      { corp:'Rhine Chemical Works GmbH', mentions:[
        { n:'Meridian Trade Finance SA', role:'shortlisted', prod:'receivables', ctx:'Meridian Trade Finance SA was listed in our treasury shortlist for cross-border SCF expansion in Q4 2024.' }
      ]}
    ]
  },
  {
    id:'vcg-pl', n:'Vistula Commerce Group', c:'PL', region:'CEE',
    bis:71, mps:78, score:74, tier:'HIGH', scf:'ABSENT', priority:'A+',
    stack:{ core:'Finastra Fusion', friction:'low', platform:'None' },
    mkt:{ corps:5, rev:18.9, reg_rev:98.4, sectors:['Automotive','Industrial','FMCG'] },
    comp:{ geo:31, sector:21, gap:25, sig:7 },
    window: 9,
    ctx:'Five direct corporates in Poland represent €18.9Bn in revenue, led by Vistula Manufacturing SA and Baltic FMCG Holdings. Finastra Fusion core allows rapid CredAble integration (3–4 months vs. 9–12 months industry average).',
    pitch:[
      '★ CEO mandate: In Q1 2025, CEO publicly announced a "digital trade finance transformation" roadmap. CredAble fits the roadmap without building in-house — time-to-market 4 months.',
      '◆ ABSENT SCF level: maximum addressable gap. Every euro of supplier finance volume is incremental revenue. Polish Automotive market alone represents €5.3Bn SCF opportunity.',
      '▸ Finastra Fusion stack: lowest friction integration in CEE. CredAble API layer deploys on existing infrastructure — no migration, no downtime.',
    ],
    sigs:[
      { corp:'Vistula Manufacturing SA', mentions:[
        { n:'Vistula Commerce Group', role:'lead', prod:'payables', ctx:'Vistula Commerce Group is our primary banking partner and lead coordinator for our supplier finance program covering 300+ Polish industrial suppliers.' },
        { n:'Carpathian Commercial Bank Zrt', role:'local_partner', prod:'payables', ctx:'Carpathian Commercial Bank Zrt serves as regional partner for our Hungarian-based tier-2 supplier finance arrangements.' }
      ]},
      { corp:'Baltic FMCG Holdings SA', mentions:[
        { n:'Vistula Commerce Group', role:'participant', prod:'receivables', ctx:'Vistula Commerce Group participates in our receivables finance facility for domestic distribution network.' }
      ]}
    ]
  },
  {
    id:'dfg-cz', n:'Danube Finance Group a.s.', c:'CZ', region:'CEE',
    bis:62, mps:71, score:66, tier:'MEDIUM-HIGH', scf:'BASIC', priority:'A',
    stack:{ core:'Temenos Transact', friction:'low', platform:'Internal (partial)' },
    mkt:{ corps:4, rev:14.6, reg_rev:86.2, sectors:['Automotive','Agribusiness','Industrial'] },
    comp:{ geo:28, sector:18, gap:19, sig:6 },
    window: 12,
    ctx:'Four direct corporates in Czech Republic including Rhine Chemical Works (regional presence) and Danube Agri Partners. Three of five peer banks in CEE have already deployed advanced SCF platforms — competitive pressure intensifying.',
    pitch:[
      '★ Peer pressure: 3 of 5 Czech peer banks (by asset size) have deployed advanced SCF platforms in 2023–2024. Market leadership window closing — estimated 12 months before segment is locked.',
      '◆ Temenos stack: same integration path as Meridian Trade Finance SA — CredAble has a certified connector. Go-live in 3 months.',
      '▸ Agri + Automotive mix: Danube Agri Partners (€4.8Bn) and Rhine Chemical Works regional operations create a combined €14.6Bn direct market with high SCF intensity.',
    ],
    sigs:[
      { corp:'Danube Agri Partners Kft', mentions:[
        { n:'Danube Finance Group a.s.', role:'lead', prod:'payables', ctx:'Danube Finance Group a.s. serves as our primary financing bank for seasonal procurement cycles, covering €300M annual program volume.' }
      ]}
    ]
  },
  {
    id:'acf-it', n:'Adriatic Corporate Finance SpA', c:'IT', region:'SOUTHERN EU',
    bis:50, mps:72, score:60, tier:'MEDIUM-HIGH', scf:'BASIC', priority:'B+',
    stack:{ core:'SAP Fioneer', friction:'medium', platform:'Internal (legacy)' },
    mkt:{ corps:6, rev:31.5, reg_rev:74.1, sectors:['Retail','Automotive','Pharma','Industrial'] },
    comp:{ geo:32, sector:19, gap:19, sig:5 },
    window: 12,
    ctx:'Six direct corporates including Adriatic Retail Network SpA (€14.3Bn) and Iberian Pharma Group (regional presence). Italy represents the third-largest SCF market in Europe — Adriatic Corporate Finance holds <4% market share vs. 18% regional average.',
    pitch:[
      '◆ Market share gap: Italian SCF market €48Bn annually. Adriatic Corporate Finance captures <4% vs. 18% peer average. Gap translates to €6.7Bn in unaddressed flow.',
      '▸ Retail anchor: Adriatic Retail Network SpA (€14.3Bn) expressed intent to diversify from single-bank SCF relationship. First-mover window: 6 months.',
      '▸ SAP Fioneer core: CredAble has a pre-built integration module — deployment 4–5 months, no custom development required.',
    ],
    sigs:[
      { corp:'Adriatic Retail Network SpA', mentions:[
        { n:'Adriatic Corporate Finance SpA', role:'lead', prod:'payables', ctx:'Adriatic Corporate Finance SpA is our lead bank for domestic supplier finance. We are evaluating a second bank partner to increase program capacity.' }
      ]}
    ]
  },
  {
    id:'itp-es', n:'Iberian Trade Partners SA', c:'ES', region:'IBERIA',
    bis:46, mps:63, score:54, tier:'MEDIUM', scf:'ABSENT', priority:'B',
    stack:{ core:'Oracle Flexcube', friction:'medium', platform:'None' },
    mkt:{ corps:4, rev:21.8, reg_rev:58.3, sectors:['FMCG','Pharma','Retail','Logistics'] },
    comp:{ geo:26, sector:16, gap:25, sig:5 },
    window: 18,
    ctx:'Four direct corporates across FMCG and Pharma sectors in Spain. ABSENT SCF level represents the maximum addressable gap. Spanish market growing 14% YoY in SCF adoption — late-mover risk increasing.',
    pitch:[
      '▸ ABSENT SCF: maximum gap, maximum opportunity. Every €1 of SCF deployed is incremental. Entry cost is a 4-month deployment vs. years of in-house development.',
      '◆ FMCG + Pharma density: Iberian Pharma Group SA (€9.1Bn) + Baltic FMCG Holdings (regional distribution) create a €21.8Bn direct addressable market.',
      '▸ Market growth: Spanish SCF market +14% YoY. Banks entering now capture the growth curve. Oracle Flexcube integration: 5–6 months via CredAble API gateway.',
    ],
    sigs:[]
  },
  {
    id:'rcf-de', n:'Rhine Corporate Finance AG', c:'DE', region:'DACH',
    bis:44, mps:58, score:51, tier:'MEDIUM', scf:'INTERMEDIATE', priority:'B',
    stack:{ core:'Finastra Trade Innovation', friction:'low', platform:'Partial (in-house)' },
    mkt:{ corps:5, rev:29.4, reg_rev:142.6, sectors:['Automotive','Energy','Chemicals','Industrial'] },
    comp:{ geo:30, sector:18, gap:10, sig:4 },
    window: 18,
    ctx:'Five direct corporates sharing DACH region with Meridian Trade Finance SA. Finastra Trade Innovation core — lowest integration friction in segment. Currently covers factoring only; reverse SCF and dynamic discounting are uncovered.',
    pitch:[
      '▸ Peer pressure: Meridian Trade Finance SA (same market, same clients) is deploying CredAble. Competitive catch-up window 12–18 months.',
      '◆ Finastra stack: CredAble has a certified Finastra connector — fastest deployment path in the portfolio (2.5 months). Shared client base with Meridian creates cross-sell opportunity.',
      '▸ Product gap: INTERMEDIATE level covers factoring only. Dynamic discounting and multi-bank reverse SCF are fully uncovered — €29.4Bn direct market without these products.',
    ],
    sigs:[
      { corp:'Meridian Auto Group AG', mentions:[
        { n:'Rhine Corporate Finance AG', role:'participant', prod:'payables', ctx:'Rhine Corporate Finance AG participates as secondary bank in our SCF program for Hessen-based suppliers.' }
      ]},
      { corp:'Rhine Chemical Works GmbH', mentions:[
        { n:'Rhine Corporate Finance AG', role:'lead', prod:'receivables', ctx:'Rhine Corporate Finance AG is our primary bank for receivables finance and trade credit insurance integration.' }
      ]}
    ]
  },
  {
    id:'bcb-nl', n:'Benelux Corporate Bank NV', c:'NL', region:'BENELUX',
    bis:38, mps:54, score:45, tier:'MEDIUM', scf:'INTERMEDIATE', priority:'B-',
    stack:{ core:'Temenos T24', friction:'low', platform:'Kyriba (treasury only)' },
    mkt:{ corps:3, rev:16.4, reg_rev:52.8, sectors:['Chemicals','Pharma','Logistics'] },
    comp:{ geo:22, sector:14, gap:10, sig:4 },
    window: 18,
    ctx:'Three direct corporates in Benelux anchored by Rhine Chemical Works (NL regional operations) and Nordic Logistics Platform (distribution hub). NPL ratio rising to 3.2% — capital optimization pressure creating SCF off-balance-sheet appetite.',
    pitch:[
      '▸ NPL pressure: NPL ratio 3.2% (above 2.8% sector average) — off-balance-sheet SCF structures reduce RWA pressure. Regulatory incentive aligns with commercial opportunity.',
      '◆ Kyriba integration: treasury system already connected. CredAble extends into SCF without replacing the existing stack.',
      '▸ Chemicals/Logistics cluster: Rhine Chemical Works NL operations + Nordic Logistics Platform distribution hub create a natural SCF ecosystem in Benelux.',
    ],
    sigs:[]
  },
  {
    id:'ccb-hu', n:'Carpathian Commercial Bank Zrt', c:'HU', region:'CEE',
    bis:40, mps:48, score:44, tier:'MEDIUM', scf:'ABSENT', priority:'C+',
    stack:{ core:'Misys BankFusion', friction:'high', platform:'None' },
    mkt:{ corps:2, rev:9.0, reg_rev:62.1, sectors:['Agribusiness','Industrial'] },
    comp:{ geo:18, sector:12, gap:25, sig:4 },
    window: 24,
    ctx:'Two direct corporates in Hungary with €9.0Bn combined revenue. ABSENT SCF level — maximum gap. Regional pipeline via CEE corridor adds €62.1Bn. Misys BankFusion integration is complex (12-month typical) but CredAble has a certified connector reducing this to 5 months.',
    pitch:[
      '▸ ABSENT SCF: zero competition on the platform — CredAble enters a clean market with no incumbent to displace.',
      '◆ CEE corridor: regional pipeline €62.1Bn across HU/PL/CZ/RO. Vistula Manufacturing SA (PL) and Danube Agri Partners (HU) already cite Carpathian as their local banking partner.',
      '▸ Agri cycle: Danube Agri Partners Kft (€4.8Bn) seasonal peaks Q2/Q3 — predictable, low-default SCF program. Calendar-driven, minimal underwriting complexity.',
    ],
    sigs:[
      { corp:'Vistula Manufacturing SA', mentions:[
        { n:'Carpathian Commercial Bank Zrt', role:'local_partner', prod:'payables', ctx:'Carpathian Commercial Bank Zrt serves as regional partner for our Hungarian-based tier-2 supplier finance arrangements.' }
      ]}
    ]
  },
  {
    id:'pcg-at', n:'Pannonian Credit Group AG', c:'AT', region:'DACH',
    bis:35, mps:46, score:40, tier:'LOW', scf:'BASIC', priority:'C',
    stack:{ core:'Temenos T24', friction:'low', platform:'Internal (basic)' },
    mkt:{ corps:2, rev:17.0, reg_rev:142.6, sectors:['Agribusiness','Energy'] },
    comp:{ geo:20, sector:12, gap:19, sig:4 },
    window: 24,
    ctx:'Two direct corporates including Alpine Energy Partners AG (€12.1Bn). DACH/CEE bridge position — serves both Austrian corporates and CEE cross-border flows. Temenos stack enables rapid integration.',
    pitch:[
      '▸ Bridge position: Austria-CEE corridor is under-served by SCF. Pannonian Credit Group AG is uniquely positioned to serve both markets — CredAble multi-currency module covers EUR/CZK/HUF/PLN natively.',
      '◆ Energy sector: Alpine Energy Partners AG (€12.1Bn) has 18–36 month receivable tenors — premium SCF margins, low default rate, high advisory value.',
      '▸ Temenos stack: same integration path as Meridian and Danube — certified connector, 3-month deployment.',
    ],
    sigs:[]
  },
  {
    id:'aci-ch', n:'Alpine Credit Institution AG', c:'CH', region:'DACH',
    bis:32, mps:44, score:38, tier:'LOW', scf:'ADVANCED', priority:'D',
    stack:{ core:'Avaloq', friction:'high', platform:'Surecomp RIVO (advanced)' },
    mkt:{ corps:2, rev:23.5, reg_rev:142.6, sectors:['Energy','Pharma'] },
    comp:{ geo:22, sector:13, gap:3, sig:3 },
    window: 36,
    ctx:'Two direct corporates including Alpine Energy Partners AG. ADVANCED SCF level — already equipped with Surecomp RIVO. Opportunity is an upgrade/replacement angle rather than greenfield. High integration complexity (Avaloq) but premium client base.',
    pitch:[
      '▸ Upgrade angle: Surecomp RIVO is reaching end-of-life support in 2026. CredAble is the natural successor — data migration included, go-live in 6 months.',
      '◆ Premium client base: Energy + Pharma segments command highest SCF margins. CredAble TCI integration (trade credit insurance) adds a differentiator Surecomp cannot match.',
      '▸ Swiss market: CHF-denominated SCF programs have specific documentation requirements — CredAble Swiss compliance module is pre-certified.',
    ],
    sigs:[]
  }
];

const CORPS = [
  {
    id:'mag-de', n:'Meridian Auto Group AG', c:'DE', sector:'Automotive',
    rev:19.2, intensity:1.0, employees:42000,
    desc:'Germany\'s fourth-largest automotive group by revenue. 800+ tier-1 and tier-2 suppliers across DE/PL/CZ. Payment terms 90–120 days standard. Active SCF program (€2.4Bn/year) through Meridian Trade Finance SA — seeking a second bank partner to increase capacity and geographic coverage.',
    why:'Maximum SCF intensity (1.0). Automotive supply chains have the longest payment cycles and the highest supplier density in European manufacturing. A single automotive anchor generates more SCF volume than a full industrial cluster.'
  },
  {
    id:'nsi-se', n:'Nordic Steel Industries AB', c:'SE', sector:'Industrial',
    rev:11.8, intensity:0.95, employees:18500,
    desc:'Pan-European steel and metals producer with operations in SE/PL/DE. Cash conversion cycle 74 days (above 58-day sector average). 2024 annual report states: "working capital optimization remains a top-3 strategic priority." 300+ suppliers across 6 EU countries.',
    why:'Industrial sector intensity 0.95. Cross-border supply chain creates demand for multi-currency, multi-bank SCF. Documented working capital pressure in public filings = highest quality buying signal available without direct contact.'
  },
  {
    id:'rcw-de', n:'Rhine Chemical Works GmbH', c:'DE', sector:'Chemicals',
    rev:8.6, intensity:0.90, employees:12200,
    desc:'Specialty chemicals producer. Highly seasonal cash flows with Q1 procurement peaks (raw material stockpiling). 40% of suppliers based in CEE — creates natural demand for cross-border SCF. Named Meridian Trade Finance SA and Danube Finance Group in 2024 treasury review as potential SCF partners.',
    why:'Chemicals sector intensity 0.90. Seasonal patterns make SCF volume predictable (low underwriting risk). CEE sourcing footprint creates a direct bridge to Central European bank partners — unique cross-selling angle.'
  },
  {
    id:'bfh-pl', n:'Baltic FMCG Holdings SA', c:'PL', sector:'FMCG',
    rev:7.4, intensity:0.90, employees:9800,
    desc:'Poland\'s leading FMCG distributor with 500+ domestic suppliers. Payment terms shortening from 75 to 60 days under supplier pressure — creates immediate refinancing need. Cited Vistula Commerce Group as primary banking partner in 2024 annual review.',
    why:'FMCG intensity 0.90. Fast-moving goods create high-frequency, low-tenor SCF transactions — ideal for platform economics. Supplier pressure on payment terms creates urgency: the bank that provides the bridge captures the relationship.'
  },
  {
    id:'arn-it', n:'Adriatic Retail Network SpA', c:'IT', sector:'Retail',
    rev:14.3, intensity:0.85, employees:31000,
    desc:'Italy\'s third-largest retail chain. Seasonal financing peaks Q3–Q4 (back-to-school and holiday season) generate €800M+ SCF window. Currently operates with a single SCF bank relationship — board resolution in Q4 2024 to diversify to minimum two banking partners.',
    why:'Retail intensity 0.85. Seasonal predictability + board-level mandate to diversify creates a timed, well-defined sales opportunity. Single-bank dependency means the winning bank captures the full program — no share competition.'
  },
  {
    id:'ipg-es', n:'Iberian Pharma Group SA', c:'ES', sector:'Pharma',
    rev:9.1, intensity:0.80, employees:14600,
    desc:'Spanish pharmaceutical group with LATAM export operations. API ingredient sourcing from India/China creates 18-month typical payment tenors. Regulatory compliance (GMP, GDP) aligns with structured SCF documentation requirements. Exploring SCF as part of ESG supply chain financing initiative.',
    why:'Pharma intensity 0.80. Long payment tenors (18+ months) generate premium SCF margins. ESG supply chain financing is the fastest-growing SCF segment in 2025. Regulatory documentation overlap reduces operational friction.'
  },
  {
    id:'dap-hu', n:'Danube Agri Partners Kft', c:'HU', sector:'Agribusiness',
    rev:4.8, intensity:0.80, employees:3200,
    desc:'Central European agri-processor handling grain, oilseeds and feed. EU subsidy cycles create highly predictable cash flows — peak financing demand Q2 (planting season) and Q3 (harvest). €300M annual SCF program volume with Danube Finance Group a.s. as lead bank.',
    why:'Agribusiness intensity 0.80. EU subsidy-linked cash flows make agri-SCF the most predictable asset class in European structured finance. Calendar-driven demand = low underwriting complexity. Danube Finance Group already in position as lead bank.'
  },
  {
    id:'nlp-se', n:'Nordic Logistics Platform AB', c:'SE', sector:'Logistics',
    rev:6.9, intensity:0.70, employees:4100,
    desc:'Asset-light pan-European 3PL operator with 200+ transport subcontractors across 8 EU countries. Reverse factoring program in development — seeking a lead bank with multi-country capability. Invoice tenors 30–60 days, high volume, low individual ticket.',
    why:'Logistics intensity 0.70. Asset-light model means subcontractors bear working capital burden — reverse factoring is the natural solution. 200 subcontractors × 12 invoices/year = 2,400 annual transactions: ideal for platform economics.'
  },
  {
    id:'vms-pl', n:'Vistula Manufacturing SA', c:'PL', sector:'Industrial',
    rev:5.3, intensity:0.95, employees:8700,
    desc:'Polish industrial manufacturer supplying German OEMs as a tier-1 supplier. Receivables are backed by German-grade credit risk (BMW, Mercedes supply chain) on Polish-priced tickets — premium spread for financing banks. 300+ local suppliers on 90-day payment terms.',
    why:'Industrial intensity 0.95. The Polish-to-German OEM receivable structure is one of the most attractive SCF positions in CEE: German credit quality, Polish pricing, Polish bank as financer. Vistula Commerce Group is the natural lead bank.'
  },
  {
    id:'aep-ch', n:'Alpine Energy Partners AG', c:'CH', sector:'Energy',
    rev:12.1, intensity:0.75, employees:2800,
    desc:'Swiss-based energy transition infrastructure developer. EPC project receivables with 18–36 month tenors. Multi-party financing structures with European Investment Bank and commercial banks. ESG green bond framework already in place — compatible with sustainable SCF structures.',
    why:'Energy intensity 0.75 but compensated by ticket size and margins. Infrastructure receivables command 180–250bps above standard SCF — highest margin per unit in the portfolio. EIB involvement provides implicit guarantee structure.'
  }
];

const SECTOR_WEIGHTS = {Automotive:1.0,Industrial:0.95,FMCG:0.90,Chemicals:0.90,Retail:0.85,Construction:0.85,Pharma:0.80,Agribusiness:0.80,Energy:0.75,Mining:0.70,Logistics:0.70,Aerospace:0.65,Telecom:0.55,Tech:0.55,Utilities:0.50,Luxury:0.40};

const FLAG = {DE:'🇩🇪',FR:'🇫🇷',UK:'🇬🇧',IT:'🇮🇹',CH:'🇨🇭',ES:'🇪🇸',NL:'🇳🇱',SE:'🇸🇪',AT:'🇦🇹',PL:'🇵🇱',CZ:'🇨🇿',HU:'🇭🇺',BE:'🇧🇪',RO:'🇷🇴'};

function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

function buildHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CredAble Intelligence Platform</title>
<style>
:root{--bg:#0d1117;--s:#161b22;--s2:#1c2128;--bd:#30363d;--t:#e6edf3;--m:#8b949e;--a:#58a6ff;--g:#3fb950;--y:#d29922;--r:#f85149;--p:#bc8cff;--o:#ffa657;}
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--t);font-size:13px;}
header{background:var(--s);border-bottom:1px solid var(--bd);padding:12px 24px;display:flex;align-items:center;gap:14px;position:sticky;top:0;z-index:100;}
.logo{font-size:15px;font-weight:700;}
.badge{background:var(--p);color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;letter-spacing:.5px;}
.badge-demo{background:#d29922;color:#000;}
.meta-pill{margin-left:auto;display:flex;gap:10px;}
.pill{background:var(--s2);border:1px solid var(--bd);border-radius:20px;padding:3px 10px;font-size:11px;color:var(--m);}
.pill span{color:var(--t);font-weight:600;}
.layout{display:flex;height:calc(100vh - 46px);}
.sidebar{width:220px;background:var(--s);border-right:1px solid var(--bd);display:flex;flex-direction:column;flex-shrink:0;overflow-y:auto;}
.sb-section{padding:10px 0;border-bottom:1px solid var(--bd);}
.sb-label{font-size:10px;font-weight:600;color:var(--m);text-transform:uppercase;letter-spacing:.8px;padding:0 14px 6px;}
.nav-item{display:flex;align-items:center;gap:8px;padding:7px 14px;cursor:pointer;color:var(--m);font-size:12px;transition:all .15s;}
.nav-item:hover{background:var(--s2);color:var(--t);}
.nav-item.active{background:#388bfd22;color:var(--a);border-right:2px solid var(--a);}
.sb-stat{margin:10px 14px;background:var(--s2);border:1px solid var(--bd);border-radius:6px;padding:8px 10px;}
.sb-stat .lbl{font-size:10px;color:var(--m);}
.sb-stat .val{font-size:20px;font-weight:700;}
.sb-stat .sub{font-size:10px;color:var(--m);}
.sb-stat .cap{font-size:10px;color:var(--a);font-weight:600;margin-top:2px;}
.main{flex:1;overflow-y:auto;padding:20px 24px;}
.page{display:none;}
.page.active{display:block;}
.ph{display:flex;align-items:baseline;gap:10px;margin-bottom:4px;}
.ph h2{font-size:15px;font-weight:600;}
.pd{font-size:12px;color:var(--m);margin-bottom:16px;}
.demo-note{background:#d2992215;border:1px solid #d2992240;border-radius:6px;padding:8px 14px;font-size:11px;color:var(--y);margin-bottom:16px;display:flex;align-items:center;gap:8px;}
.filters{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;align-items:center;}
.filters select,.filters input[type=range]{background:var(--s2);border:1px solid var(--bd);color:var(--t);padding:5px 10px;border-radius:6px;font-size:12px;outline:none;}
.filters select:focus{border-color:var(--a);}
table{width:100%;border-collapse:collapse;font-size:12px;}
thead th{background:var(--s2);border-bottom:1px solid var(--bd);padding:8px 10px;text-align:left;font-size:10px;font-weight:600;color:var(--m);text-transform:uppercase;letter-spacing:.5px;white-space:nowrap;cursor:pointer;user-select:none;}
thead th:hover{color:var(--t);}
thead th.sorted{color:var(--a);}
tbody tr{border-bottom:1px solid #21262d;transition:background .1s;}
tbody tr:hover{background:var(--s2);}
tbody td{padding:7px 10px;vertical-align:middle;}
.bb{display:inline-block;padding:2px 7px;border-radius:10px;font-size:10px;font-weight:700;letter-spacing:.3px;}
.bHIGH{background:#3fb95022;color:var(--g);border:1px solid #3fb95044;}
.bMEDIUM-HIGH{background:#ffa65722;color:var(--o);border:1px solid #ffa65744;}
.bMEDIUM{background:#d2992222;color:var(--y);border:1px solid #d2992244;}
.bLOW{background:#8b949e22;color:var(--m);border:1px solid #8b949e44;}
.bar-t{flex:1;height:4px;background:var(--bd);border-radius:2px;min-width:50px;}
.bar-f{height:100%;border-radius:2px;}
.sbar{display:flex;align-items:center;gap:6px;}
.quadrant-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;min-height:380px;}
.q-wrap{display:grid;grid-template-columns:28px 1fr;grid-template-rows:1fr 28px;}
.q-yax{grid-column:1;grid-row:1;display:flex;align-items:center;justify-content:center;writing-mode:vertical-rl;transform:rotate(180deg);font-size:10px;color:var(--m);text-transform:uppercase;letter-spacing:.5px;}
.q-xax{grid-column:2;grid-row:2;display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--m);text-transform:uppercase;letter-spacing:.5px;padding-top:6px;}
.q-grid{grid-column:2;grid-row:1;}
.quadrant{background:var(--s2);border:1px solid var(--bd);border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:6px;overflow:hidden;}
.qTR{border-color:#3fb95044;background:#3fb95008;}
.qTL{border-color:#58a6ff44;background:#58a6ff08;}
.qBR{border-color:#ffa65744;background:#ffa65708;}
.q-hd{display:flex;align-items:center;justify-content:space-between;padding-bottom:8px;border-bottom:1px solid var(--bd);}
.q-ht{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;}
.qTR .q-ht{color:var(--g);}
.qTL .q-ht{color:var(--a);}
.qBR .q-ht{color:var(--o);}
.qLL .q-ht{color:var(--m);}
.q-sub{font-size:10px;color:var(--m);}
.q-cnt{font-size:11px;font-weight:700;padding:1px 7px;border-radius:10px;background:var(--s);border:1px solid var(--bd);color:var(--m);}
.q-banks{display:flex;flex-wrap:wrap;gap:5px;flex:1;align-content:flex-start;overflow-y:auto;max-height:130px;padding-top:4px;}
.chip{display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:16px;cursor:pointer;font-size:11px;transition:all .15s;border:1px solid var(--bd);background:var(--s);color:var(--t);white-space:nowrap;}
.chip:hover{border-color:var(--a);background:#388bfd11;}
.chip-s{font-weight:700;font-size:10px;padding:1px 4px;border-radius:4px;background:var(--bd);}
.qTR .chip-s{background:#3fb95033;color:var(--g);}
.qTL .chip-s{background:#58a6ff22;color:var(--a);}
.qBR .chip-s{background:#ffa65722;color:var(--o);}
.legend{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:14px;padding:10px 14px;background:var(--s);border:1px solid var(--bd);border-radius:8px;}
.leg{display:flex;align-items:center;gap:6px;font-size:11px;}
.dot{width:10px;height:10px;border-radius:50%;}
.card{background:var(--s2);border:1px solid var(--bd);border-radius:8px;padding:16px;}
.card h3{font-size:11px;font-weight:600;color:var(--m);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px;}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;}
.srow{display:flex;align-items:center;gap:8px;margin-bottom:6px;}
.sn{width:130px;font-size:11px;}
.sbw{flex:1;height:6px;background:var(--bd);border-radius:3px;}
.sb{height:100%;border-radius:3px;}
.sv{width:40px;text-align:right;font-size:11px;color:var(--m);}
.crow{display:flex;align-items:center;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--bd);}
.crow:last-child{border-bottom:none;}
.ci{flex:1;margin:0 8px;}
.panel{background:var(--s2);border:1px solid var(--bd);border-radius:8px;padding:16px;margin-bottom:12px;}
.panel-h{display:flex;align-items:center;gap:8px;margin-bottom:10px;}
.panel-h h3{font-size:13px;font-weight:600;color:var(--p);}
.cc{background:var(--s);border:1px solid var(--bd);border-radius:6px;padding:10px;}
.cc-lbl{font-size:10px;color:var(--m);margin-bottom:4px;}
.cc-val{font-size:20px;font-weight:700;}
.cc-desc{font-size:10px;color:var(--m);line-height:1.4;border-top:1px solid var(--bd);margin-top:6px;padding-top:6px;}
.pitch-line{padding:8px 12px;border-radius:6px;font-size:12px;line-height:1.7;margin-bottom:6px;background:var(--s);border-left:3px solid var(--bd);}
.pitch-line.high{border-left-color:var(--g);}
.pitch-line.mid{border-left-color:var(--a);}
.pitch-line.low{border-left-color:var(--m);}
.tag{display:inline-block;background:var(--s);border:1px solid var(--bd);border-radius:4px;padding:1px 6px;font-size:10px;color:var(--m);margin:1px;}
.hcard{position:fixed;z-index:600;background:var(--s);border:1px solid var(--bd);border-radius:8px;padding:12px;font-size:11px;max-width:260px;box-shadow:0 4px 20px rgba(0,0,0,.6);pointer-events:none;display:none;line-height:1.7;}
.hcard.on{display:block;}
.cta-bar{background:linear-gradient(135deg,#388bfd22,#bc8cff22);border:1px solid var(--a);border-radius:10px;padding:20px 24px;text-align:center;margin-top:20px;}
.cta-bar h3{font-size:15px;font-weight:700;margin-bottom:6px;}
.cta-bar p{font-size:12px;color:var(--m);margin-bottom:14px;line-height:1.6;}
.cta-btn{display:inline-block;background:var(--a);color:#fff;border:none;border-radius:6px;padding:10px 24px;font-size:13px;font-weight:600;cursor:pointer;text-decoration:none;}
.cta-btn:hover{background:#4090e0;}
.sig-match{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:12px;font-size:11px;border:1px solid var(--p);background:#bc8cff15;}
.sig-other{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:12px;font-size:11px;border:1px solid var(--bd);background:var(--s2);}
.role-lead{color:var(--g);font-size:9px;}
.role-participant{color:var(--a);font-size:9px;}
.role-local_partner{color:var(--o);font-size:9px;}
.role-shortlisted{color:var(--y);font-size:9px;}
</style>
</head>
<body>
<header>
  <div class="logo">CredAble Intelligence</div>
  <span class="badge">PLATFORM v2.4</span>
  <span class="badge badge-demo">RESTRICTED PREVIEW</span>
  <div class="meta-pill">
    <div class="pill"><span>${META.banks}</span> banks analyzed</div>
    <div class="pill"><span>${META.corps}</span> corporates</div>
    <div class="pill"><span>${META.markets}</span> markets</div>
    <div class="pill"><span>${META.extractions}</span> LLM extractions</div>
  </div>
</header>
<div class="hcard" id="hcard"></div>
<div class="layout">
<aside class="sidebar">
  <div class="sb-section">
    <div class="sb-stat">
      <div class="lbl">Banks Scored (preview)</div>
      <div class="val">10 <span style="font-size:13px;color:var(--m)">/ ${META.banks}</span></div>
      <div class="cap">Full system: all ${META.banks} European banks</div>
    </div>
    <div class="sb-stat">
      <div class="lbl">Corporates (preview)</div>
      <div class="val">10 <span style="font-size:13px;color:var(--m)">/ ${META.corps}</span></div>
      <div class="cap">Full system: ${META.corps} EU corporates tracked</div>
    </div>
  </div>
  <div class="sb-section">
    <div class="sb-label">Views</div>
    <div class="nav-item active" onclick="nav('ranking')" id="nav-ranking">🏆 Opportunities</div>
    <div class="nav-item" onclick="nav('matrix')" id="nav-matrix">🎯 Priority Matrix</div>
    <div class="nav-item" onclick="nav('markets')" id="nav-markets">🌍 Markets</div>
    <div class="nav-item" onclick="nav('sectors')" id="nav-sectors">🏭 Sectors</div>
    <div class="nav-item" onclick="nav('pitch')" id="nav-pitch">💬 Pitch Builder</div>
    <div class="nav-item" onclick="nav('corps')" id="nav-corps">🏢 Corporates</div>
  </div>
</aside>
<main class="main">

<!-- RANKING -->
<div class="page active" id="page-ranking">
  <div class="ph"><h2>Opportunity Ranking — Combined Score</h2></div>
  <p class="pd">Combined Score = √(BIS × MPS). Banks with both a high buying signal and strong market pressure rank highest.</p>
  <div class="demo-note">⚑ Preview mode — showing 10 of ${META.banks} banks analyzed. Full system includes all EU-27 countries and ${META.extractions.toLocaleString()} LLM-powered document extractions.</div>
  <div class="filters">
    <select id="fBucket" onchange="renderRanking()">
      <option value="">All tiers</option>
      <option value="HIGH">HIGH</option>
      <option value="MEDIUM-HIGH">MEDIUM-HIGH</option>
      <option value="MEDIUM">MEDIUM</option>
      <option value="LOW">LOW</option>
    </select>
    <select id="fSCF" onchange="renderRanking()">
      <option value="">All SCF levels</option>
      <option value="ABSENT">Absent</option>
      <option value="BASIC">Basic</option>
      <option value="INTERMEDIATE">Intermediate</option>
      <option value="ADVANCED">Advanced</option>
    </select>
  </div>
  <div id="rankingTable"></div>
</div>

<!-- MATRIX -->
<div class="page" id="page-matrix">
  <div class="ph"><h2>Priority Matrix — BIS × MPS</h2></div>
  <p class="pd">Four strategic quadrants based on bank buying signal (BIS) and market pressure from corporate clients (MPS). Click any bank to open its pitch.</p>
  <div class="demo-note">⚑ Preview — 10 of ${META.banks} banks shown. Full matrix covers all ${META.markets} European markets.</div>
  <div class="legend">
    <div class="leg"><div class="dot" style="background:var(--g)"></div><strong style="color:var(--g)">Top Priority</strong> — High BIS + High MPS → act now</div>
    <div class="leg"><div class="dot" style="background:var(--a)"></div><strong style="color:var(--a)">Market Pull</strong> — Strong corporate demand, bank not yet ready → monitor</div>
    <div class="leg"><div class="dot" style="background:var(--o)"></div><strong style="color:var(--o)">Bank Ready</strong> — High buying signal, limited corporate pressure → targeted approach</div>
    <div class="leg"><div class="dot" style="background:var(--m)"></div><strong style="color:var(--m)">Pipeline</strong> — Low signals both sides → long-term pipeline</div>
  </div>
  <div class="q-wrap">
    <div class="q-yax">MPS — Market Pressure ↑</div>
    <div class="quadrant-grid q-grid" id="qGrid"></div>
    <div class="q-xax">BIS — Bank Buying Signal →</div>
  </div>
</div>

<!-- MARKETS -->
<div class="page" id="page-markets">
  <div class="ph"><h2>Market Coverage</h2></div>
  <p class="pd">Corporate density and addressable revenue by country — the geographic basis of the MPS geo-score.</p>
  <div class="demo-note">⚑ Preview — 10 of ${META.corps} corporates shown. Full system: ${META.corps} EU corporates across ${META.markets} markets.</div>
  <div class="two-col" id="mktContent"></div>
</div>

<!-- SECTORS -->
<div class="page" id="page-sectors">
  <div class="ph"><h2>Sector Analysis</h2></div>
  <p class="pd">SCF demand intensity by sector — the coefficient that drives each corporate's pressure on its bank to adopt SCF solutions.</p>
  <div class="two-col" id="secContent"></div>
</div>

<!-- PITCH -->
<div class="page" id="page-pitch">
  <div class="ph"><h2>Pitch Builder</h2></div>
  <p class="pd">Select a bank to generate its full commercial brief — combined BIS + MPS scoring, market context, corporate signals, and recommended approach angle.</p>
  <div class="filters">
    <select id="pitchSel" onchange="renderPitch()" style="min-width:300px">
      <option value="">— Select a bank —</option>
      ${BANKS.sort((a,b)=>b.score-a.score).map(b=>`<option value="${b.id}">${esc(b.n)} (${b.c}) — Score ${b.score}</option>`).join('')}
    </select>
  </div>
  <div id="pitchContent"></div>
</div>

<!-- CORPORATES -->
<div class="page" id="page-corps">
  <div class="ph"><h2>Corporate Intelligence</h2></div>
  <p class="pd">Preview of 10 tracked corporates — each profile is enriched with LLM extraction from annual reports, treasury reviews, and SCF program disclosures.</p>
  <div class="demo-note">⚑ Preview — 10 of ${META.corps} corporates. Full system: ${META.extractions.toLocaleString()} document extractions across all sectors.</div>
  <div id="corpContent"></div>
</div>

</main>
</div>

<script>
const BANKS=${JSON.stringify(BANKS)};
const CORPS=${JSON.stringify(CORPS)};
const FLAG=${JSON.stringify(FLAG)};
const SW=${JSON.stringify(SECTOR_WEIGHTS)};
let _sc='score',_sa=false;

function nav(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  document.getElementById('nav-'+id).classList.add('active');
  if(id==='ranking')renderRanking();
  if(id==='matrix')renderMatrix();
  if(id==='markets')renderMarkets();
  if(id==='sectors')renderSectors();
  if(id==='corps')renderCorps();
}

function scoreClass(s){return s>=70?'#3fb950':s>=50?'#ffa657':s>=35?'#d29922':'#8b949e';}

function renderRanking(){
  const bkt=document.getElementById('fBucket').value;
  const scf=document.getElementById('fSCF').value;
  let rows=BANKS.filter(b=>(!bkt||b.tier===bkt)&&(!scf||b.scf===scf));
  rows=rows.sort((a,b)=>_sa?(a[_sc]>b[_sc]?1:-1):(a[_sc]<b[_sc]?1:-1));
  const mB=Math.max(...BANKS.map(b=>b.bis)),mM=Math.max(...BANKS.map(b=>b.mps)),mS=Math.max(...BANKS.map(b=>b.score));
  const si=c=>c===_sc?(_sa?' ↑':' ↓'):'';
  const th=(c,l)=>\`<th onclick="sort('$\{c}')" class="$\{_sc===c?'sorted':''}">${l}$\{si(c)}</th>\`;
  document.getElementById('rankingTable').innerHTML=\`<table><thead><tr>\${th('n','Bank')}<th>Country</th>\${th('score','Combined')}\${th('mps','MPS')}\${th('bis','BIS')}<th>Tier</th><th>SCF Level</th><th>Corporates</th><th>Revenue</th><th>Window</th></tr></thead><tbody>
  $\{rows.map((b,i)=>\`<tr>
    <td><strong style="cursor:pointer;color:var(--a)" onclick="openPitch('$\{b.id}')">${esc(b.n)}</strong></td>
    <td>$\{FLAG[b.c]||''} $\{b.c}</td>
    <td><div class="sbar"><span style="font-size:16px;font-weight:700;color:$\{scoreClass(b.score)}">${b.score}</span><div class="bar-t"><div class="bar-f" style="width:$\{Math.round(b.score/mS*100)}%;background:$\{scoreClass(b.score)}"></div></div></div></td>
    <td><div class="sbar"><span style="min-width:24px;color:var(--p)">${b.mps}</span><div class="bar-t"><div class="bar-f" style="width:$\{Math.round(b.mps/mM*100)}%;background:var(--p)"></div></div></div></td>
    <td><div class="sbar"><span style="min-width:24px;color:var(--a)">${b.bis}</span><div class="bar-t"><div class="bar-f" style="width:$\{Math.round(b.bis/mB*100)}%;background:var(--a)"></div></div></div></td>
    <td><span class="bb b$\{b.tier}">${b.tier}</span></td>
    <td style="color:var(--m)">${b.scf}</td>
    <td style="text-align:center">${b.mkt.corps}</td>
    <td style="color:var(--o)">${b.mkt.rev}Bn€</td>
    <td style="color:var(--m)">${b.window}mo</td>
  </tr>\`).join('')}
  </tbody></table><div style="margin-top:8px;font-size:11px;color:var(--m)">${rows.length} banks shown — <span style="color:var(--a)">${META.banks} analyzed in full system</span></div>\`;
}

function sort(c){if(_sc===c)_sa=!_sa;else{_sc=c;_sa=false;}renderRanking();}

function openPitch(id){nav('pitch');setTimeout(()=>{document.getElementById('pitchSel').value=id;renderPitch();},50);}

function renderMatrix(){
  const bv=BANKS.map(b=>b.bis).sort((a,b)=>a-b),mv=BANKS.map(b=>b.mps).sort((a,b)=>a-b);
  const bm=bv[Math.floor(bv.length/2)],mm=mv[Math.floor(mv.length/2)];
  const hh=BANKS.filter(b=>b.bis>=bm&&b.mps>=mm).sort((a,b)=>b.score-a.score);
  const lh=BANKS.filter(b=>b.bis<bm&&b.mps>=mm).sort((a,b)=>b.score-a.score);
  const hl=BANKS.filter(b=>b.bis>=bm&&b.mps<mm).sort((a,b)=>b.score-a.score);
  const ll=BANKS.filter(b=>b.bis<bm&&b.mps<mm).sort((a,b)=>b.score-a.score);
  const chips=list=>list.map(b=>{
    const d=JSON.stringify({n:b.n,c:b.c,s:b.score,bis:b.bis,mps:b.mps,t:b.tier,corps:b.mkt.corps,rev:b.mkt.rev,scf:b.scf}).replace(/"/g,'&quot;');
    return \`<div class="chip" onmouseenter="showHCard(this,'$\{d}')" onmouseleave="hideHCard()" onclick="openPitch('$\{b.id}')"><span>${esc(b.n)}</span><span class="chip-s">${b.score}</span></div>\`;
  }).join('');
  const q=(cls,icon,title,sub,count,list)=>\`<div class="quadrant $\{cls}"><div class="q-hd"><div><div class="q-ht">$\{icon} $\{title}</div><div class="q-sub">$\{sub}</div></div><span class="q-cnt">$\{count}</span></div><div class="q-banks">$\{list}</div></div>\`;
  document.getElementById('qGrid').innerHTML=
    q('qTL','📊','Market Pull',\`MPS ≥ $\{mm} · BIS < $\{bm}\`,lh.length,chips(lh))+
    q('qTR','⭐','Top Priority',\`MPS ≥ $\{mm} · BIS ≥ $\{bm}\`,hh.length,chips(hh))+
    q('qLL','💤','Pipeline',\`MPS < $\{mm} · BIS < $\{bm}\`,ll.length,chips(ll))+
    q('qBR','🎯','Bank Ready',\`MPS < $\{mm} · BIS ≥ $\{bm}\`,hl.length,chips(hl));
}

function showHCard(el,ds){
  const d=JSON.parse(ds.replace(/&quot;/g,'"'));
  const c=document.getElementById('hcard');
  c.innerHTML=\`<strong>${esc(d.n)}</strong> ($\{d.c})<br><span style="color:var(--g)">Combined: <strong>$\{d.s}</strong></span> · <span style="color:var(--a)">BIS: $\{d.bis}</span> · <span style="color:var(--p)">MPS: $\{d.mps}</span><br>SCF: <strong>$\{d.scf}</strong> · <span class="bb b$\{d.t}">$\{d.t}</span><br>$\{d.corps} corporates · <span style="color:var(--o)">$\{d.rev}Bn€</span><br><span style="font-size:10px;color:var(--m)">Click to open in Pitch Builder →</span>\`;
  const r=el.getBoundingClientRect();
  c.style.left=Math.min(r.right+8,window.innerWidth-275)+'px';
  c.style.top=Math.min(r.top,window.innerHeight-160)+'px';
  c.classList.add('on');
}
function hideHCard(){document.getElementById('hcard').classList.remove('on');}

function renderMarkets(){
  const bc={};CORPS.forEach(c=>{if(!bc[c.c])bc[c.c]={n:0,rev:0,sec:{}};bc[c.c].n++;bc[c.c].rev+=c.rev;bc[c.c].sec[c.sector]=(bc[c.c].sec[c.sector]||0)+1;});
  const sorted=Object.entries(bc).sort((a,b)=>b[1].n-a[1].n);
  const mr=Math.max(...sorted.map(([,v])=>v.rev));
  const bb={};BANKS.forEach(b=>{bb[b.c]=(bb[b.c]||0)+1;});
  document.getElementById('mktContent').innerHTML=\`
  <div class="card"><h3>Corporate Coverage by Country</h3>
  $\{sorted.map(([ct,d])=>{const ts=Object.entries(d.sec).sort((a,b)=>b[1]-a[1])[0];return \`<div class="crow"><span style="font-size:16px">${FLAG[ct]||'🌐'}</span><div class="ci"><div style="font-size:12px"><strong>$\{ct}</strong> — $\{d.n} corporate$\{d.n>1?'s':''} · $\{bb[ct]||0} bank$\{(bb[ct]||0)>1?'s':''} tracked</div><div style="font-size:10px;color:var(--m)">Top sector: $\{ts?.[0]||'—'} ($\{ts?.[1]||0})</div></div><span style="color:var(--o);font-weight:600">${Math.round(d.rev)}Bn€</span></div>\`;}).join('')}
  </div>
  <div class="card"><h3>Addressable Revenue by Country (€Bn)</h3>
  $\{sorted.map(([ct,d])=>\`<div class="srow"><div class="sn">${FLAG[ct]||'🌐'} $\{ct}</div><div class="sbw"><div class="sb" style="width:$\{Math.round(d.rev/mr*100)}%;background:var(--o)"></div></div><div class="sv">${Math.round(d.rev)}Bn</div></div>\`).join('')}
  </div>\`;
}

function renderSectors(){
  const bs={};CORPS.forEach(c=>{if(!bs[c.sector])bs[c.sector]={n:0,rev:0};bs[c.sector].n++;bs[c.sector].rev+=c.rev;});
  const sorted=Object.entries(bs).sort((a,b)=>b[1].n-a[1].n);
  const mn=Math.max(...sorted.map(([,v])=>v.n));
  const iSorted=Object.entries(SW).sort((a,b)=>b[1]-a[1]);
  const wc=w=>w>=0.85?'var(--g)':w>=0.65?'var(--o)':w>=0.45?'var(--y)':'var(--m)';
  document.getElementById('secContent').innerHTML=\`
  <div class="card"><h3>Corporate Distribution by Sector</h3>
  $\{sorted.map(([s,d])=>\`<div class="srow"><div class="sn">$\{s}</div><div class="sbw"><div class="sb" style="width:$\{Math.round(d.n/mn*100)}%;background:var(--p)"></div></div><div class="sv">$\{d.n}</div></div>\`).join('')}
  </div>
  <div class="card"><h3>SCF Demand Intensity by Sector</h3>
  <p style="font-size:11px;color:var(--m);margin-bottom:12px">Coefficient applied in MPS calculation — represents the probability that a corporate in this sector will push its bank to adopt an SCF solution.</p>
  $\{iSorted.map(([s,w])=>\`<div class="srow"><div class="sn">$\{s}</div><div class="sbw"><div class="sb" style="width:$\{Math.round(w*100)}%;background:$\{wc(w)}"></div></div><div class="sv" style="color:$\{wc(w)}">${Math.round(w*100)}%</div></div>\`).join('')}
  </div>\`;
}

function renderPitch(){
  const id=document.getElementById('pitchSel').value;
  if(!id){document.getElementById('pitchContent').innerHTML='';return;}
  const b=BANKS.find(x=>x.id===id);
  if(!b)return;
  const bg=b.bis<=20?'🔴':b.bis<=40?'🟡':'🟢';
  const mg=b.mps<=30?'🔴':b.mps<=55?'🟡':'🟢';
  const cc=(l,v,m,c,desc)=>\`<div class="cc"><div class="cc-lbl">${l} (/${m})</div><div class="cc-val" style="color:$\{c}">${v}</div><div class="bar-t" style="margin-top:4px"><div class="bar-f" style="width:$\{m?Math.round(v/m*100):0}%;background:$\{c}"></div></div><div class="cc-desc">$\{desc}</div></div>\`;
  const pl=b.pitch.map((p,i)=>\`<div class="pitch-line $\{i===0?'high':i===1?'mid':'low'}">$\{esc(p)}</div>\`).join('');
  let sigs='';
  if(b.sigs&&b.sigs.length){
    sigs='<div class="panel"><div class="panel-h"><h3>🔗 Corporate Extraction Signals</h3></div>';
    b.sigs.forEach(s=>{
      sigs+=\`<div style="margin-bottom:10px;padding:10px;background:var(--s);border-radius:6px;border:1px solid var(--bd)"><div style="font-size:12px;margin-bottom:6px"><strong>$\{esc(s.corp)}</strong> <span style="color:var(--m)">— references this bank in SCF program disclosures:</span></div><div style="display:flex;flex-wrap:wrap;gap:5px">\`;
      s.mentions.forEach(m=>{
        const isT=m.n.toLowerCase().includes(b.n.toLowerCase().split(' ')[0].toLowerCase());
        sigs+=\`<span class="$\{isT?'sig-match':'sig-other'}" title="$\{esc(m.ctx)}"><span style="font-weight:$\{isT?700:400};color:$\{isT?'var(--p)':'var(--t)'}">$\{esc(m.n)}</span><span class="role-$\{m.role}">$\{m.role}</span><span style="font-size:9px;color:var(--m)">$\{m.prod}</span></span>\`;
      });
      const tm=s.mentions.find(m=>m.n.toLowerCase().includes(b.n.toLowerCase().split(' ')[0].toLowerCase()));
      sigs+=\`</div>$\{tm?\`<div style="margin-top:6px;font-size:11px;color:var(--m);font-style:italic">"$\{esc(tm.ctx)}"</div>\`:''}</div>\`;
    });
    sigs+='</div>';
  }
  document.getElementById('pitchContent').innerHTML=\`
  <div class="panel">
    <div class="panel-h"><h3>📊 Combined Score</h3></div>
    <div style="display:flex;gap:24px;margin-bottom:14px;flex-wrap:wrap">
      <div><div style="font-size:11px;color:var(--m)">Combined Score</div><div style="font-size:32px;font-weight:700;color:$\{scoreClass(b.score)}">${b.score}</div><div style="font-size:10px;color:var(--m)">√(BIS × MPS)</div></div>
      <div><div style="font-size:11px;color:var(--m)">${bg} BIS</div><div style="font-size:22px;font-weight:600;color:var(--a)">${b.bis}<span style="font-size:12px;color:var(--m)">/100</span></div><div style="font-size:10px;color:var(--m)">Bank buying signal</div></div>
      <div><div style="font-size:11px;color:var(--m)">${mg} MPS</div><div style="font-size:22px;font-weight:600;color:var(--p)">${b.mps}<span style="font-size:12px;color:var(--m)">/100</span></div><div style="font-size:10px;color:var(--m)">Market pressure</div></div>
      <div><div style="font-size:11px;color:var(--m)">Tier</div><div style="margin-top:4px"><span class="bb b$\{b.tier}">${b.tier}</span></div></div>
      <div><div style="font-size:11px;color:var(--m)">Action Window</div><div style="font-size:18px;font-weight:600;color:var(--y)">${b.window}mo</div></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
      $\{cc('Geo Score',b.comp.geo,40,'var(--a)','Corporate density in same country and EU region.')}
      $\{cc('Sector Score',b.comp.sector,25,'var(--p)','SCF intensity of sectors in the direct market.')}
      $\{cc('SCF Gap',b.comp.gap,25,'var(--o)','Gap between current SCF level and maximum (ABSENT=25pts).')}
      $\{cc('BIS Boost',b.comp.sig,10,'var(--g)','Signal carryover from Model 1 buying intent score.')}
    </div>
  </div>
  <div class="panel">
    <div class="panel-h"><h3>🌍 Market Context</h3></div>
    <p style="font-size:12px;line-height:1.7;color:var(--t);margin-bottom:12px">${esc(b.ctx)}</p>
    <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:10px">
      <div><div style="font-size:10px;color:var(--m)">Direct Corporates</div><div style="font-size:20px;font-weight:700">${b.mkt.corps}</div></div>
      <div><div style="font-size:10px;color:var(--m)">Direct Revenue</div><div style="font-size:20px;font-weight:700;color:var(--o)">${b.mkt.rev}Bn€</div></div>
      <div><div style="font-size:10px;color:var(--m)">Regional Pipeline</div><div style="font-size:20px;font-weight:700;color:var(--y)">${b.mkt.reg_rev}Bn€</div></div>
      <div><div style="font-size:10px;color:var(--m)">Region</div><div style="font-size:14px;font-weight:600">${b.region}</div></div>
      <div><div style="font-size:10px;color:var(--m)">Tech Stack</div><div style="font-size:12px;font-weight:500">${b.stack.core}</div><div style="font-size:10px;color:var(--m)">${b.stack.platform}</div></div>
    </div>
    <div>${b.mkt.sectors.map(s=>\`<span class="tag">$\{s}</span>\`).join(' ')}</div>
  </div>
  $\{sigs}
  <div class="panel">
    <div class="panel-h"><h3>💬 Recommended Approach</h3></div>
    <p style="font-size:12px;color:var(--m);margin-bottom:10px"><strong>SCF Level:</strong> $\{b.scf} &nbsp;·&nbsp; <strong>Priority:</strong> $\{b.priority} &nbsp;·&nbsp; <strong>Stack friction:</strong> $\{b.stack.friction}</p>
    $\{pl}
  </div>
  <div class="cta-bar">
    <h3>Full system: ${META.banks} banks × ${META.corps} corporates</h3>
    <p>This preview shows 10 banks from our live intelligence platform. The full system covers all EU-27 markets with ${META.extractions.toLocaleString()} LLM-powered document extractions, real-time news signals, and predictive scoring updated monthly.</p>
    <a class="cta-btn" href="mailto:david.perron@gmx.fr?subject=CredAble%20Intelligence%20Platform%20Access">Request Full Access</a>
  </div>\`;
}

function renderCorps(){
  const sc={Automotive:1.0,Industrial:0.95,FMCG:0.90,Chemicals:0.90,Retail:0.85,Pharma:0.80,Agribusiness:0.80,Logistics:0.70,Energy:0.75};
  const ic=w=>w>=0.90?'var(--g)':w>=0.80?'var(--o)':w>=0.65?'var(--y)':'var(--m)';
  document.getElementById('corpContent').innerHTML=CORPS.map(c=>\`
  <div class="panel">
    <div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:10px">
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <span style="font-size:15px;font-weight:700">${esc(c.n)}</span>
          <span style="color:var(--m);font-size:12px">${FLAG[c.c]||''} $\{c.c}</span>
          <span class="tag" style="color:var(--p);border-color:var(--p)">$\{c.sector}</span>
        </div>
        <div style="font-size:12px;color:var(--m);line-height:1.7;margin-bottom:8px">${esc(c.desc)}</div>
        <div style="font-size:11px;color:var(--m);padding:8px;background:var(--s);border-radius:6px;border-left:3px solid $\{ic(c.intensity)}"><strong style="color:$\{ic(c.intensity)}">Why it scores high:</strong> ${esc(c.why)}</div>
      </div>
      <div style="flex-shrink:0;text-align:right">
        <div style="font-size:10px;color:var(--m)">Revenue</div>
        <div style="font-size:20px;font-weight:700;color:var(--o)">€$\{c.rev}Bn</div>
        <div style="font-size:10px;color:var(--m);margin-top:4px">SCF Intensity</div>
        <div style="font-size:18px;font-weight:700;color:$\{ic(c.intensity)}">${Math.round(c.intensity*100)}%</div>
        <div style="font-size:10px;color:var(--m);margin-top:4px">Employees</div>
        <div style="font-size:13px;font-weight:600">${c.employees.toLocaleString()}</div>
      </div>
    </div>
  </div>\`).join('');
}

nav('ranking');
</script>
</body>
</html>`;
}

export default {
  async fetch(request) {
    const html = buildHtml();
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache',
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
      }
    });
  }
};
