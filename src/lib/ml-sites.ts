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

export function siteName(code: string | null | undefined): string {
  if (!code) return '—';
  return SITE_NAMES[code] ?? code;
}
