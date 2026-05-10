#!/usr/bin/env node
/**
 * Supply Chain × Banks Network Targeting
 *
 * For each major buyer with a SCF program, identify the supplier-concentration
 * countries and the banks in our DB that serve those countries.
 *
 * The output is a "network targeting matrix": a bank's value to a buyer's
 * SCF rollout depends on the bank's footprint in supplier-rich corridors.
 *
 * Run:  node supply_chain/engine/network_targets.js
 * Reads: supply_chain/data/buyers_with_scf.json + data/banks.scored.json
 * Writes: supply_chain/output/network_matrix.md
 */

const fs = require('fs');
const path = require('path');

const TODAY = new Date('2026-05-10').toISOString().slice(0,10);
const BUYERS_PATH = path.join(__dirname, '..', 'data', 'buyers_with_scf.json');
const BANKS_PATH  = path.join(__dirname, '..', '..', 'data', 'banks.scored.json');
const OUT_PATH    = path.join(__dirname, '..', 'output', 'network_matrix.md');

const buyers = JSON.parse(fs.readFileSync(BUYERS_PATH, 'utf8'));
const banks  = JSON.parse(fs.readFileSync(BANKS_PATH, 'utf8'));

// Group banks by country
const banksByCountry = banks.reduce((acc, b) => {
  if (!acc[b.country]) acc[b.country] = [];
  acc[b.country].push(b);
  return acc;
}, {});

// For each buyer, find the prospect banks in supplier-zones, ranked
const buyerTargets = buyers.map(buyer => {
  const targets = [];
  for (const zone of buyer.supplier_concentration_zones) {
    const zoneBanks = (banksByCountry[zone] || [])
      .filter(b => b.priority !== 'EXCLU')
      .sort((a, b) => b.score.total - a.score.total)
      .slice(0, 3); // top 3 per country
    for (const bank of zoneBanks) {
      targets.push({ buyer, zone, bank });
    }
  }
  return { buyer, targets };
});

// Reverse view: for each prospect bank, which buyer's SCF program could leverage it?
const bankBuyerMatrix = {};
for (const { buyer, targets } of buyerTargets) {
  for (const { zone, bank } of targets) {
    if (!bankBuyerMatrix[bank.id]) {
      bankBuyerMatrix[bank.id] = { bank, buyer_links: [] };
    }
    bankBuyerMatrix[bank.id].buyer_links.push({ buyer, zone });
  }
}

// Banks ranked by network leverage (= count of buyer links × bank score)
const networkLeverage = Object.values(bankBuyerMatrix)
  .map(({ bank, buyer_links }) => ({
    bank,
    buyer_count: buyer_links.length,
    buyer_links,
    leverage_score: buyer_links.length * bank.score.total / 10
  }))
  .sort((a, b) => b.leverage_score - a.leverage_score);

// ─────────────────────────────────────────────────────────────────
// Generate Markdown
// ─────────────────────────────────────────────────────────────────
const md = `# Supply Chain × Banks — Network Targeting Matrix
## Généré le ${TODAY}

**Logique** : Un programme SCF d'un grand donneur d'ordre dépend des banques locales servant ses fournisseurs. Une banque "free agent" dans une zone de concentration de fournisseurs = double levier (revenue local + entrée chez le buyer).

**Données croisées** :
- ${buyers.length} grands donneurs d'ordre avec programme SCF documenté
- ${banks.filter(b => b.priority !== 'EXCLU').length} banques prospects scorées (V4 priorisées)
- Mapping basé sur les zones de concentration de fournisseurs déclarées

---

## SECTION 1 — TOP 15 BANQUES PAR LEVIER RÉSEAU

Le **leverage score** = (nb de buyers que la banque pourrait toucher) × (score V4 / 10).
Une banque P1 servant 5 buyers vaut plus qu'une banque P1 isolée.

| Rang | Banque | Pays | Pri | V4 Score | Buyers reachables | Leverage |
|---|---|---|---|---:|---:|---:|
${networkLeverage.slice(0, 15).map((nl, i) =>
  `| ${i+1} | **${nl.bank.name}** | ${nl.bank.country} | ${nl.bank.priority} | ${nl.bank.score.total} | ${nl.buyer_count} | **${nl.leverage_score.toFixed(1)}** |`
).join('\n')}

---

## SECTION 2 — PAR BANQUE : QUELS BUYERS LEUR PROGRAMME SCF SERAIT PERTINENT ?

${networkLeverage.slice(0, 10).map(nl => `### ${nl.bank.name} (${nl.bank.country}, ${nl.bank.priority}, score V4 ${nl.bank.score.total})

