'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, X } from 'lucide-react';
import { getArbitrage } from '@/lib/api/endpoints';
import type { CountryMetrics } from '@/lib/types';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format';
import { siteCountryCode, siteName } from '@/lib/ml-sites';

interface CountryCompareProps {
  codes: string[];
  metricsByCode: Map<string, CountryMetrics>;
  onRemove: (code: string) => void;
}

/** Side-by-side market comparison + cross-border price-arbitrage list. */
export function CountryCompare({ codes, metricsByCode, onRemove }: CountryCompareProps) {
  const t = useTranslations('dashboard');
  const locale = useLocale();

  const { data: arbitrage } = useQuery({
    queryKey: ['arbitrage', codes],
    queryFn: () => getArbitrage(codes),
    enabled: codes.length >= 2,
  });

  const share = (v: number | null | undefined) =>
    v == null ? '—' : formatPercent(v * 100, locale);

  const rows: Array<{ label: string; get: (m: CountryMetrics) => string }> = [
    { label: t('metricCount'), get: (m) => formatNumber(m.count, locale) },
    { label: t('metricMedianPrice'), get: (m) => formatCurrency(m.median_usd_price, 'USD', locale) },
    { label: t('metricDiscount'), get: (m) => formatPercent(m.avg_discount_pct, locale) },
    { label: t('metricOfficialShare'), get: (m) => share(m.official_store_share) },
    { label: t('metricCbtShare'), get: (m) => share(m.cbt_share) },
    { label: t('kpiSellers'), get: (m) => formatNumber(m.seller_count, locale) },
    { label: t('kpiCategories'), get: (m) => formatNumber(m.category_count, locale) },
  ];

  if (codes.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">{t('compareHint')}</p>;
  }

  return (
    <div className="space-y-5">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="pb-2 text-left font-medium text-gray-500 dark:text-gray-400">
                {t('compareMetric')}
              </th>
              {codes.map((code) => (
                <th key={code} className="pb-2 pl-3 text-right">
                  <span className="inline-flex items-center gap-1.5">
                    {siteCountryCode(code) && (
                      <span className={`fi fi-${siteCountryCode(code)} !h-3.5 !w-5`} />
                    )}
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {siteName(code)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemove(code)}
                      aria-label={t('compareRemove')}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-t border-gray-100 dark:border-gray-800">
                <td className="py-2 text-gray-600 dark:text-gray-300">{r.label}</td>
                {codes.map((code) => {
                  const m = metricsByCode.get(code);
                  return (
                    <td
                      key={code}
                      className="py-2 pl-3 text-right tabular-nums text-gray-900 dark:text-gray-100"
                    >
                      {m ? r.get(m) : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {codes.length >= 2 && (
        <div>
          <p className="mb-1 text-sm font-medium text-gray-900 dark:text-gray-100">
            {t('arbitrageTitle')}
          </p>
          <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">{t('arbitrageHint')}</p>
          {arbitrage && arbitrage.length > 0 ? (
            <ul className="space-y-2.5">
              {arbitrage.map((a) => (
                <li
                  key={a.category_id}
                  className="rounded-lg border border-gray-100 p-3 dark:border-gray-800"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="truncate text-sm text-gray-800 dark:text-gray-100">
                      {a.name}
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      +{formatPercent(a.gap_pct, locale)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      {siteCountryCode(a.cheapest_country) && (
                        <span className={`fi fi-${siteCountryCode(a.cheapest_country)} !h-3 !w-4`} />
                      )}
                      {formatCurrency(a.min_usd, 'USD', locale)}
                    </span>
                    <ArrowRight className="h-3 w-3" />
                    <span className="inline-flex items-center gap-1">
                      {siteCountryCode(a.priciest_country) && (
                        <span className={`fi fi-${siteCountryCode(a.priciest_country)} !h-3 !w-4`} />
                      )}
                      {formatCurrency(a.max_usd, 'USD', locale)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">{t('arbitrageEmpty')}</p>
          )}
        </div>
      )}
    </div>
  );
}
