// Lightweight formatters. Locale is passed in from next-intl where it matters.

export function formatCurrency(
  value: number | null | undefined,
  currency = 'USD',
  locale = 'en-US',
): string {
  if (value === null || value === undefined) return '—';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${Math.round(value).toLocaleString(locale)}`;
  }
}

export function formatNumber(
  value: number | null | undefined,
  locale = 'en-US',
): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat(locale).format(value);
}

export function formatPercent(
  value: number | null | undefined,
  locale = 'en-US',
): string {
  if (value === null || value === undefined) return '—';
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)}%`;
}

export function formatDate(
  value: string | null | undefined,
  locale = 'en-US',
): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