**Leverage score** : ${nl.leverage_score.toFixed(1)} — touche ${nl.buyer_count} programme(s) SCF buyer-side.

**Buyers concernés** :
${nl.buyer_links.map(l => `- **${l.buyer.name}** (${l.buyer.country_hq}) — ${l.buyer.scf_program.platform} — fournisseurs concentrés en ${l.zone} (${l.buyer.tier1_supplier_count.toLocaleString()} tier-1)`).join('\n')}

**Angle commercial à utiliser** : "Vos clients fournisseurs de [${nl.buyer_links.map(l => l.buyer.name).slice(0,2).join(' / ')}] sont déjà éligibles à un programme SCF chez l'acheteur. Vous pouvez leur offrir le **financement local** correspondant en complément, capturant la marge de financement et fidélisant ces flux."

---
`).join('\n')}

## SECTION 3 — PAR BUYER : QUELLES BANQUES LOCALES POUR ÉTENDRE LEUR SCF ?

${buyerTargets.map(({ buyer, targets }) => `### ${buyer.name} (${buyer.country_hq}, ${buyer.sector})

**Programme SCF actuel** : ${buyer.scf_program.platform} (depuis ${buyer.scf_program.since})
**Achats annuels** : EUR ${buyer.annual_purchases_eur_bn} Mds | **Tier-1 fournisseurs** : ${buyer.tier1_supplier_count.toLocaleString()}
**Zones fournisseurs** : ${buyer.supplier_concentration_zones.join(', ')}

**Banques prospects pertinentes** (top 3 par pays, banques EXCLU filtrées) :

| Pays | Banque | Pri | Score V4 | SCF actuel |
|---|---|---|---:|---|
${targets.map(t => `| ${t.zone} | ${t.bank.name} | ${t.bank.priority} | ${t.bank.score.total} | ${t.bank.scf_level} |`).join('\n')}

**Note opérationnelle** : ${buyer.notes}

---
`).join('\n')}

## SECTION 4 — UTILISATION COMMERCIALE

### Scénario A — Approche bank-first
Quand vous démarchez une banque P1 (ex. BPER), mentionner que vous **disposez d'une cartographie** des grands donneurs d'ordre dont les fournisseurs italiens pourraient être éligibles : Stellantis, Ferrero, Pirelli, etc. → la banque y voit un **canal de génération de demande** pré-identifié.

### Scénario B — Approche buyer-first
Quand vous démarchez un grand groupe (ex. Stellantis), vous arrivez **avec une liste de banques** dans les pays où leurs fournisseurs sont concentrés : "Voici les 10 banques en CEE où vos fournisseurs sont déjà clients corporate. Notre plateforme permet d'embarquer leurs invoices Stellantis dans un programme SCF tripartite."

### Scénario C — Approche écosystème (pour conférences)
Présentation à un événement (GTR Europe, EuroFinance) : montrer la matrice "X buyers × Y banks dans la zone Z" comme **white paper sectoriel** → génère leads des deux côtés.

---

*Régénérer : \`cd prospection && node supply_chain/engine/network_targets.js\`*
`;

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, md);
console.log(`Generated: ${OUT_PATH}`);
console.log(`  ${buyers.length} buyers × ${banks.filter(b => b.priority !== 'EXCLU').length} banks → ${networkLeverage.length} bank-buyer pairs`);
console.log(`  Top 5 leverage:`);
for (const nl of networkLeverage.slice(0, 5)) {
  console.log(`    ${nl.leverage_score.toFixed(1).padStart(5)} ${nl.bank.name.padEnd(28)} (${nl.bank.country}) — ${nl.buyer_count} buyers`);
}
