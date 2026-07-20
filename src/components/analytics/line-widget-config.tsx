'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { getSemanticCatalog } from '@/lib/engine/api';
import {
  GRANULARITIES,
  MAX_LINE_METRICS,
  TIME_WINDOWS,
  type Granularity,
  type LineWidgetConfig,
  type TimeWindow,
} from '@/lib/engine/widget-presets';
import { DataState } from '@/components/app/data-state';

/**
 * Binds data to a custom line chart: which metrics to plot (from the engine's
 * semantic catalog — the user never sees SQL), over which time window and
 * granularity, plus dual-axis and a custom title.
 *
 * Used both when ADDING the widget and when re-configuring an existing one, so
 * `initial` pre-fills the form in edit mode.
 */
export function LineWidgetConfigDialog({
  open,
  mode,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  mode: 'add' | 'edit';
  initial: LineWidgetConfig;
  onClose: () => void;
  onSave: (config: LineWidgetConfig) => void;
}) {
  const t = useTranslations('analytics');
  const [config, setConfig] = useState<LineWidgetConfig>(initial);

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

  const metrics = useMemo(() => catalogQuery.data?.metrics ?? [], [catalogQuery.data]);
  const selectedLabels = config.metrics
    .map((ref) => metrics.find((m) => m.name === ref)?.label ?? ref)
    .join(' · ');

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const toggleMetric = (name: string) => {
    setConfig((c) => {
      const has = c.metrics.includes(name);
      if (has) return { ...c, metrics: c.metrics.filter((m) => m !== name) };
      if (c.metrics.length >= MAX_LINE_METRICS) return c;
      return { ...c, metrics: [...c.metrics, name] };
    });
  };

  const canSave = config.metrics.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={t('lineConfig.title')}
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {mode === 'add' ? t('lineConfig.title') : t('lineConfig.editTitle')}
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
          {t('lineConfig.subtitle', { max: MAX_LINE_METRICS })}
        </p>

        {/* Metrics */}
        <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
          {t('lineConfig.metrics')} ({config.metrics.length}/{MAX_LINE_METRICS})
        </label>
        <DataState
          isLoading={catalogQuery.isLoading}
          isError={catalogQuery.isError}
          onRetry={() => catalogQuery.refetch()}
        >
          <div className="mb-4 grid max-h-56 grid-cols-1 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
            {metrics.map((m) => {
              const checked = config.metrics.includes(m.name);
              const atMax = !checked && config.metrics.length >= MAX_LINE_METRICS;
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
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold ${
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

        {/* Window + granularity */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              {t('lineConfig.granularity')}
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
                  {t(`lineConfig.granularity_${g}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Title + dual axis */}
        <div className="mb-5">
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
            {t('lineConfig.widgetTitle')}
          </label>
          <input
            type="text"
            value={config.title}
            placeholder={selectedLabels || t('lineConfig.titlePlaceholder')}
            onChange={(e) => setConfig((c) => ({ ...c, title: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-800 placeholder:text-gray-400 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
          />
          <label className="mt-3 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={config.dualAxis}
              onChange={(e) => setConfig((c) => ({ ...c, dualAxis: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            {t('lineConfig.dualAxis')}
          </label>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {t('lineConfig.cancel')}
          </button>
          <button
            type="button"
            disabled={!canSave}
            // An empty title falls back to the chosen metrics' labels.
            onClick={() => onSave({ ...config, title: config.title.trim() || selectedLabels })}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {mode === 'add' ? t('lineConfig.add') : t('lineConfig.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
