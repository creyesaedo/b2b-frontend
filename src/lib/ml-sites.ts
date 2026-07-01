// MercadoLibre site IDs → human-readable country names.
const SITE_NAMES: Record<string, string> = {
  MLA: 'Argentina',
  MLB: 'Brasil',
  MLC: 'Chile',
  MLM: 'México',
  MCO: 'Colombia',
  MPE: 'Perú',
  MLU: 'Uruguay',
  MLV: 'Venezuela',
  MEC: 'Ecuador',
  MBO: 'Bolivia',
  MPY: 'Paraguay',
  MGT: 'Guatemala',
  MPA: 'Panamá',
  MRD: 'Rep. Dominicana',
};

// MercadoLibre site IDs → ISO 3166-1 alpha-2 country codes (for flag-icons).
const SITE_COUNTRY_CODES: Record<string, string> = {
  MLA: 'ar',
  MLB: 'br',
  MLC: 'cl',
  MLM: 'mx',
  MCO: 'co',
  MPE: 'pe',
  MLU: 'uy',
  MLV: 've',
  MEC: 'ec',
  MBO: 'bo',
  MPY: 'py',
  MGT: 'gt',
  MPA: 'pa',
  MRD: 'do',
};

export function siteName(code: string | null | undefined): string {
  if (!code) return '—';
  return SITE_NAMES[code] ?? code;
}

// ISO alpha-2 code for the `flag-icons` CSS classes (e.g. `fi fi-br`), or null.
export function siteCountryCode(code: string | null | undefined): string | null {
  if (!code) return null;
  return SITE_COUNTRY_CODES[code] ?? null;
}
