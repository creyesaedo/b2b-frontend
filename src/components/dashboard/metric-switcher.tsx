'use client';

import { useTranslations } from 'next-intl';
import type { CountryMetric } from '@/lib/types';

/** The metrics the map can color by, in display order. */
export const MAP_METRICS: CountryMetric[] = ['count', 'median_price', 'discount', 'official_share'];

const LABEL_KEY: Record<CountryMetric, string> = {
  count: 'metricCount',
  median_price: 'metricMedianPrice',
  discount: 'metricDiscount',
  official_share: 'metricOfficialShare',
};

interface MetricSwitcherProps {
  metric: CountryMetric;
  onChange: (metric: CountryMetric) => void;
}

/** Segmented control that picks the metric the choropleth / scrubber colors by. */
export function MetricSwitcher({ metric, onChange }: MetricSwitcherProps) {
  const t = useTranslations('dashboard');

  return (
    <div
      role="tablist"
      aria-label={t('metricSwitcherLabel')}
      className="inline-flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800"
    >
      {MAP_METRICS.map((m) => {
        const active = m === metric;
        return (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(m)}
            className={[
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-white text-blue-700 shadow-sm dark:bg-gray-950 dark:text-blue-300'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100',
            ].join(' ')}
          >
            {t(LABEL_KEY[m])}
          </button>
        );
      })}
    </div>
  );
}
