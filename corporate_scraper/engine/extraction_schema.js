/**
 * Extraction Schema v3 — REFONTE COMPLÈTE basée sur le pitch deck CredAble
 *
 * CredAble est un fournisseur d'infrastructure working-capital avec 9 catégories
 * de produits, 3 piliers (Structured Trade / Technology / Lending), et plusieurs
 * différenciateurs structurants (TCI integration, Finastra pre-integration,
 * TradeCo Hub & Spoke model).
 *
 * Ce schema capture TOUS les signaux dans les rapports annuels qui correspondent
 * aux produits CredAble, pour permettre :
 *   - Identification banques sweet-spot (côté corporate)
 *   - Identification banques avec capability gap (côté bank)
 *   - Calcul du Buying Intent Score (BIS)
 */

const SYSTEM_PROMPT = `You are a senior trade finance and working capital analyst extracting signals from annual reports for a B2B software vendor (CredAble) that provides white-label working-capital infrastructure to banks across 9 product categories: payables financing, receivables financing, asset distribution, documentary trade, title/inventory arrangements, working capital facilities, lending origination (LOS), embedded finance, and risk analytics.

CRITICAL EXTRACTION RULES:
1. Extract three confidence levels:
   - "fact": explicit verbatim from the text → provide exact quote
   - "inference": logical deduction from contextual evidence → mark explicitly
   - "general_knowledge": you know from training (e.g., "Schneider's SCF provider is PrimeRevenue") → mark explicitly and only when high confidence
2. ALL findings must indicate confidence level. Defaults to "fact" if not stated.
3. Bank names: include only NAMED banks. Do NOT include "our banks", "syndicate" without a specific name.
4. Distinguish PAYABLES vs RECEIVABLES vs DOCUMENTARY vs INVENTORY vs LENDING vs EMBEDDED vs ANALYTICS contexts.
5. Bank role taxonomy: lead | participant | local_partner | confirming_bank | factor | guarantor | issuing_bank | servicing_bank | financier_tradeco | unknown.
6. Output VALID JSON only.`;

