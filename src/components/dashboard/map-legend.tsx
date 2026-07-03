'use client';

import { useTranslations } from 'next-intl';
import type { CountryMetric } from '@/lib/types';
import { formatMetric, type Choropleth } from '@/lib/choropleth';

interface MapLegendProps {
  choropleth: Choropleth;
  metric: CountryMetric;
  locale?: string;
}

/** Sequential-scale legend: one swatch per bucket with its value range. */
export function MapLegend({ choropleth, metric, locale }: MapLegendProps) {
  const t = useTranslations('dashboard');

  if (choropleth.empty) {
    return <p className="text-sm text-gray-400">{t('legendNoData')}</p>;
  }

  // Bucket boundaries: [min, t0, t1, …, max]. Bucket i spans edges[i]…edges[i+1].
  const edges = [choropleth.min, ...choropleth.thresholds, choropleth.max];

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
        {t('legendTitle')}
      </p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {Array.from({ length: choropleth.steps }).map((_, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-sm ring-1 ring-black/5 dark:ring-white/10"
              style={{ backgroundColor: `var(--choro-${i})` }}
            />
            <span className="text-xs tabular-nums text-gray-600 dark:text-gray-300">
              {formatMetric(metric, edges[i], locale)}
              {edges[i + 1] !== undefined && edges[i + 1] !== edges[i]
                ? `–${formatMetric(metric, edges[i + 1], locale)}`
                : ''}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-sm ring-1 ring-black/5 dark:ring-white/10"
            style={{ backgroundColor: 'var(--choro-nodata)' }}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">{t('legendNoData')}</span>
        </div>
      </div>
    </div>
  );
}
