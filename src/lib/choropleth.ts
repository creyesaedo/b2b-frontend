// Choropleth scale + metric formatting for the dashboard market map.
//
// Colors come from the data-viz reference palette's single-hue BLUE sequential
// ramp (light→dark). SVG fills are emitted as `var(--choro-N)` CSS custom
// properties (see `MarketMap`) so light/dark swap in one place — on a light
// surface the lowest bucket recedes toward white; on a dark surface it recedes
// toward the dark plane (so the ramp is brightness-inverted for dark mode).

import type { CountryMetric, CountryMetrics } from './types';
import { formatCurrency, formatNumber, formatPercent } from './format';

/** Number of choropleth buckets (also the number of `--choro-N` vars/legend swatches). */
export const CHORO_STEPS = 5;

/** Low→high ramp on a LIGHT surface (lightest recedes toward the surface). */
export const CHORO_LIGHT = ['#cde2fb', '#9ec5f4', '#5598e7', '#2a78d6', '#184f95'];
/** Low→high ramp on a DARK surface (darkest recedes toward the surface). */
export const CHORO_DARK = ['#104281', '#184f95', '#256abf', '#3987e5', '#6da7ec'];
export const NODATA_LIGHT = '#e5e7eb'; // gray-200
export const NODATA_DARK = '#374151'; // gray-700

export interface Choropleth {
  /** Bucket index 0…steps-1 for a value, or -1 when there's no data. */
  bucketOf(value: number | null | undefined): number;
  /** The steps-1 quantile breakpoints between buckets. */
  thresholds: number[];
  steps: number;
  min: number;
  max: number;
  /** True when there were no usable values (everything renders as no-data). */
  empty: boolean;
}

/** Linear-interpolated quantile of an already-ascending array. */
function quantileSorted(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  if (sorted.length === 1) return sorted[0];
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const next = sorted[base + 1];
  return next === undefined ? sorted[base] : sorted[base] + rest * (next - sorted[base]);
}

/**
 * Builds a quantile choropleth from the values in play. Quantile (not linear)
 * bucketing keeps skewed distributions (e.g. one dominant market) legible.
 */
export function buildChoropleth(values: Array<number | null | undefined>, steps = CHORO_STEPS): Choropleth {
  const clean = values
    .filter((v): v is number => v != null && Number.isFinite(v))
    .sort((a, b) => a - b);

  if (clean.length === 0) {
    return { bucketOf: () => -1, thresholds: [], steps, min: 0, max: 0, empty: true };
  }

  const min = clean[0];
  const max = clean[clean.length - 1];
  const thresholds: number[] = [];
  for (let i = 1; i < steps; i++) thresholds.push(quantileSorted(clean, i / steps));

  const bucketOf = (value: number | null | undefined): number => {
    if (value == null || !Number.isFinite(value)) return -1;
    let b = 0;
    while (b < thresholds.length && value > thresholds[b]) b += 1;
    return b;
  };

  return { bucketOf, thresholds, steps, min, max, empty: false };
}

/** Pulls the value of one metric off a per-country metrics row. */
export function metricValue(m: CountryMetrics, metric: CountryMetric): number | null {
  switch (metric) {
    case 'count':
      return m.count;
    case 'median_price':
      return m.median_usd_price;
    case 'discount':
      return m.avg_discount_pct;
    case 'official_share':
      return m.official_store_share;
    default:
      return null;
  }
}

/** Formats a metric value for hover chips, legends and tables. */
export function formatMetric(
  metric: CountryMetric,
  value: number | null | undefined,
  locale = 'en-US',
): string {
  if (value == null || !Number.isFinite(value)) return '—';
  switch (metric) {
    case 'count':
      return formatNumber(Math.round(value), locale);
    case 'median_price':
      return formatCurrency(value, 'USD', locale);
    case 'discount':
      return formatPercent(value, locale); // already 0–100
    case 'official_share':
      return formatPercent(value * 100, locale); // 0–1 → %
    default:
      return formatNumber(value, locale);
  }
}