const USER_PROMPT_TEMPLATE = (corpName, country, sector, textChunk) => `Corporate: ${corpName} (${country}, ${sector})

Extract signals across ALL working-capital, trade-finance, lending, and analytics categories. Output JSON matching this schema:

{
  "year_of_report": <integer or null>,

  "payables_programs": {
    "static_discounting":         { "mentioned": <bool>, "confidence": "fact|inference|general_knowledge", "verbatim": <string|null>, "volume_eur": <number|null> },
    "dynamic_discounting":        { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null>, "volume_eur": <number|null> },
    "reverse_factoring":          { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null>, "volume_eur": <number|null> },
    "confirming":                 { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null>, "volume_eur": <number|null> },
    "supplier_finance_program":   { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null>, "volume_eur": <number|null> },
    "early_payment_program":      { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null>, "volume_eur": <number|null> },
    "trade_payables_financing":   { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null>, "volume_eur": <number|null> },
    "direct_supplier_payments":   { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null> }
  },

  "receivables_programs": {
    "factoring_with_recourse":           { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null>, "volume_eur": <number|null> },
    "factoring_without_recourse":        { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null>, "volume_eur": <number|null> },
    "invoice_discounting":               { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null>, "volume_eur": <number|null> },
    "receivables_securitization":        { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null>, "volume_eur": <number|null> },
    "sale_of_receivables":               { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null>, "volume_eur": <number|null> },
    "vendor_finance_program":            { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null>, "volume_eur": <number|null> },
    "portfolio_receivable_purchase":     { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null>, "volume_eur": <number|null> },
    "tci_integrated_receivables":        { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null>, "tci_provider": <string|null> }
  },

  "asset_distribution": {
    "trade_receivables_securitization":  { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null>, "volume_eur": <number|null> },
    "co_participation_structures":       { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null> },
    "risk_sharing_arrangements":         { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null> },
    "spv_off_balance_structures":        { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null> }
  },

  "documentary_trade": {
    "letters_of_credit":         { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null>, "volume_eur": <number|null> },
    "bank_guarantees":           { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null>, "volume_eur": <number|null> },
    "standby_letters_of_credit": { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null> },
    "forfaiting":                { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null>, "volume_eur": <number|null> },
    "structured_trade_finance":  { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null>, "volume_eur": <number|null> },
    "pre_shipment_finance":      { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null> },
    "purchase_order_finance":    { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null> },
    "export_finance":            { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null>, "volume_eur": <number|null> }
  },

  "title_inventory_arrangements": {
    "inventory_finance":            { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null>, "volume_eur": <number|null> },
    "warehouse_receipt_financing":  { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null> },
    "floor_planning":               { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null>, "volume_eur": <number|null> },
    "consignment_stock":            { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null> },
    "title_transfer_arrangement":   { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null> },
    "raw_material_financing":       { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null>, "volume_eur": <number|null> },
    "distributor_finance":          { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null>, "volume_eur": <number|null> },
    "channel_finance":              { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null>, "volume_eur": <number|null> },
    "tradeco_or_spv_structure":     { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null>, "name": <string|null> },
    "flash_title_trade":            { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null> },
    "jit_inventory_program":        { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null> }
  },

  "working_capital_facilities": {
    "bank_facilities_for_wc":      { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null>, "volume_eur": <number|null> },
    "revolving_credit_facility":   { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null>, "volume_eur": <number|null> },
    "overdraft_facility":          { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null>, "volume_eur": <number|null> },
    "syndicated_facility":         { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null>, "volume_eur": <number|null> }
  },

  "lending_origination": {
    "sme_lending_program":         { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null>, "volume_eur": <number|null> },
    "digital_loan_origination":    { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null> },
    "ai_ml_underwriting":          { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null> },
    "business_loans":              { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null>, "volume_eur": <number|null> },
    "cashflow_backed_loans":       { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null> }
  },

  "embedded_finance": {
    "pos_financing":          { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null> },
    "seller_financing":       { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null> },
    "marketplace_financing":  { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null> },
    "embedded_finance_apis":  { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null> },
    "bnpl_or_consumer_finance":{ "mentioned": <bool>, "confidence": "...", "verbatim": <string|null> }
  },

  "risk_analytics_signals": {
    "early_warning_systems":      { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null> },
    "npl_monitoring":             { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null>, "npl_ratio": <number|null> },
    "credit_analytics":           { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null> },
    "rwa_optimization":           { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null> }
  },

  "tech_signals": {
    "erp_systems_mentioned":       [<list of strings: "SAP", "SAP Ariba", "Oracle", "Coupa", "Kyriba", "Microsoft Dynamics", "Zoho NetSuite">],
    "core_banking_system":         { "name": <string|null>, "verbatim": <string|null> },
    "treasury_management_system":  { "name": <string|null>, "verbatim": <string|null> },
    "multi_bank_platform":         { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null> },
    "white_label_program":         { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null> },
    "cross_border_program":        { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null> },
    "esg_or_sustainability_linked":{ "mentioned": <bool>, "confidence": "...", "verbatim": <string|null> },
    "api_or_digital_integration":  { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null> },
    "finastra_or_temenos_t24":     { "mentioned": <bool>, "confidence": "...", "verbatim": <string|null>, "platform": <string|null> }
  },

  "platform_provider_mentioned": {
    "found": <bool>,
    "name": <string|null>,
    "verbatim": <string|null>,
    "is_major_competitor": <bool>
  },

  "trade_credit_insurance_providers": [
    { "name": <string — e.g., Coface, Allianz Trade, Atradius, Euler Hermes, Credendo, SACE>, "verbatim": <string>, "confidence": "..." }
  ],

  "banks_in_working_capital_context": [
    {
      "bank_name": <string>,
      "country_if_specified": <string|null>,
      "role": "lead | participant | local_partner | confirming_bank | factor | guarantor | issuing_bank | servicing_bank | financier_tradeco | unknown",
      "product_category": "payables | receivables | asset_distribution | documentary | inventory | working_capital | lending | embedded | analytics | unknown",
      "context": <string — verbatim sentence>,
      "confidence": "fact|inference|general_knowledge"
    }
  ],

  "geographic_footprint": {
    "supplier_countries_mentioned":      [<list>],
    "manufacturing_countries_mentioned": [<list>],
    "verbatim_corridors": <string|null>
  },

  "total_volumes": {
    "total_payables_finance_eur":      <number|null>,
    "total_receivables_finance_eur":   <number|null>,
    "total_documentary_trade_eur":     <number|null>,
    "total_inventory_finance_eur":     <number|null>,
    "total_lending_eur":               <number|null>,
    "year_of_volume":                  <integer|null>
  },

  "key_quotes_for_review": [<up to 5 most relevant verbatim sentences>],

  "_extraction_notes": <string|null — your overall assessment if anything notable that doesn't fit elsewhere>
}

CROSS-CORPORATE INFERENCE: If you have high-confidence general knowledge (training data) about a corporate's specific platform partnerships (e.g., "Schneider Electric uses PrimeRevenue since 2014") — you MAY include it with confidence: "general_knowledge". DO NOT speculate when uncertain.

Annual report excerpt to analyze:
---
${textChunk}
---

Output the JSON object now (no markdown, no preamble):`;

