'use client';

import { useTranslations } from 'next-intl';
import type { CountryMetric } from '@/lib/types';
import { formatMetric, type Choropleth } from '@/lib/choropleth';

interface MapLegendProps {
  choropleth: Choropleth;
  metric: CountryMetric;
  locale?: string;
}

/**
 * Sequential-scale legend rendered as a continuous ramp bar: min/max at the
 * ends, one segment per bucket (hover a segment for its exact range).
 */
export function MapLegend({ choropleth, metric, locale }: MapLegendProps) {
  const t = useTranslations('dashboard');

  if (choropleth.empty) {
    return <p className="text-sm text-gray-400">{t('legendNoData')}</p>;
  }

  // Bucket boundaries: [min, t0, t1, …, max]. Bucket i spans edges[i]…edges[i+1].
  const edges = [choropleth.min, ...choropleth.thresholds, choropleth.max];

  return (
    <div className="w-60 max-w-full">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {t('legendTitle')}
        </p>
        <span className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
          <span
            className="inline-block h-2.5 w-2.5 rounded-[3px] ring-1 ring-black/5 dark:ring-white/10"
            style={{ backgroundColor: 'var(--choro-nodata)' }}
          />
          {t('legendNoData')}
        </span>
      </div>

      <div className="flex h-2 overflow-hidden rounded-full ring-1 ring-black/5 dark:ring-white/10">
        {Array.from({ length: choropleth.steps }).map((_, i) => (
          <span
            key={i}
            className="flex-1"
            style={{ backgroundColor: `var(--choro-${i})` }}
            title={`${formatMetric(metric, edges[i], locale)} – ${formatMetric(metric, edges[i + 1], locale)}`}
          />
        ))}
      </div>

      <div className="mt-1 flex items-center justify-between text-[11px] tabular-nums text-gray-600 dark:text-gray-300">
        <span>{formatMetric(metric, choropleth.min, locale)}</span>
        <span>{formatMetric(metric, choropleth.max, locale)}</span>
      </div>
    </div>
  );
}
