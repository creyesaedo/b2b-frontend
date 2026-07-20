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

// ── Custom line chart (user binds its own data) ──────────────────────────────

/** Ids of custom line widgets, so the frame can offer the "configure" control. */
const CUSTOM_LINE_PREFIX = 'added:custom_line:';

export const isConfigurableWidget = (id: string): boolean =>
  id.startsWith(CUSTOM_LINE_PREFIX);

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

/** Max series on one chart — beyond this a line chart stops being readable. */
export const MAX_LINE_METRICS = 4;

/** What the user binds to a custom line chart. */
export interface LineWidgetConfig {
  /** Semantic metric refs plotted as series (1..MAX_LINE_METRICS). */
  metrics: string[];
  window: TimeWindow;
  granularity: Granularity;
  /** Second Y axis — useful when scales differ wildly (price vs. counts). */
  dualAxis: boolean;
  /** User-provided title; falls back to the joined metric labels. */
  title: string;
}

export const DEFAULT_LINE_CONFIG: LineWidgetConfig = {
  metrics: [],
  window: 'last_12_weeks',
  granularity: 'semana',
  dualAxis: false,
  title: '',
};

/**
 * Builds (or rebuilds) a custom line WidgetSpec from a user config. Passing an
 * existing `id`/`layout` edits in place — the widget keeps its position and the
 * user only re-binds the data.
 */
export function buildLineWidget(
  config: LineWidgetConfig,
  fallbackTitle: string,
  placement: { id?: string; layout?: WidgetSpec['layout']; placeAtY?: number },
): WidgetSpec {
  return {
    id: placement.id ?? `${CUSTOM_LINE_PREFIX}${Date.now()}`,
    type: 'line',
    title: config.title.trim() || fallbackTitle,
    dataQuery: {
      dimensions: [{ ref: config.granularity }],
      metrics: config.metrics.map((ref) => ({ ref })),
      filters: [],
      aggregation: {},
      time: { mode: 'series', range: config.window },
    },
    visualization: { kind: 'line', dualAxis: config.dualAxis },
    layout: placement.layout ?? { x: 0, y: placement.placeAtY ?? 0, w: 6, h: 3 },
  };
}

/** Recovers the config from a built spec, so the edit dialog opens pre-filled. */
export function readLineConfig(widget: WidgetSpec): LineWidgetConfig {
  const q = (widget.dataQuery ?? {}) as {
    dimensions?: Array<{ ref: string }>;
    metrics?: Array<{ ref: string }>;
    time?: { range?: string };
  };
  const viz = widget.visualization as { dualAxis?: boolean };
  const granularity = q.dimensions?.[0]?.ref;
  const range = q.time?.range;
  return {
    metrics: (q.metrics ?? []).map((m) => m.ref),
    window: (TIME_WINDOWS as readonly string[]).includes(range ?? '')
      ? (range as TimeWindow)
      : 'last_12_weeks',
    granularity: (GRANULARITIES as readonly string[]).includes(granularity ?? '')
      ? (granularity as Granularity)
      : 'semana',
    dualAxis: viz?.dualAxis === true,
    title: widget.title ?? '',
  };
}
