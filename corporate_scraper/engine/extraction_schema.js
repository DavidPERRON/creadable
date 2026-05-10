/**
 * Extraction Schema v2 — REFONTE TOTALE
 *
 * CredAble n'est PAS un prêteur. C'est un fournisseur d'infrastructure de flux
 * working-capital. 4 lignes de revenus distinctes, chacune correspondant à un
 * angle de vente différent vers les banques.
 *
 *   1. SaaS / licence    → revenus récurrents (annual fee, platform, APIs,
 *                          onboarding, dashboards, reconciliation)
 *   2. Classic SCF       → bps sur volumes flow (reverse factoring, dynamic
 *                          discounting). Risque crédit RESTE à la banque.
 *   3. Receivables       → bps plus élevés (assume dilution, dispute,
 *                          invoice-validity, debtor concentration risks)
 *   4. Flash title /     → TradeCo s'insère légalement (first buyer / title
 *      Inventory          holder). Marge commerciale + structuring fees.
 *
 * Le schema d'extraction doit donc capturer largement TOUS les indices de
 * working capital / trade / receivables / inventory dans un rapport annuel,
 * PAS uniquement le mot "SCF". Les rapports parlent de "cession de créances",
 * "trade payables financing", "letters of credit", "consignment stock", etc.
 *
 * Pour chaque banque mentionnée, on capture le contexte produit afin que
 * l'agrégateur puisse déterminer QUEL angle CredAble (SaaS / Classic SCF /
 * Receivables / Flash title) est le bon pour cette banque.
 */

const SYSTEM_PROMPT = `You are a senior trade finance and working capital extraction specialist analyzing corporate annual reports for a B2B software vendor (CredAble) that sells white-label working-capital infrastructure to banks.

CRITICAL RULES:
1. Only extract what is EXPLICITLY stated. Never infer, assume, or hallucinate.
2. If information is not found, use null / false / [].
3. Always provide the verbatim quote from the text for each finding (max 300 chars).
4. Bank names: include only NAMED banks (e.g., "BNP Paribas", "Commerzbank"). Do NOT include "our banks", "syndicate of banks" without a specific name.
5. Distinguish:
   - PAYABLES side (anchor pays its suppliers via SCF / reverse factoring / confirming)
   - RECEIVABLES side (corporate sells its own invoices: factoring, securitization, sale of receivables)
   - DOCUMENTARY trade (LCs, guarantees — usually for cross-border / risky-country trade)
   - TITLE / INVENTORY (consignment, stock financing, raw material finance, distributor / channel finance, TradeCo / SPV)
   - GENERIC working capital facilities (bank-provided liquidity, revolving credit, overdraft)
6. Bank role taxonomy: lead | participant | local_partner | confirming_bank | factor | guarantor | issuing_bank | servicing_bank | unknown.
7. Output VALID JSON only. No markdown, no commentary.`;

