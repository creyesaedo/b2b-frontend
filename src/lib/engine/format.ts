// Formats ResultSet cells from the column metadata the engine ships
// (format/unit/type) — widgets never guess how a metric should look.
import type { ResultColumn } from './types';
import { formatCurrency, formatDate, formatNumber, formatPercent } from '../format';

// ML site → local currency (metrics with unit 'local' are in site currency).
const SITE_CURRENCIES: Record<string, string> = {
  MLA: 'ARS',
  MLB: 'BRL',
  MLC: 'CLP',
  MLM: 'MXN',
  MCO: 'COP',
  MPE: 'PEN',
  MLU: 'UYU',
  MLV: 'VES',
  MEC: 'USD',
  MBO: 'BOB',
  MPY: 'PYG',
  MGT: 'GTQ',
  MPA: 'USD',
  MRD: 'DOP',
};

export function siteCurrency(site: string | null | undefined): string {
  return (site && SITE_CURRENCIES[site]) ?? 'USD';
}

export interface CellFormatOptions {
  locale: string;
  /** Currency for `unit: 'local'` metrics (derived from the dashboard's pais). */
  localCurrency?: string;
}

/**
 * One cell → display string. Engine conventions: percent metrics are FRACTIONS
 * (0–1); `decimal` metrics are already on their natural scale; `index` (HHI)
 * reads best with 3 decimals.
 */
export function formatCell(
  column: ResultColumn,
  value: string | number | boolean | null | undefined,
  opts: CellFormatOptions,
): string {
  if (value === null || value === undefined || value === '') return '—';

  if (column.type === 'date') {
    return formatDate(String(value), opts.locale, { utc: true });
  }
  if (column.type === 'boolean') {
    const yes = opts.locale.startsWith('es') ? 'Sí' : 'Yes';
    const no = opts.locale.startsWith('es') ? 'No' : 'No';
    return value === true || value === 'true' ? yes : no;
  }
  if (typeof value !== 'number') return String(value);

  switch (column.format) {
    case 'currency': {
      const currency = column.unit === 'usd' ? 'USD' : (opts.localCurrency ?? 'USD');
      return formatCurrency(value, currency, opts.locale);
    }
    case 'percent':
      return formatPercent(value * 100, opts.locale);
    case 'integer':
      return formatNumber(Math.round(value), opts.locale);
    case 'index':
      return new Intl.NumberFormat(opts.locale, { maximumFractionDigits: 3 }).format(value);
    case 'decimal':
    default:
      return new Intl.NumberFormat(opts.locale, { maximumFractionDigits: 2 }).format(value);
  }
}

/** Signed percent for WoW deltas (`__delta_pct` fractions): "+4.2%" / "−1.3%". */
export function formatDelta(value: number | null | undefined, locale: string): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const pct = formatPercent(Math.abs(value) * 100, locale);
  return value >= 0 ? `+${pct}` : `−${pct}`;
}
