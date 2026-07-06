'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { MarketMap, type HoverInfo } from '@/components/dashboard/market-map';
import { MapLegend } from '@/components/dashboard/map-legend';
import { MetricSwitcher } from '@/components/dashboard/metric-switcher';
import { ChoroplethScope } from '@/components/dashboard/choropleth-scope';
import { CountryPanel } from '@/components/dashboard/country-panel';
import { CountryCompare } from '@/components/dashboard/country-compare';
import { TimeScrubber } from '@/components/dashboard/time-scrubber';
import { DataState } from '@/components/app/data-state';
import { getCountryTimeseries, getStats } from '@/lib/api/endpoints';
import { buildChoropleth, formatMetric, metricValue } from '@/lib/choropleth';
import { siteName } from '@/lib/ml-sites';
import type { CountryMetric } from '@/lib/types';

const MAX_COMPARE = 4;

// Frosted floating surface shared by every overlay that sits on the map.
const GLASS =
  'rounded-2xl border border-white/60 bg-white/75 shadow-xl shadow-slate-900/[0.07] backdrop-blur-xl ' +
  'dark:border-white/10 dark:bg-slate-900/75 dark:shadow-black/30';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const locale = useLocale();

  const [metric, setMetric] = useState<CountryMetric>('count');
  const [selected, setSelected] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareCodes, setCompareCodes] = useState<string[]>([]);
  const [hovered, setHovered] = useState<HoverInfo | null>(null);
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

  const showPanel = !compareMode && !!selected;
  const showCompare = compareMode;
  const panelOpen = showPanel || showCompare;

  // Side-panel width: 25rem fits two compared countries; each extra column adds
  // ~7rem so the metrics table never needs horizontal scroll. The CSS min()
  // caps it at the map surface. Shared via --panel-w with the bottom bar.
  const panelRem = 25 + (showCompare ? Math.max(0, compareCodes.length - 2) * 7 : 0);
  const panelStyle = { '--panel-w': `min(${panelRem}rem, 100% - 2rem)` } as CSSProperties;

  return (
    // Negative margins cancel the AppShell <main> padding so the map surface
    // bleeds edge-to-edge; the +2rem/+3rem height puts back what the padding took.
    <ChoroplethScope className="-m-4 h-[calc(100%+2rem)] sm:-m-6 sm:h-[calc(100%+3rem)]">
      <div
        className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-b from-sky-50 via-blue-50/50 to-indigo-100/60 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900"
        style={panelStyle}
      >
        {/* Soft radial glow behind the continent — pure decoration. */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_45%,rgba(59,130,246,0.10),transparent_70%)] dark:bg-[radial-gradient(60%_50%_at_50%_45%,rgba(59,130,246,0.14),transparent_70%)]" />
        <DataState
          isLoading={isLoading}
          isError={isError}
          isEmpty={isEmpty}
          onRetry={() => refetch()}
        >
          {/* Full-bleed map fills the whole surface; everything else floats over it. */}
          <div className="absolute inset-0">
            <MarketMap
              valueByCode={valueByCode}
              choropleth={choropleth}
              selected={selected}
              multiSelected={compareCodes}
              onSelect={handleSelect}
              onHover={setHovered}
            />
          </div>

          {/* Top-left control cluster: title, metric, compare, live readout. */}
          <div className={`absolute left-4 top-4 z-20 w-[min(21rem,calc(100%-2rem))] select-none space-y-3 p-4 ${GLASS}`}>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                {t('title')}
              </h1>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                {t('subtitle')}
              </p>
            </div>

            <MetricSwitcher metric={metric} onChange={setMetric} />

            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 flex-1 truncate text-sm">
                {hovered ? (
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {siteName(hovered.code)}{' '}
                    <span className="tabular-nums text-blue-600 dark:text-blue-400">
                      {formatMetric(metric, hovered.value, locale)}
                    </span>
                  </span>
                ) : (
                  <span className="text-gray-400">{t('mapHint')}</span>
                )}
              </p>
              <button
                type="button"
                onClick={toggleCompare}
                aria-pressed={compareMode}
                className={[
                  'shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  compareMode
                    ? 'bg-fuchsia-600 text-white hover:bg-fuchsia-700'
                    : 'border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800',
                ].join(' ')}
              >
                {compareMode ? t('compareOn') : t('compareOff')}
              </button>
            </div>
          </div>

          {/* Bottom bar: legend + time scrubber. Clears the side panel when open. */}
          <div
            className={`absolute bottom-4 left-4 z-20 flex select-none flex-wrap items-end justify-between gap-3 transition-[right] duration-300 ${
              panelOpen ? 'right-4 sm:right-[calc(var(--panel-w)+2rem)]' : 'right-4'
            }`}
          >
            <div className={`max-w-full p-3 ${GLASS}`}>
              <MapLegend choropleth={choropleth} metric={metric} locale={locale} />
            </div>
            {dates.length > 1 && (
              <div className={`w-full max-w-xs p-3 sm:w-72 ${GLASS}`}>
                <TimeScrubber
                  dates={dates}
                  index={activeIndex}
                  onChange={(i) => setDateIdx(i)}
                />
              </div>
            )}
          </div>

          {/* Right-hand detail / compare panel slides over the map. */}
          {panelOpen && (
            <div
              className={`absolute bottom-4 right-4 top-4 z-30 w-[calc(100%-2rem)] overflow-y-auto p-5 transition-[width] duration-300 sm:w-[var(--panel-w)] ${GLASS}`}
            >
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
            </div>
          )}
        </DataState>
      </div>
    </ChoroplethScope>
  );
}
