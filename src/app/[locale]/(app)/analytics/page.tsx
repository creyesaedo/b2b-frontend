'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQueries, useQuery } from '@tanstack/react-query';
import { SearchSelect, SearchSelectItem, Select, SelectItem } from '@tremor/react';
import { Plus, RotateCcw } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { DataState } from '@/components/app/data-state';
import { WidgetRenderer } from '@/components/analytics/widget-renderer';
import { AddWidgetDialog } from '@/components/analytics/add-widget-dialog';
import { AnalyticsTutorial } from '@/components/analytics/analytics-tutorial';
import {
  DashboardCanvas,
  type LayoutOverrides,
} from '@/components/analytics/dashboard-canvas';
import {
  getInsights,
  instantiateTemplate,
  listEngineTemplates,
  resolveWidget,
} from '@/lib/engine/api';
import type { ResolvedWidget, TemplateSummary, WidgetSpec } from '@/lib/engine/types';
import { ChartConfigDialog } from '@/components/analytics/chart-config';
import {
  buildAddedWidget,
  buildChartWidget,
  defaultChartConfig,
  isAddedWidget,
  isConfigurableWidget,
  readChartConfig,
  type ChartConfig,
  type ChartKind,
  type WidgetPreset,
} from '@/lib/engine/widget-presets';
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

  // Widgets the user added on top of the template, persisted per template.
  const widgetsKey = `analytics-widgets:${templateId}`;
  const [addedWidgets, setAddedWidgets] = useState<WidgetSpec[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  // Open data-binding dialog: `add` creates a new line chart, `edit` re-binds one.
  const [chartConfig, setChartConfig] = useState<{
    mode: 'add' | 'edit';
    widgetId?: string;
    initial: ChartConfig;
  } | null>(null);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(widgetsKey);
      setAddedWidgets(stored ? (JSON.parse(stored) as WidgetSpec[]) : []);
    } catch {
      setAddedWidgets([]);
    }
  }, [widgetsKey]);
  const persistWidgets = (next: WidgetSpec[]) => {
    setAddedWidgets(next);
    if (next.length === 0) localStorage.removeItem(widgetsKey);
    else localStorage.setItem(widgetsKey, JSON.stringify(next));
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

  // Added widgets resolve one-by-one against the dashboard's global filters, so
  // they behave exactly like template widgets (data + per-widget error).
  const globalFilters = spec?.globalFilters ?? [];
  const addedResults = useQueries({
    queries: addedWidgets.map((w) => ({
      // dataQuery is part of the key: re-binding a widget's data must refetch.
      queryKey: ['engine-widget', templateId, params, w.id, w.dataQuery],
      queryFn: () => resolveWidget(w, globalFilters),
      enabled: ready && !!spec,
      staleTime: 5 * 60_000,
    })),
  });
  const addedResolved: ResolvedWidget[] = addedWidgets.map((w, i) => {
    const r = addedResults[i];
    if (r?.data) return r.data;
    return {
      widgetId: w.id,
      type: w.type,
      resultSet: null,
      error: r?.error ? (r.error as Error).message : null,
    };
  });

  const allWidgets = spec ? [...spec.widgets, ...addedWidgets] : [];
  const allResolved = [...resolvedWidgets, ...addedResolved];

  const addWidget = (preset: WidgetPreset) => {
    const widget = buildAddedWidget(preset, t(`presets.${preset.id}.label`), bottomOfGrid());
    persistWidgets([...addedWidgets, widget]);
    setAddOpen(false);
  };
  const bottomOfGrid = () =>
    allWidgets.reduce((max, w) => {
      const lay = layoutOverrides[w.id] ?? w.layout;
      return Math.max(max, lay.y + lay.h);
    }, 0);

  /** Saves a configurable chart — appends when adding, replaces when editing. */
  const saveChartWidget = (config: ChartConfig) => {
    const fallback = t(`chartKind.${config.kind}`);
    if (chartConfig?.mode === 'edit' && chartConfig.widgetId) {
      const existing = addedWidgets.find((w) => w.id === chartConfig.widgetId);
      const rebuilt = buildChartWidget(config, fallback, {
        id: chartConfig.widgetId,
        layout: existing?.layout,
      });
      persistWidgets(addedWidgets.map((w) => (w.id === rebuilt.id ? rebuilt : w)));
    } else {
      const widget = buildChartWidget(config, fallback, { placeAtY: bottomOfGrid() });
      persistWidgets([...addedWidgets, widget]);
    }
    setChartConfig(null);
  };

  const removeWidget = (id: string) => {
    persistWidgets(addedWidgets.filter((w) => w.id !== id));
    if (layoutOverrides[id]) {
      const next = { ...layoutOverrides };
      delete next[id];
      saveLayout(next);
    }
  };

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
            <button
              data-tour="add-widget"
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-blue-600 bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700 dark:border-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              <Plus className="h-3.5 w-3.5" />
              {t('addWidget')}
            </button>
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
              widgets={allWidgets}
              overrides={layoutOverrides}
              onOverridesChange={saveLayout}
              renderWidget={(widget) => (
                <WidgetRenderer
                  widget={widget}
                  resolved={allResolved.find((w) => w.widgetId === widget.id)}
                  insights={insightsQuery.data?.insights ?? []}
                  insightsLoading={hasInsights && insightsQuery.isLoading}
                  fmt={fmt}
                  onRemove={
                    isAddedWidget(widget.id) ? () => removeWidget(widget.id) : undefined
                  }
                  removeLabel={t('removeWidget')}
                  onConfigure={
                    isConfigurableWidget(widget.id)
                      ? () =>
                          setChartConfig({
                            mode: 'edit',
                            widgetId: widget.id,
                            initial: readChartConfig(widget),
                          })
                      : undefined
                  }
                  configureLabel={t('configureWidget')}
                />
              )}
            />
          )}
        </DataState>
      )}

      <AddWidgetDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={addWidget}
        onAddChart={(kind: ChartKind) => {
          setAddOpen(false);
          setChartConfig({ mode: 'add', initial: defaultChartConfig(kind) });
        }}
      />
      <ChartConfigDialog
        open={!!chartConfig}
        mode={chartConfig?.mode ?? 'add'}
        initial={chartConfig?.initial ?? defaultChartConfig('line')}
        onClose={() => setChartConfig(null)}
        onSave={saveChartWidget}
      />
      <AnalyticsTutorial />
    </div>
  );
}
