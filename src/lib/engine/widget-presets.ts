// Catalog of widgets a user can ADD to an analytics dashboard. Each preset is a
// ready-to-resolve widget built ONLY from semantic refs the engine already
// exposes (mirrored from the official templates in
// dashboard-engine/src/templates/templates.data.ts), so every preset resolves
// against the dashboard's global filters (`pais`, and `categoria` when present).
//
// The picker label and the widget title are localized in the message bundles
// under `analytics.presets.<id>`; the id here is the message key AND the stable
// identifier persisted in localStorage.
import type { WidgetSpec, WidgetType } from './types';

// Sites the scraper sweeps weekly — the map preset compares the whole region.
const CORE_SITES = ['MLA', 'MLB', 'MLC', 'MLM', 'MCO', 'MPE', 'MLU'];

export interface WidgetPreset {
  /** Stable id — message key (`analytics.presets.<id>`) and persistence key. */
  id: string;
  /** Emoji shown in the picker. */
  icon: string;
  type: WidgetType;
  /** Default grid size (12-col grid, row unit ≈ 88px). */
  w: number;
  h: number;
  /** Opaque semantic query the engine resolves. */
  dataQuery: Record<string, unknown>;
  /** Presentation config owned by the frontend widget runtime. */
  visualization: Record<string, unknown>;
}

export const WIDGET_PRESETS: WidgetPreset[] = [
  {
    id: 'precio_promedio_kpi',
    icon: '💲',
    type: 'kpi',
    w: 3,
    h: 2,
    dataQuery: {
      dimensions: [],
      metrics: [{ ref: 'precio_promedio' }],
      filters: [],
      aggregation: {},
      time: { mode: 'compare', compareTo: 'previous_week' },
    },
    visualization: { kind: 'kpi', showDelta: true },
  },
  {
    id: 'ventas_kpi',
    icon: '🛍️',
    type: 'kpi',
    w: 3,
    h: 2,
    dataQuery: {
      dimensions: [],
      metrics: [{ ref: 'ventas_incrementales' }],
      filters: [],
      aggregation: {},
      time: { mode: 'compare', compareTo: 'previous_week' },
    },
    visualization: { kind: 'kpi', showDelta: true },
  },
  {
    id: 'productos_kpi',
    icon: '📦',
    type: 'kpi',
    w: 3,
    h: 2,
    dataQuery: {
      dimensions: [],
      metrics: [{ ref: 'productos' }],
      filters: [],
      aggregation: {},
      time: { mode: 'compare', compareTo: 'previous_week' },
    },
    visualization: { kind: 'kpi', showDelta: true },
  },
  {
    id: 'oficiales_kpi',
    icon: '🏬',
    type: 'kpi',
    w: 3,
    h: 2,
    dataQuery: {
      dimensions: [],
      metrics: [{ ref: 'participacion_oficiales' }],
      filters: [],
      aggregation: {},
      time: { mode: 'latest' },
    },
    visualization: { kind: 'kpi', format: 'percent' },
  },
  {
    id: 'evolucion_precio_line',
    icon: '📈',
    type: 'line',
    w: 6,
    h: 3,
    dataQuery: {
      dimensions: [{ ref: 'semana' }],
      metrics: [{ ref: 'precio_promedio' }],
      filters: [],
      aggregation: {},
      time: { mode: 'series', range: 'last_12_weeks' },
    },
    visualization: { kind: 'line', movingAverage: 3 },
  },
  {
    id: 'evolucion_ventas_line',
    icon: '📉',
    type: 'line',
    w: 6,
    h: 3,
    dataQuery: {
      dimensions: [{ ref: 'semana' }],
      metrics: [{ ref: 'ventas_incrementales' }],
      filters: [],
      aggregation: {},
      time: { mode: 'series', range: 'last_12_weeks' },
    },
    visualization: { kind: 'line' },
  },
  {
    id: 'top_categorias_ranking',
    icon: '🚀',
    type: 'ranking',
    w: 6,
    h: 4,
    dataQuery: {
      dimensions: [{ ref: 'categoria', level: 'raiz' }],
      metrics: [
        { ref: 'crecimiento_wow', base: 'productos' },
        { ref: 'productos' },
        { ref: 'precio_promedio' },
      ],
      filters: [],
      aggregation: {
        topN: { n: 10, by: 'crecimiento_wow', direction: 'desc', includeOthers: false },
      },
      time: { mode: 'latest' },
    },
    visualization: {
      kind: 'ranking',
      colorRule: { metric: 'crecimiento_wow', scale: 'diverging', center: 0 },
    },
  },
  {
    id: 'top_marcas_ranking',
    icon: '🏷️',
    type: 'ranking',
    w: 6,
    h: 4,
    dataQuery: {
      dimensions: [{ ref: 'marca' }],
      metrics: [{ ref: 'productos' }, { ref: 'precio_promedio' }],
      filters: [],
      aggregation: {
        topN: { n: 10, by: 'productos', direction: 'desc', includeOthers: false },
      },
      time: { mode: 'latest' },
    },
    visualization: { kind: 'ranking' },
  },
  {
    id: 'top_vendedores_ranking',
    icon: '🏆',
    type: 'ranking',
    w: 6,
    h: 4,
    dataQuery: {
      dimensions: [{ ref: 'vendedor' }],
      metrics: [{ ref: 'ventas_incrementales' }, { ref: 'productos' }],
      filters: [],
      aggregation: {
        topN: { n: 10, by: 'ventas_incrementales', direction: 'desc', includeOthers: false },
      },
      time: { mode: 'latest' },
    },
    visualization: { kind: 'ranking' },
  },
  {
    id: 'mapa_precio',
    icon: '🗺️',
    type: 'map',
    w: 6,
    h: 4,
    dataQuery: {
      dimensions: [{ ref: 'pais' }],
      // Own pais filter overrides the dashboard's: the map compares the whole
      // region, not just the selected country.
      metrics: [{ ref: 'precio_promedio', unit: 'usd' }],
      filters: [{ dimension: 'pais', operator: 'in', value: CORE_SITES }],
      aggregation: {},
      time: { mode: 'latest' },
    },
    visualization: { kind: 'choropleth', metricSwitcher: true },
  },
];