const EMPTY_EXTRACTION = {
  payables_programs: {},
  receivables_programs: {},
  asset_distribution: {},
  documentary_trade: {},
  title_inventory_arrangements: {},
  working_capital_facilities: {},
  lending_origination: {},
  embedded_finance: {},
  risk_analytics_signals: {},
  tech_signals: { erp_systems_mentioned: [] },
  platform_provider_mentioned: { found: false, name: null, verbatim: null, is_major_competitor: false },
  trade_credit_insurance_providers: [],
  banks_in_working_capital_context: [],
  geographic_footprint: { supplier_countries_mentioned: [], manufacturing_countries_mentioned: [] },
  total_volumes: {},
  key_quotes_for_review: []
};

// Major established platform competitors. If one of these is mentioned, the
// bank using it is NOT a sweet-spot for CredAble white-label.
//
// CRITICAL: JPMorgan and Taulia (SAP) became dominant post-Greensill
// replacements 2024-2025. CredAble must win orphans BEFORE these incumbents
// enter. Detection of "JPM SCF" / "Taulia" / "SAP Ariba" in a bank's setup
// signals a closing window or already-lost prospect.
const MAJOR_COMPETITOR_PLATFORMS = [
  // Top tier — post-Greensill dominants (2024-2025)
  'jpmorgan scf', 'jp morgan scf', 'jpm scf', 'taulia',
  // Established
  'demica', 'orbian', 'kyriba', 'primerevenue', 'c2fo', 'tradeshift',
  'liquidx', 'greensill', 'cflox', 'kratos', 'fundthrough',
  // Trade docs (mostly defunct but capture mentions)
  'komgo', 'we.trade', 'wetrade', 'marco polo', 'contour',
  // Regional incumbents (already entrenched)
  'plusadvance', 'qualco', 'roger global', 'fintra',
  // Captives / bank-owned
  'banca ifis', 'ifis4business', 'sudfactoring', 'südfactoring',
  // SAP-integrated (Taulia parent post-2022)
  'sap ariba pay', 'ariba supplier finance',
];

module.exports = {
  SYSTEM_PROMPT,
  USER_PROMPT_TEMPLATE,
  EMPTY_EXTRACTION,
  MAJOR_COMPETITOR_PLATFORMS,
};
