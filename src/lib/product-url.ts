// Detects, from a pasted product URL, which e-commerce it belongs to, which
// country/site it targets, and whether it points at an actual product page.
//
// This replaces the manual country selector on the tracking form: the user
// pastes a link and we figure everything out (and reject what we can't handle).
// The shape is deliberately open to more e-commerces later — add a detector and
// a domain map, the UI just reacts to the returned `status`.

/** Supported e-commerce sources. Extend this union as new ones are added. */
export type Ecommerce = 'mercadolibre';

/** Human/brand name for an e-commerce (brand, not a translatable UI string). */
const ECOMMERCE_NAMES: Record<Ecommerce, string> = {
  mercadolibre: 'MercadoLibre',
};

export function ecommerceName(e: Ecommerce): string {
  return ECOMMERCE_NAMES[e];
}

// MercadoLibre serves each country from a distinct registrable domain. Brazil
// uses "mercadolivre"; the rest "mercadolibre". Everything here is *recognized*;
// `SUPPORTED_SITES` below gates what we actually accept today.
const ML_DOMAIN_TO_SITE: Record<string, string> = {
  'mercadolibre.com.ar': 'MLA',
  'mercadolivre.com.br': 'MLB',
  'mercadolibre.cl': 'MLC',
  'mercadolibre.com.mx': 'MLM',
  'mercadolibre.com.co': 'MCO',
  'mercadolibre.com.pe': 'MPE',
  'mercadolibre.com.uy': 'MLU',
  'mercadolibre.com.ve': 'MLV',
  'mercadolibre.com.ec': 'MEC',
  'mercadolibre.com.bo': 'MBO',
  'mercadolibre.com.py': 'MPY',
  'mercadolibre.com.gt': 'MGT',
  'mercadolibre.com.pa': 'MPA',
  'mercadolibre.com.do': 'MRD',
};

// The subset the backend (ml-service) can actually scrape today — its 7 core
// sites. Keep in sync with ml-service's `PROD_CORE_SITES`.
export const SUPPORTED_SITES = ['MLA', 'MLB', 'MLC', 'MLM', 'MCO', 'MPE', 'MLU'];

export type DetectStatus =
  | 'empty' // nothing typed yet
  | 'invalid_url' // not a parseable http(s) URL
  | 'unknown_ecommerce' // domain we don't recognize
  | 'unsupported_country' // MercadoLibre, but a country we can't scrape yet
  | 'not_a_product' // recognized domain, but not a product page
  | 'ok'; // good to subscribe

export interface DetectResult {
  status: DetectStatus;
  ecommerce?: Ecommerce;
  /** ML site id (e.g. `MLC`); this is the `country` we send to the backend. */
  site?: string;
}

function detectEcommerce(host: string): Ecommerce | undefined {
  const h = host.toLowerCase();
  if (h.includes('mercadolibre') || h.includes('mercadolivre')) return 'mercadolibre';
  return undefined;
}

function siteFromHost(host: string): string | undefined {
  const h = host.toLowerCase();
  for (const [domain, site] of Object.entries(ML_DOMAIN_TO_SITE)) {
    if (h === domain || h.endsWith('.' + domain)) return site;
  }
  return undefined;
}

// ML product/item ids in URLs look like `MLC12345678` (catalog, under `/p/`),
// `MLC-1234567890` (classified item, e.g. `articulo.` host) or `MLCU57917080`
// (user product). The site prefix is `M` + two letters, optionally `U`.
const ML_PRODUCT_ID = /M[A-Z]{2}U?-?\d{5,}/;

function isMlProductPath(pathname: string): boolean {
  return ML_PRODUCT_ID.test(pathname);
}

/** Analyze a pasted URL. Pure; safe to call on every keystroke. */
export function detectProductUrl(raw: string): DetectResult {
  const trimmed = raw.trim();
  if (!trimmed) return { status: 'empty' };

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { status: 'invalid_url' };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { status: 'invalid_url' };
  }

  const ecommerce = detectEcommerce(parsed.hostname);
  if (!ecommerce) return { status: 'unknown_ecommerce' };

  const site = siteFromHost(parsed.hostname);
  if (!site || !SUPPORTED_SITES.includes(site)) {
    return { status: 'unsupported_country', ecommerce, site };
  }

  if (!isMlProductPath(parsed.pathname)) {
    return { status: 'not_a_product', ecommerce, site };
  }

  return { status: 'ok', ecommerce, site };
}