const USER_PROMPT_TEMPLATE = (corpName, country, sector, textChunk) => `Corporate: ${corpName} (${country}, ${sector})

Extract working-capital, trade-finance, receivables, inventory, and bank-relationship signals from this annual report excerpt. Output a JSON object matching exactly this schema:

{
  "year_of_report": <integer or null>,

  "payables_programs": {
    "reverse_factoring":         { "mentioned": <bool>, "verbatim": <string|null>, "volume_eur": <number|null> },
    "confirming":                { "mentioned": <bool>, "verbatim": <string|null>, "volume_eur": <number|null> },
    "dynamic_discounting":       { "mentioned": <bool>, "verbatim": <string|null>, "volume_eur": <number|null> },
    "supplier_finance_program":  { "mentioned": <bool>, "verbatim": <string|null>, "volume_eur": <number|null> },
    "early_payment_program":     { "mentioned": <bool>, "verbatim": <string|null>, "volume_eur": <number|null> },
    "trade_payables_financing":  { "mentioned": <bool>, "verbatim": <string|null>, "volume_eur": <number|null> }
  },

  "receivables_programs": {
    "factoring_with_recourse":     { "mentioned": <bool>, "verbatim": <string|null>, "volume_eur": <number|null> },
    "factoring_without_recourse":  { "mentioned": <bool>, "verbatim": <string|null>, "volume_eur": <number|null> },
    "invoice_discounting":         { "mentioned": <bool>, "verbatim": <string|null>, "volume_eur": <number|null> },
    "receivables_securitization":  { "mentioned": <bool>, "verbatim": <string|null>, "volume_eur": <number|null> },
    "sale_of_receivables":         { "mentioned": <bool>, "verbatim": <string|null>, "volume_eur": <number|null> },
    "vendor_finance_program":      { "mentioned": <bool>, "verbatim": <string|null>, "volume_eur": <number|null> }
  },

  "documentary_trade": {
    "letters_of_credit":         { "mentioned": <bool>, "verbatim": <string|null>, "volume_eur": <number|null> },
    "bank_guarantees":           { "mentioned": <bool>, "verbatim": <string|null>, "volume_eur": <number|null> },
    "standby_letters_of_credit": { "mentioned": <bool>, "verbatim": <string|null>, "volume_eur": <number|null> },
    "forfaiting":                { "mentioned": <bool>, "verbatim": <string|null>, "volume_eur": <number|null> },
    "structured_trade_finance":  { "mentioned": <bool>, "verbatim": <string|null>, "volume_eur": <number|null> },
    "pre_shipment_finance":      { "mentioned": <bool>, "verbatim": <string|null>, "volume_eur": <number|null> },
    "purchase_order_finance":    { "mentioned": <bool>, "verbatim": <string|null>, "volume_eur": <number|null> },
    "export_finance":            { "mentioned": <bool>, "verbatim": <string|null>, "volume_eur": <number|null> }
  },

  "title_inventory_arrangements": {
    "inventory_finance":          { "mentioned": <bool>, "verbatim": <string|null>, "volume_eur": <number|null> },
    "floor_planning":             { "mentioned": <bool>, "verbatim": <string|null>, "volume_eur": <number|null> },
    "consignment_stock":          { "mentioned": <bool>, "verbatim": <string|null> },
    "title_transfer_arrangement": { "mentioned": <bool>, "verbatim": <string|null> },
    "raw_material_financing":     { "mentioned": <bool>, "verbatim": <string|null>, "volume_eur": <number|null> },
    "distributor_finance":        { "mentioned": <bool>, "verbatim": <string|null>, "volume_eur": <number|null> },
    "channel_finance":            { "mentioned": <bool>, "verbatim": <string|null>, "volume_eur": <number|null> },
    "tradeco_or_spv_structure":   { "mentioned": <bool>, "verbatim": <string|null>, "name": <string|null> }
  },

  "working_capital_facilities": {
    "bank_facilities_for_wc":  { "mentioned": <bool>, "verbatim": <string|null>, "volume_eur": <number|null> },
    "revolving_credit_facility": { "mentioned": <bool>, "verbatim": <string|null>, "volume_eur": <number|null> },
    "overdraft_facility":      { "mentioned": <bool>, "verbatim": <string|null>, "volume_eur": <number|null> }
  },

  "tech_signals": {
    "erp_systems_mentioned":      [<list of strings: e.g., "SAP", "Oracle", "Coupa", "Microsoft Dynamics">],
    "multi_bank_platform":        { "mentioned": <bool>, "verbatim": <string|null> },
    "white_label_program":        { "mentioned": <bool>, "verbatim": <string|null> },
    "cross_border_program":       { "mentioned": <bool>, "verbatim": <string|null> },
    "esg_or_sustainability_linked": { "mentioned": <bool>, "verbatim": <string|null> },
    "api_or_digital_integration": { "mentioned": <bool>, "verbatim": <string|null> }
  },

  "platform_provider_mentioned": {
    "found": <bool>,
    "name": <string|null>,
    "verbatim": <string|null>
  },

  "trade_credit_insurance_providers": [
    { "name": <string — e.g., Coface, Allianz Trade, Atradius, Euler Hermes>, "verbatim": <string> }
  ],

  "banks_in_working_capital_context": [
    {
      "bank_name": <string>,
      "country_if_specified": <string|null>,
      "role": "lead | participant | local_partner | confirming_bank | factor | guarantor | issuing_bank | servicing_bank | unknown",
      "product_category": "payables | receivables | documentary | inventory | working_capital | unknown",
      "context": <string — verbatim sentence>
    }
  ],

  "geographic_footprint": {
    "supplier_countries_mentioned":      [<list of country names>],
    "manufacturing_countries_mentioned": [<list of country names>],
    "verbatim_corridors": <string|null>
  },

  "total_volumes": {
    "total_payables_finance_eur":      <number|null>,
    "total_receivables_finance_eur":   <number|null>,
    "total_documentary_trade_eur":     <number|null>,
    "total_inventory_finance_eur":     <number|null>,
    "year_of_volume":                  <integer|null>
  },

  "key_quotes_for_review": [<up to 5 most relevant verbatim sentences about working capital / trade / banks>]
}

Particular care:
- "Cession de créances" / "trade receivables sold" / "factored without recourse" → receivables_programs
- "Lieferantenfinanzierung" / "supplier finance" / "trade payables financing" → payables_programs
- "Lettres de crédit" / "documentary credits" / "Akkreditive" → documentary_trade
- "Consignment", "stock financing", "title transfer", "raw material financing" → title_inventory_arrangements
- "Working capital lines" / "revolving credit" without specific product → working_capital_facilities
- A bank can appear multiple times across categories — repeat the entry for each context.
- Trade credit insurers (Coface, Allianz Trade, Atradius, Euler Hermes) are NOT banks but their mention strongly correlates with active trade finance → capture in trade_credit_insurance_providers AND if bank context, mention banks separately.

Annual report excerpt to analyze:
---
${textChunk}
---

Output the JSON object now (no markdown, no preamble):`;

const EMPTY_EXTRACTION = {
  payables_programs: {},
  receivables_programs: {},
  documentary_trade: {},
  title_inventory_arrangements: {},
  working_capital_facilities: {},
  tech_signals: { erp_systems_mentioned: [] },
  platform_provider_mentioned: { found: false, name: null, verbatim: null },
  trade_credit_insurance_providers: [],
  banks_in_working_capital_context: [],
  geographic_footprint: { supplier_countries_mentioned: [], manufacturing_countries_mentioned: [] },
  total_volumes: {},
  key_quotes_for_review: []
};

// Major established platform competitors. If one of these is mentioned, the
// bank using it is NOT a sweet-spot for CredAble white-label.
const MAJOR_COMPETITOR_PLATFORMS = [
  'demica', 'orbian', 'taulia', 'kyriba', 'primerevenue', 'c2fo', 'tradeshift',
  'liquidx', 'greensill', 'cflox', 'kratos', 'fundthrough',
  // Trade docs
  'komgo', 'we.trade', 'wetrade', 'marco polo', 'contour',
  // Regional incumbents (already entrenched)
  'plusadvance', 'qualco', 'roger global', 'fintra',
  // Captives / bank-owned
  'banca ifis', 'ifis4business', 'sudfactoring', 'südfactoring',
];

module.exports = {
  SYSTEM_PROMPT,
  USER_PROMPT_TEMPLATE,
  EMPTY_EXTRACTION,
  MAJOR_COMPETITOR_PLATFORMS,
};