/**
 * Builds a concrete WidgetSpec for an added widget: a unique id (namespaced so
 * it never collides with template widget ids), the localized title, and a
 * bottom-of-grid placement the user can then drag anywhere.
 */
export function buildAddedWidget(
  preset: WidgetPreset,
  title: string,
  placeAtY: number,
): WidgetSpec {
  return {
    id: `added:${preset.id}:${Date.now()}`,
    type: preset.type,
    title,
    dataQuery: preset.dataQuery,
    visualization: preset.visualization,
    layout: { x: 0, y: placeAtY, w: preset.w, h: preset.h },
  };
}

/** An added widget is one whose id carries the `added:` namespace. */
export const isAddedWidget = (id: string): boolean => id.startsWith('added:');


// ── Configurable charts (the user binds their own data) ──────────────────────

/**
 * Ids of configurable widgets. `added:chart:` is the current namespace;
 * `added:custom_line:` is the original line-only one, still recognised so
 * charts saved before this existed keep their settings button.
 */
const CHART_PREFIX = 'added:chart:';
const LEGACY_LINE_PREFIX = 'added:custom_line:';

export const isConfigurableWidget = (id: string): boolean =>
  id.startsWith(CHART_PREFIX) || id.startsWith(LEGACY_LINE_PREFIX);

/** Chart flavours the user can configure. Pie and donut share a data contract. */
export const CHART_KINDS = ['line', 'bars', 'pie', 'donut', 'scatter'] as const;
export type ChartKind = (typeof CHART_KINDS)[number];

