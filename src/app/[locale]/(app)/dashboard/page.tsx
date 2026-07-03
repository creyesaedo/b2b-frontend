'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { Card } from '@tremor/react';
import { DataState } from '@/components/app/data-state';
import { PageHeader } from '@/components/app/page-header';
import { MarketMap } from '@/components/dashboard/market-map';
import { MapLegend } from '@/components/dashboard/map-legend';
import { MetricSwitcher } from '@/components/dashboard/metric-switcher';
import { ChoroplethScope } from '@/components/dashboard/choropleth-scope';
import { CountryPanel } from '@/components/dashboard/country-panel';
import { CountryCompare } from '@/components/dashboard/country-compare';
import { TimeScrubber } from '@/components/dashboard/time-scrubber';
import { getCountryTimeseries, getStats } from '@/lib/api/endpoints';
import { buildChoropleth, metricValue } from '@/lib/choropleth';
import type { CountryMetric } from '@/lib/types';

const MAX_COMPARE = 4;

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const locale = useLocale();

  const [metric, setMetric] = useState<CountryMetric>('count');
  const [selected, setSelected] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareCodes, setCompareCodes] = useState<string[]>([]);
  // Scrubber position, counted from the latest date (0 = latest). null = follow latest.
  const [dateIdx, setDateIdx] = useState<number | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
  });

  const isEmpty = !!data && data.total_products === 0;

  const metricsByCode = useMemo(
    () => new Map((data?.by_country ?? []).map((c) => [c.country, c])),
    [data],
  );

  // Snapshot dates ascending (stats returns them newest-first).
  const dates = useMemo(() => [...(data?.snapshot_dates ?? [])].reverse(), [data]);
  const activeIndex = dateIdx ?? dates.length - 1;
  const onLatestDate = activeIndex >= dates.length - 1;

  // Time series backs the scrubber; only fetched once the user leaves "latest".
  const { data: series } = useQuery({
    queryKey: ['timeseries', metric],
    queryFn: () => getCountryTimeseries(metric),
    enabled: dates.length > 1,
  });

  // Metric value per ML code for the active view: the live stats at the latest
  // date, or the scrubbed snapshot's slice from the time series.
  const valueByCode = useMemo(() => {
    const map = new Map<string, number | null>();
    if (onLatestDate || !series) {
      for (const c of data?.by_country ?? []) map.set(c.country, metricValue(c, metric));
      return map;
    }
    const targetDate = dates[activeIndex];
    const di = series.dates.indexOf(targetDate);
    for (const row of series.by_country) {
      map.set(row.country, di >= 0 ? (row.values[di] ?? null) : null);
    }
    return map;
  }, [data, series, metric, onLatestDate, activeIndex, dates]);

  const choropleth = useMemo(
    () => buildChoropleth([...valueByCode.values()]),
    [valueByCode],
  );

  const handleSelect = (code: string) => {
    if (compareMode) {
      setCompareCodes((prev) =>
        prev.includes(code)
          ? prev.filter((c) => c !== code)
          : prev.length >= MAX_COMPARE
            ? prev
            : [...prev, code],
      );
    } else {
      setSelected((prev) => (prev === code ? null : code));
    }
  };

  const toggleCompare = () => {
    setCompareMode((on) => !on);
    setSelected(null);
    setCompareCodes([]);
  };

  const showPanel = !compareMode && selected;
  const showCompare = compareMode;

  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <DataState isLoading={isLoading} isError={isError} isEmpty={isEmpty} onRetry={() => refetch()}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <MetricSwitcher metric={metric} onChange={setMetric} />
          <button
            type="button"
            onClick={toggleCompare}
            aria-pressed={compareMode}
            className={[
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              compareMode
                ? 'bg-violet-600 text-white hover:bg-violet-700'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800',
            ].join(' ')}
          >
            {compareMode ? t('compareOn') : t('compareOff')}
          </button>
        </div>

        <ChoroplethScope>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className={`dark:!bg-gray-900 ${showPanel || showCompare ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
              <MarketMap
                valueByCode={valueByCode}
                choropleth={choropleth}
                metric={metric}
                selected={selected}
                multiSelected={compareCodes}
                onSelect={handleSelect}
                locale={locale}
              />

              <div className="mt-4 space-y-4 border-t border-gray-100 pt-4 dark:border-gray-800">
                <MapLegend choropleth={choropleth} metric={metric} locale={locale} />
                {dates.length > 1 && (
                  <TimeScrubber
                    dates={dates}
                    index={activeIndex}
                    onChange={(i) => setDateIdx(i)}
                  />
                )}
              </div>
            </Card>

            {(showPanel || showCompare) && (
              <Card className="dark:!bg-gray-900 lg:col-span-1">
                {showPanel && selected && (
                  <CountryPanel
                    code={selected}
                    metrics={metricsByCode.get(selected)}
                    onClose={() => setSelected(null)}
                  />
                )}
                {showCompare && (
                  <CountryCompare
                    codes={compareCodes}
                    metricsByCode={metricsByCode}
                    onRemove={(code) =>
                      setCompareCodes((prev) => prev.filter((c) => c !== code))
                    }
                  />
                )}
              </Card>
            )}
          </div>
        </ChoroplethScope>
      </DataState>
    </>
  );
}
