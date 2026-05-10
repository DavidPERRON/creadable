/**
 * Trigger Event Engine — sources catalogue
 *
 * Defines feeds and search queries that the detector will poll.
 * RSS preferred (cheap, structured) over scraping when available.
 */

module.exports.RSS_FEEDS = [
  { id: 'gtr',         name: 'GTR — Global Trade Review',     url: 'https://www.gtreview.com/feed/' },
  { id: 'tfg',         name: 'Trade Finance Global',          url: 'https://www.tradefinanceglobal.com/feed/' },
  { id: 'txf',         name: 'TXF News',                       url: 'https://www.txfnews.com/rss' },
  { id: 'baft',        name: 'BAFT (Bankers Assoc. for TF)',   url: 'https://www.baft.org/feed/' },
  { id: 'fci',         name: 'FCI — Factors Chain Intl',       url: 'https://fci.nl/en/news/feed' },
  { id: 'ebrd',        name: 'EBRD press releases',            url: 'https://www.ebrd.com/news/rss.xml' },
  { id: 'eib',         name: 'EIB press releases',             url: 'https://www.eib.org/en/press/rss-press.xml' },
  { id: 'ifc',         name: 'IFC press releases',             url: 'https://pressroom.ifc.org/all/rss/all-news.aspx' },
];

module.exports.GOOGLE_QUERIES = [
  // Recrutement signals
  { type: 'RECRUITMENT',          q: '"head of trade finance" appointed bank Europe 2026' },
  { type: 'RECRUITMENT',          q: '"head of supply chain finance" bank Europe 2026' },
  { type: 'RECRUITMENT',          q: '"director" "trade finance" bank announces 2026' },
  // Fintech partnership signals
  { type: 'FINTECH_PARTNERSHIP_END', q: 'bank acquires supply chain finance fintech 2026' },
  { type: 'RFP',                  q: '"request for proposal" "supply chain finance" bank EU 2026' },
  // EBRD/IFC SCF programs
  { type: 'EBRD_PROGRAM',         q: 'EBRD supply chain finance bank 2026 Romania OR Serbia OR Hungary' },
  { type: 'EBRD_PROGRAM',         q: 'IFC trade finance facility bank Europe 2026' },
  // M&A
  { type: 'M_AND_A',              q: 'bank acquisition merger Europe corporate banking 2026' },
];

module.exports.PRESS_SEARCH = [
  { src: 'gtr', searchUrl: q => `https://www.gtreview.com/?s=${encodeURIComponent(q)}` },
  { src: 'tfg', searchUrl: q => `https://www.tradefinanceglobal.com/?s=${encodeURIComponent(q)}` },
  { src: 'txf', searchUrl: q => `https://www.txfnews.com/search?q=${encodeURIComponent(q)}` },
];