/** Points offered for a scatter — enough to see a cloud, few enough to query fast. */
export const SCATTER_POINT_OPTIONS = [25, 50, 100, 200] as const;

export const TIME_WINDOWS = [
  'last_4_weeks',
  'last_8_weeks',
  'last_12_weeks',
  'last_26_weeks',
] as const;
export type TimeWindow = (typeof TIME_WINDOWS)[number];

/** Time dimensions a line chart can be bucketed by (semantic model `grain`). */
export const GRANULARITIES = ['semana', 'mes'] as const;
export type Granularity = (typeof GRANULARITIES)[number];

/** Categorical dimensions worth splitting a chart by (from the semantic model). */
export const CATEGORICAL_DIMENSIONS = [
  'categoria',
  'marca',
  'vendedor',
  'pais',
  'tipo_envio',
  'tienda_oficial',
] as const;

/** Max series on one chart — beyond this a line/bar chart stops being readable. */
export const MAX_CHART_METRICS = 4;

/**
 * Slice counts offered for pie/donut. Capped low on purpose: a part-to-whole
 * chart is only readable "at a glance" up to ~6 segments, and the remainder
 * always becomes one extra "Otros" slice on top of this number.
 */
export const PIE_SLICE_OPTIONS = [4, 5, 6] as const;
/** Bars tolerate far more categories than slices do. */
export const BAR_TOP_OPTIONS = [5, 10, 15, 20] as const;

/**
 * Metrics that may be a pie slice: only totals/counts, whose parts genuinely
 * sum to a whole. Averages, medians, ratios and growth are excluded — a pie of
 * "average price by brand" adds up to nothing meaningful.
 */
export const PART_TO_WHOLE_METRICS = [
  'productos',
  'ventas_incrementales',
  'ventas_acumuladas',
  'visitas',
  'reviews_totales',
];

/** What the user binds to a configurable chart. */
export interface ChartConfig {
  kind: ChartKind;
  /** Semantic metric refs (1..MAX_CHART_METRICS; pie/donut take exactly 1). */
  metrics: string[];
  /** Categorical dimension — bars/pie/donut only. */
  dimension: string;
  /** Time bucket — line only. */
  granularity: Granularity;
  /** Time range — line only. */
  window: TimeWindow;
  /** Categories kept — bars/pie/donut only. */
  topN: number;
  /** Second Y axis — line only. */
  dualAxis: boolean;
  /** User-provided title; falls back to the joined metric labels. */
  title: string;
}

export const defaultChartConfig = (kind: ChartKind): ChartConfig => ({
  kind,
  metrics: [],
  dimension: 'marca',
  granularity: 'semana',
  window: 'last_12_weeks',
  topN: kind === 'bars' ? 10 : kind === 'scatter' ? 50 : 5,
  dualAxis: false,
  title: '',
});

/** True when this chart splits by a category instead of by time. */
export const isCategorical = (kind: ChartKind): boolean => kind !== 'line';
/** True when only ONE metric is meaningful (part-to-whole). */
export const isPartToWhole = (kind: ChartKind): boolean =>
  kind === 'pie' || kind === 'donut';
/**
 * True when metrics are ROLE-bound rather than a flat set: `metrics[0]` is the
 * X axis, `[1]` the Y axis and an optional `[2]` sizes the bubble. Order
 * matters here, unlike every other chart kind.
 */
export const isScatter = (kind: ChartKind): boolean => kind === 'scatter';

/**
 * Builds (or rebuilds) a configurable chart's WidgetSpec. Passing an existing
 * `id`/`layout` edits in place — the widget keeps its position and the user
 * only re-binds the data.
 */
