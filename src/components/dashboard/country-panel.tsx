'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { getProductCategories, getProducts } from '@/lib/api/endpoints';
import type { CountryMetrics } from '@/lib/types';
import { formatCurrency, formatDate, formatNumber, formatPercent } from '@/lib/format';
import { siteCountryCode, siteName } from '@/lib/ml-sites';

interface CountryPanelProps {
  code: string;
  metrics: CountryMetrics | undefined;
  onClose: () => void;
}

/** In-dashboard summary for one market, opened by clicking its country. */
export function CountryPanel({ code, metrics, onClose }: CountryPanelProps) {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const flag = siteCountryCode(code);

  const { data: categories } = useQuery({
    queryKey: ['product-categories', code],
    queryFn: () => getProductCategories(code),
  });
  const { data: products } = useQuery({
    queryKey: ['products', { country: code, limit: 5 }],
    queryFn: () => getProducts({ country: code, limit: 5 }),
  });

  const share = (v: number | null | undefined) =>
    v == null ? '—' : formatPercent(v * 100, locale);

  const kpis = metrics
    ? [
        { label: t('metricCount'), value: formatNumber(metrics.count, locale) },
        {
          label: t('metricMedianPrice'),
          value: formatCurrency(metrics.median_usd_price, 'USD', locale),
        },
        { label: t('metricDiscount'), value: formatPercent(metrics.avg_discount_pct, locale) },
        { label: t('metricOfficialShare'), value: share(metrics.official_store_share) },
        { label: t('metricCbtShare'), value: share(metrics.cbt_share) },
        { label: t('kpiSellers'), value: formatNumber(metrics.seller_count, locale) },
        { label: t('kpiCategories'), value: formatNumber(metrics.category_count, locale) },
        {
          label: t('kpiLastSnapshot'),
          value: formatDate(metrics.latest_snapshot, locale),
        },
      ]
    : [];

  const topCategories = (categories ?? [])
    .slice()
    .sort((a, b) => b.product_count - a.product_count)
    .slice(0, 5);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {flag && <span className={`fi fi-${flag} !h-5 !w-7 rounded-sm`} />}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {siteName(code)}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('panelClose')}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-lg border border-gray-100 p-3 dark:border-gray-800"
          >
            <dt className="text-xs text-gray-500 dark:text-gray-400">{k.label}</dt>
            <dd className="mt-0.5 text-base font-semibold tabular-nums text-gray-900 dark:text-gray-100">
              {k.value}
            </dd>
          </div>
        ))}
      </dl>

      {topCategories.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            {t('panelTopCategories')}
          </p>
          <ul className="space-y-1.5">
            {topCategories.map((c) => (
              <li
                key={`${c.kind}-${c.id}`}
                className="flex items-center justify-between text-sm"
              >
                <span className="truncate text-gray-700 dark:text-gray-200">{c.name}</span>
                <span className="ml-2 shrink-0 tabular-nums text-gray-500 dark:text-gray-400">
                  {formatNumber(c.product_count, locale)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {products && products.data.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            {t('panelTopProducts')}
          </p>
          <ul className="space-y-1.5">
            {products.data.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate text-gray-700 dark:text-gray-200">{p.name}</span>
                <span className="shrink-0 tabular-nums text-gray-500 dark:text-gray-400">
                  {formatCurrency(p.usd_price ?? p.price, p.usd_price ? 'USD' : p.currency ?? 'USD', locale)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        href={`/products?country=${code}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
      >
        {t('panelExplore')}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
