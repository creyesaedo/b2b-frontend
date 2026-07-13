'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { SearchSelect, SearchSelectItem, Select, SelectItem } from '@tremor/react';
import { RotateCcw } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { DataState } from '@/components/app/data-state';
import { WidgetRenderer } from '@/components/analytics/widget-renderer';
import {
  DashboardCanvas,
  type LayoutOverrides,
} from '@/components/analytics/dashboard-canvas';
import { getInsights, instantiateTemplate, listEngineTemplates } from '@/lib/engine/api';
import type { TemplateSummary } from '@/lib/engine/types';
import { siteCurrency, type CellFormatOptions } from '@/lib/engine/format';
import { getCategories } from '@/lib/api/endpoints';
import { siteName } from '@/lib/ml-sites';
import { formatDate } from '@/lib/format';

// Sites the scraper sweeps weekly (the engine's dataset population).
const CORE_SITES = ['MLA', 'MLB', 'MLC', 'MLM', 'MCO', 'MPE', 'MLU'];
const WINDOWS = ['last_4_weeks', 'last_8_weeks', 'last_12_weeks', 'last_26_weeks'];

/** Templated dashboards resolved by the dashboard-engine (via the BFF). */
export default function AnalyticsPage() {
  const t = useTranslations('analytics');
  const locale = useLocale();

  const templatesQuery = useQuery({
    queryKey: ['engine-templates'],
    queryFn: listEngineTemplates,
  });
  const templates = useMemo(() => templatesQuery.data ?? [], [templatesQuery.data]);

  const [templateId, setTemplateId] = useState('resumen_pais');
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  // User rearrangements of the widget grid, persisted per template.
  const layoutKey = `analytics-layout:${templateId}`;
  const [layoutOverrides, setLayoutOverrides] = useState<LayoutOverrides>({});
  useEffect(() => {
    try {
      const stored = localStorage.getItem(layoutKey);
      setLayoutOverrides(stored ? (JSON.parse(stored) as LayoutOverrides) : {});
    } catch {
      setLayoutOverrides({});
    }
  }, [layoutKey]);
  const saveLayout = (next: LayoutOverrides) => {
    setLayoutOverrides(next);
    if (Object.keys(next).length === 0) localStorage.removeItem(layoutKey);
    else localStorage.setItem(layoutKey, JSON.stringify(next));
  };

  const template = templates.find((tpl) => tpl.id === templateId);

  // Effective params: template defaults ← user overrides.
  const params = useMemo(() => {
    const merged: Record<string, string> = {};
    for (const p of template?.parameters ?? []) {
      if (p.default !== undefined) merged[p.name] = p.default;
    }
    for (const [k, v] of Object.entries(overrides)) if (v) merged[k] = v;
    return merged;
  }, [template, overrides]);

  const missingParams = (template?.parameters ?? []).filter(
    (p) => p.required && !params[p.name],
  );
  const ready = !!template && missingParams.length === 0;

  const dashboardQuery = useQuery({
    queryKey: ['engine-dashboard', templateId, params],
    queryFn: () => instantiateTemplate(templateId, params),
    enabled: ready,
    staleTime: 5 * 60_000, // snapshots are immutable — results barely move
  });

  // Root categories of the selected site (for the `categoria` parameter).
  const needsCategory = (template?.parameters ?? []).some((p) => p.name === 'categoria');
  const categoriesQuery = useQuery({
    queryKey: ['categories', params.pais, 'parents'],
    queryFn: () => getCategories({ country: params.pais, parent_only: true }),
    enabled: needsCategory && !!params.pais,
  });

  // Insight cards are fed by the Insight Engine, separate from widget data.
  const spec = dashboardQuery.data?.spec;
  const hasInsights = !!spec?.widgets.some((w) => w.type === 'insight_card');
  const insightsQuery = useQuery({
    queryKey: ['engine-insights', params.pais, params.categoria ?? null],
    queryFn: () =>
      getInsights({ pais: params.pais, ...(params.categoria ? { categoria: params.categoria } : {}) }),
    enabled: hasInsights && !!params.pais,
  });

  const fmt: CellFormatOptions = {
    locale,
    localCurrency: siteCurrency(params.pais),
  };

  const resolvedWidgets = dashboardQuery.data?.widgets ?? [];
  const snapshotWeek =
    resolvedWidgets.find((w) => w.resultSet?.meta.snapshotWeek)?.resultSet?.meta
      .snapshotWeek ?? null;

  const setParam = (name: string, value: string) => {
    setOverrides((prev) => ({ ...prev, [name]: value }));
  };
  const switchTemplate = (id: string) => {
    setTemplateId(id);
    // pais carries across templates; template-specific params reset.
    setOverrides((prev) => {
      const next: Record<string, string> = {};
      if (prev.pais) next.pais = prev.pais;
      return next;
    });
  };

  return (
    <div>
      <PageHeader title={t('title')} subtitle={template?.businessQuestion ?? t('subtitle')} />

      {/* Template picker */}
      <div className="mb-4 flex flex-wrap gap-2">
        {templates.map((tpl: TemplateSummary) => (
          <button
            key={tpl.id}
            onClick={() => switchTemplate(tpl.id)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              tpl.id === templateId
                ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-300'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            <span aria-hidden>{tpl.icon}</span>
            {tpl.label}
          </button>
        ))}
      </div>

      {/* Parameters */}
      {template && (
        <div className="mb-5 flex flex-wrap items-end gap-3">
          <div className="w-44">
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('country')}
            </label>
            <Select value={params.pais ?? ''} onValueChange={(v) => setParam('pais', v)}>
              {CORE_SITES.map((code) => (
                <SelectItem key={code} value={code}>
                  {siteName(code)}
                </SelectItem>
              ))}
            </Select>
          </div>

          {needsCategory && (
            <div className="w-64">
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                {t('category')}
              </label>
              <SearchSelect
                value={params.categoria ?? ''}
                onValueChange={(v) => setParam('categoria', v)}
                placeholder={t('selectCategory')}
              >
                {(categoriesQuery.data ?? []).map((c) => (
                  <SearchSelectItem key={c.ml_id} value={c.ml_id}>
                    {c.name}
                  </SearchSelectItem>
                ))}
              </SearchSelect>
            </div>
          )}

          {(template.parameters ?? []).some((p) => p.name === 'ventana') && (
            <div className="w-48">
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                {t('window')}
              </label>
              <Select value={params.ventana ?? ''} onValueChange={(v) => setParam('ventana', v)}>
                {WINDOWS.map((w) => (
                  <SelectItem key={w} value={w}>
                    {t(`window_${w}`)}
                  </SelectItem>
                ))}
              </Select>
            </div>
          )}

          <div className="ml-auto flex items-center gap-3">
            {Object.keys(layoutOverrides).length > 0 && (
              <button
                onClick={() => saveLayout({})}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <RotateCcw className="h-3 w-3" />
                {t('resetLayout')}
              </button>
            )}
            {snapshotWeek && (
              <p className="text-xs text-gray-400">
                {t('dataAsOf', { date: formatDate(snapshotWeek, locale, { utc: true }) })}
              </p>
            )}
          </div>
        </div>
      )}

      {!ready && template ? (
        <p className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
          {t('missingParams')}
        </p>
      ) : (
        <DataState
          isLoading={templatesQuery.isLoading || (ready && dashboardQuery.isLoading)}
          isError={templatesQuery.isError || dashboardQuery.isError}
          isEmpty={!!dashboardQuery.data && resolvedWidgets.length === 0}
          onRetry={() => dashboardQuery.refetch()}
        >
          {spec && (
            <DashboardCanvas
              widgets={spec.widgets}
              overrides={layoutOverrides}
              onOverridesChange={saveLayout}
              renderWidget={(widget) => (
                <WidgetRenderer
                  widget={widget}
                  resolved={resolvedWidgets.find((w) => w.widgetId === widget.id)}
                  insights={insightsQuery.data?.insights ?? []}
                  insightsLoading={hasInsights && insightsQuery.isLoading}
                  fmt={fmt}
                />
              )}
            />
          )}
        </DataState>
      )}
    </div>
  );
}