export function buildChartWidget(
  config: ChartConfig,
  fallbackTitle: string,
  placement: { id?: string; layout?: WidgetSpec['layout']; placeAtY?: number },
): WidgetSpec {
  const title = config.title.trim() || fallbackTitle;
  const id = placement.id ?? `${CHART_PREFIX}${config.kind}:${Date.now()}`;
  const layout =
    placement.layout ??
    ({
      x: 0,
      y: placement.placeAtY ?? 0,
      w: isPartToWhole(config.kind) ? 4 : 6,
      h: isPartToWhole(config.kind) ? 4 : 3,
    } as WidgetSpec['layout']);

  if (config.kind === 'line') {
    return {
      id,
      type: 'line',
      title,
      dataQuery: {
        dimensions: [{ ref: config.granularity }],
        metrics: config.metrics.map((ref) => ({ ref })),
        filters: [],
        aggregation: {},
        time: { mode: 'series', range: config.window },
      },
      visualization: { kind: 'line', dualAxis: config.dualAxis },
      layout,
    };
  }

  if (config.kind === 'scatter') {
    // X, Y and the optional size metric, in that order.
    const metrics = config.metrics.slice(0, 3);
    return {
      id,
      type: 'scatter',
      title,
      dataQuery: {
        dimensions: [{ ref: config.dimension }],
        metrics: metrics.map((ref) => ({ ref })),
        filters: [],
        // Ranked by the Y metric: the points kept are the ones that matter on
        // the axis the user is reading.
        aggregation: {
          topN: {
            n: config.topN,
            by: metrics[1] ?? metrics[0],
            direction: 'desc',
            includeOthers: false,
          },
        },
        time: { mode: 'latest' },
      },
      visualization: { kind: 'scatter' },
      layout,
    };
  }

  const partToWhole = isPartToWhole(config.kind);
  const metrics = partToWhole ? config.metrics.slice(0, 1) : config.metrics;
  return {
    id,
    type: partToWhole ? 'pie' : 'bars',
    title,
    dataQuery: {
      dimensions: [{ ref: config.dimension }],
      metrics: metrics.map((ref) => ({ ref })),
      filters: [],
      aggregation: {
        topN: {
          n: config.topN,
          by: metrics[0],
          direction: 'desc',
          // Only a part-to-whole chart needs the remainder to close the total.
          includeOthers: partToWhole,
        },
      },
      time: { mode: 'latest' },
    },
    visualization: partToWhole
      ? { kind: 'pie', variant: config.kind === 'pie' ? 'pie' : 'donut' }
      : { kind: 'bars' },
    layout,
  };
}

/** Recovers the config from a built spec, so the edit dialog opens pre-filled. */
export function readChartConfig(widget: WidgetSpec): ChartConfig {
  const q = (widget.dataQuery ?? {}) as {
    dimensions?: Array<{ ref: string }>;
    metrics?: Array<{ ref: string }>;
    time?: { range?: string };
    aggregation?: { topN?: { n?: number } };
  };
  const viz = (widget.visualization ?? {}) as { dualAxis?: boolean; variant?: string };
  const dimRef = q.dimensions?.[0]?.ref ?? 'marca';
  const isTime = (GRANULARITIES as readonly string[]).includes(dimRef);

  const kind: ChartKind =
    widget.type === 'pie'
      ? viz.variant === 'pie'
        ? 'pie'
        : 'donut'
      : widget.type === 'bars'
        ? 'bars'
        : widget.type === 'scatter'
          ? 'scatter'
          : 'line';

  const base = defaultChartConfig(kind);
  const range = q.time?.range;
  return {
    ...base,
    metrics: (q.metrics ?? []).map((m) => m.ref),
    dimension: isTime ? base.dimension : dimRef,
    granularity: isTime ? (dimRef as Granularity) : base.granularity,
    window: (TIME_WINDOWS as readonly string[]).includes(range ?? '')
      ? (range as TimeWindow)
      : base.window,
    topN: q.aggregation?.topN?.n ?? base.topN,
    dualAxis: viz.dualAxis === true,
    title: widget.title ?? '',
  };
}
