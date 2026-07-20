'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { getSemanticCatalog } from '@/lib/engine/api';
import {
  BAR_TOP_OPTIONS,
  CATEGORICAL_DIMENSIONS,
  GRANULARITIES,
  MAX_CHART_METRICS,
  PART_TO_WHOLE_METRICS,
  PIE_SLICE_OPTIONS,
  TIME_WINDOWS,
  isCategorical,
  isPartToWhole,
  type ChartConfig,
  type Granularity,
  type TimeWindow,
} from '@/lib/engine/widget-presets';
import { DataState } from '@/components/app/data-state';

/**
 * Binds data to a configurable chart: which metrics to plot (from the engine's
 * semantic catalog — the user never sees SQL), split by time or by a category,
 * plus the options that apply to the chosen chart flavour.
 *
 * Used both when ADDING a chart and when re-configuring an existing one, so
 * `initial` pre-fills the form in edit mode.
 */
export function ChartConfigDialog({
  open,
  mode,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  mode: 'add' | 'edit';
  initial: ChartConfig;
  onClose: () => void;
  onSave: (config: ChartConfig) => void;
}) {
  const t = useTranslations('analytics');
  const [config, setConfig] = useState<ChartConfig>(initial);

  // Re-seed whenever the dialog opens (a different widget may be edited).
  useEffect(() => {
    if (open) setConfig(initial);
  }, [open, initial]);

  const catalogQuery = useQuery({
    queryKey: ['engine-semantic-catalog'],
    queryFn: getSemanticCatalog,
    enabled: open,
    staleTime: 30 * 60_000, // the catalog is static config
  });

  const partToWhole = isPartToWhole(config.kind);
  const categorical = isCategorical(config.kind);

  // A pie slice must be a total that adds up to a whole — averages and ratios
  // are filtered out rather than silently producing a meaningless chart.
  const metrics = useMemo(() => {
    const all = catalogQuery.data?.metrics ?? [];
    return partToWhole ? all.filter((m) => PART_TO_WHOLE_METRICS.includes(m.name)) : all;
  }, [catalogQuery.data, partToWhole]);

  const dimensions = useMemo(() => {
    const all = catalogQuery.data?.dimensions ?? [];
    return all.filter((d) => (CATEGORICAL_DIMENSIONS as readonly string[]).includes(d.name));
  }, [catalogQuery.data]);

  const selectedLabels = config.metrics
    .map((ref) => metrics.find((m) => m.name === ref)?.label ?? ref)
    .join(' · ');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const toggleMetric = (name: string) => {
    setConfig((c) => {
      // Part-to-whole plots exactly one metric: picking replaces.
      if (partToWhole) return { ...c, metrics: [name] };
      const has = c.metrics.includes(name);
      if (has) return { ...c, metrics: c.metrics.filter((m) => m !== name) };
      if (c.metrics.length >= MAX_CHART_METRICS) return c;
      return { ...c, metrics: [...c.metrics, name] };
    });
  };

  const topOptions = partToWhole ? PIE_SLICE_OPTIONS : BAR_TOP_OPTIONS;
  const canSave = config.metrics.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={t(`chartKind.${config.kind}`)}
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {mode === 'add'
              ? t('chartConfig.addTitle', { chart: t(`chartKind.${config.kind}`) })
              : t('chartConfig.editTitle', { chart: t(`chartKind.${config.kind}`) })}
          </h2>
          <button
            type="button"
            aria-label={t('close')}
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          {partToWhole
            ? t('chartConfig.subtitlePart')
            : t('chartConfig.subtitleMulti', { max: MAX_CHART_METRICS })}
        </p>

        {/* Metrics */}
        <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
          {t('chartConfig.metrics')}
          {!partToWhole && ` (${config.metrics.length}/${MAX_CHART_METRICS})`}
        </label>
        <DataState
          isLoading={catalogQuery.isLoading}
          isError={catalogQuery.isError}
          onRetry={() => catalogQuery.refetch()}
        >
          <div className="mb-4 grid max-h-48 grid-cols-1 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
            {metrics.map((m) => {
              const checked = config.metrics.includes(m.name);
              const atMax =
                !partToWhole && !checked && config.metrics.length >= MAX_CHART_METRICS;
              return (
                <button
                  key={m.name}
                  type="button"
                  disabled={atMax}
                  title={m.definition}
                  onClick={() => toggleMetric(m.name)}
                  className={`flex items-start gap-2 rounded-lg border p-2 text-left transition-colors ${
                    checked
                      ? 'border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950'
                      : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800'
                  } ${atMax ? 'cursor-not-allowed opacity-40' : ''}`}
                >
                  <span
                    aria-hidden
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border text-[10px] font-bold ${
                      partToWhole ? 'rounded-full' : 'rounded'
                    } ${
                      checked
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {checked ? '✓' : ''}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-gray-800 dark:text-gray-100">
                      {m.label}
                    </span>
                    <span className="block truncate text-xs text-gray-400">{m.format}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </DataState>

        {/* Split: by category (bars/pie) or by time (line) */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {categorical ? (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  {t('chartConfig.splitBy')}
                </label>
                <select
                  value={config.dimension}
                  onChange={(e) => setConfig((c) => ({ ...c, dimension: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
                >
                  {dimensions.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  {partToWhole ? t('chartConfig.slices') : t('chartConfig.topN')}
                </label>
                <select
                  value={config.topN}
                  onChange={(e) => setConfig((c) => ({ ...c, topN: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
                >
                  {topOptions.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                {partToWhole && (
                  <p className="mt-1 text-xs text-gray-400">{t('chartConfig.othersHint')}</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  {t('window')}
                </label>
                <select
                  value={config.window}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, window: e.target.value as TimeWindow }))
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
                >
                  {TIME_WINDOWS.map((w) => (
                    <option key={w} value={w}>
                      {t(`window_${w}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  {t('chartConfig.granularity')}
                </label>
                <select
                  value={config.granularity}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, granularity: e.target.value as Granularity }))
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
                >
                  {GRANULARITIES.map((g) => (
                    <option key={g} value={g}>
                      {t(`chartConfig.granularity_${g}`)}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        {/* Title + line-only dual axis */}
        <div className="mb-5">
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
            {t('chartConfig.widgetTitle')}
          </label>
          <input
            type="text"
            value={config.title}
            placeholder={selectedLabels || t('chartConfig.titlePlaceholder')}
            onChange={(e) => setConfig((c) => ({ ...c, title: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-800 placeholder:text-gray-400 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
          />
          {config.kind === 'line' && config.metrics.length > 1 && (
            <label className="mt-3 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={config.dualAxis}
                onChange={(e) => setConfig((c) => ({ ...c, dualAxis: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              {t('chartConfig.dualAxis')}
            </label>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {t('chartConfig.cancel')}
          </button>
          <button
            type="button"
            disabled={!canSave}
            // An empty title falls back to the chosen metrics' labels.
            onClick={() => onSave({ ...config, title: config.title.trim() || selectedLabels })}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {mode === 'add' ? t('chartConfig.add') : t('chartConfig.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
