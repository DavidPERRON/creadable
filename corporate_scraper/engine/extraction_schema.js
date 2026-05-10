/**
 * Extraction Schema — full CredAble product taxonomy
 *
 * This schema drives both the DeepInfra prompt and the JSON validation.
 * The schema is comprehensive across CredAble's product spectrum so we
 * never miss a relevant signal in a corporate annual report.
 *
 * CredAble product universe captured:
 *   1. Core SCF: Reverse factoring, Confirming, Dynamic Discounting
 *   2. Receivables: Factoring (with/without recourse), Vendor Finance,
 *                   Invoice Discounting, Receivables Securitization
 *   3. Distributor / Channel: Distributor finance, Pre-shipment finance,
 *                             Purchase Order Finance
 *   4. Inventory: Inventory financing, Floor planning
 *   5. Special: ESG-linked SCF, Multi-bank platform, Bank-as-a-Service /
 *               white-label, Cross-border SCF
 *
 * Output schema is INTENTIONALLY strict — all booleans default to false,
 * all arrays default to []. The model must not invent content.
 */

const SYSTEM_PROMPT = `You are a financial document extraction specialist. Your task is to read excerpts from corporate annual reports and extract STRICTLY FACTUAL information about supply chain finance, trade payables financing, and bank relationships.

CRITICAL RULES:
1. Only extract what is EXPLICITLY stated in the text. Never infer, assume, or hallucinate.
2. If information is not found, use null (for objects/strings) or false (for booleans) or [] (for arrays).
3. Always provide the verbatim quote from the text for each finding.
4. Bank names must be exact spellings as they appear in the document.
5. Do NOT include the corporate's own treasury or in-house bank.
6. Output VALID JSON only. No markdown, no commentary.`;

const USER_PROMPT_TEMPLATE = (corpName, country, sector, textChunk) => `Corporate: ${corpName} (${country}, ${sector})

Extract supply chain finance and bank-relationship signals from this annual report excerpt. Output a JSON object matching exactly this schema:

{
  "corporate_name": "${corpName}",
  "year_of_report": <integer or null>,
  "scf_program_signals": {
    "reverse_factoring": { "mentioned": <bool>, "verbatim": <string or null> },
    "confirming": { "mentioned": <bool>, "verbatim": <string or null> },
    "dynamic_discounting": { "mentioned": <bool>, "verbatim": <string or null> },
    "supply_chain_finance_generic": { "mentioned": <bool>, "verbatim": <string or null> },
    "supplier_finance_program": { "mentioned": <bool>, "verbatim": <string or null> },
    "trade_payables_financing": { "mentioned": <bool>, "verbatim": <string or null> },
    "early_payment_program": { "mentioned": <bool>, "verbatim": <string or null> }
  },
  "receivables_program_signals": {
    "factoring_with_recourse": { "mentioned": <bool>, "verbatim": <string or null> },
    "factoring_without_recourse": { "mentioned": <bool>, "verbatim": <string or null> },
    "invoice_discounting": { "mentioned": <bool>, "verbatim": <string or null> },
    "receivables_securitization": { "mentioned": <bool>, "verbatim": <string or null> },
    "vendor_finance_program": { "mentioned": <bool>, "verbatim": <string or null> }
  },
  "channel_program_signals": {
    "distributor_finance": { "mentioned": <bool>, "verbatim": <string or null> },
    "pre_shipment_finance": { "mentioned": <bool>, "verbatim": <string or null> },
    "purchase_order_finance": { "mentioned": <bool>, "verbatim": <string or null> }
  },
  "inventory_program_signals": {
    "inventory_finance": { "mentioned": <bool>, "verbatim": <string or null> },
    "floor_planning": { "mentioned": <bool>, "verbatim": <string or null> }
  },
  "special_signals": {
    "esg_or_sustainability_linked_scf": { "mentioned": <bool>, "verbatim": <string or null> },
    "multi_bank_platform": { "mentioned": <bool>, "verbatim": <string or null> },
    "white_label_bank_program": { "mentioned": <bool>, "verbatim": <string or null> },
    "cross_border_scf": { "mentioned": <bool>, "verbatim": <string or null> }
  },
  "scf_volumes": {
    "supply_chain_finance_obligations_eur": <number or null>,
    "factoring_volume_eur": <number or null>,
    "trade_payables_amount_eur": <number or null>,
    "year_of_volume": <integer or null>,
    "verbatim": <string or null>
  },
  "platform_provider_mentioned": {
    "found": <bool>,
    "name": <string or null>,
    "verbatim": <string or null>
  },
  "banks_mentioned_in_scf_or_trade_finance_context": [
    {
      "bank_name": <string>,
      "country_if_specified": <string or null>,
      "role": "lead | participant | local_partner | confirming_bank | factor | unknown",
      "context": <string — the verbatim sentence>
    }
  ],
  "geographic_footprint": {
    "supplier_countries_mentioned": [<list of country names>],
    "manufacturing_countries_mentioned": [<list of country names>],
    "verbatim_corridors": <string or null>
  },
  "key_quotes_for_review": [<up to 3 most relevant verbatim sentences about SCF / TF / banks>]
}

Rules:
- Bank names: include only NAMED banks (e.g., "Banco Santander", "BNP Paribas", "Commerzbank"). Do NOT include "our banks", "our relationship banks", "syndicate of banks" without a name.
- Volumes: extract numbers in original currency, convert to EUR if a clear FX rate is given, else leave null.
- Verbatim: the exact original sentence from the text. Maximum 300 chars per verbatim.
- Multiple corporates may have an "ESG-linked supplier finance program" — capture distinctly.

Annual report excerpt to analyze:
---
${textChunk}
---

Output the JSON object now (no markdown, no preamble):`;

const EMPTY_EXTRACTION = {
  scf_program_signals: {},
  receivables_program_signals: {},
  channel_program_signals: {},
  inventory_program_signals: {},
  special_signals: {},
  scf_volumes: {},
  platform_provider_mentioned: { found: false, name: null, verbatim: null },
  banks_mentioned_in_scf_or_trade_finance_context: [],
  geographic_footprint: { supplier_countries_mentioned: [], manufacturing_countries_mentioned: [] },
  key_quotes_for_review: []
};

module.exports = { SYSTEM_PROMPT, USER_PROMPT_TEMPLATE, EMPTY_EXTRACTION };
