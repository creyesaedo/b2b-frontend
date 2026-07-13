// Contracts of the dashboard-engine, consumed via the BFF (`/v1/ml/...`).
// Hand-mirrored from `dashboard-engine/src` (result-set.ts, widget-spec.types.ts,
// templates.data.ts, insight.types.ts) — keep in sync when the engine evolves.

// ── ResultSet (engine query/result-set.ts) ───────────────────────────────────

export type ColumnRole = 'dimension' | 'metric' | 'time' | 'derived';
export type MetricFormat = 'currency' | 'percent' | 'integer' | 'decimal' | 'index';

export interface ResultColumn {
  /** Column key in each row object. */
  name: string;
  /** The semantic ref this column materializes (dimension or metric name). */
  semanticRef: string;
  role: ColumnRole;
  type: 'string' | 'number' | 'boolean' | 'date';
  format?: MetricFormat;
  unit?: 'local' | 'usd' | 'none';
  label: string;
}

export type ResultRow = Record<string, string | number | boolean | null>;

export interface ResultMeta {
  snapshotWeek: string | null;
  timeMode: 'latest' | 'series' | 'compare';
  weeks: string[];
  effectiveFilters: Array<{
    dimension: string;
    operator: string;
    value: unknown;
    forced?: boolean;
  }>;
  rowCount: number;
  truncated: boolean;
  cached: boolean;
  elapsedMs: number;
}

export interface QualityNote {
  code:
    | 'metric_unavailable'
    | 'negative_deltas_clamped'
    | 'null_dimension_grouped'
    | 'row_limit_reached'
    | 'insufficient_history';
  message: string;
  detail?: unknown;
}

export interface ResultSet {
  columns: ResultColumn[];
  rows: ResultRow[];
  meta: ResultMeta;
  quality: QualityNote[];
}

// ── Widget / Dashboard specs (engine widgets/widget-spec.types.ts) ───────────

export type WidgetType =
  | 'kpi'
  | 'line'
  | 'bars'
  | 'table'
  | 'ranking'
  | 'map'
  | 'insight_card';

export interface WidgetLayout {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WidgetSpec {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  /** Semantic query (opaque here — the engine resolves it). */
  dataQuery?: Record<string, unknown>;
  /** Presentation config owned by this frontend (kind, showDelta, dualAxis…). */
  visualization: Record<string, unknown>;
  layout: WidgetLayout;
}

export interface DashboardSpec {
  id: string;
  title: string;
  description?: string;
  version: number;
  status: 'draft' | 'published';
  globalFilters: Array<{ dimension: string; operator: string; value: unknown }>;
  grid: { columns: number };
  widgets: WidgetSpec[];
  insights?: { detectors: string[]; thresholds: Record<string, number>; topK: number };
}

/** Per-widget resolution result (one broken widget never blanks the page). */
export interface ResolvedWidget {
  widgetId: string;
  type: string;
  resultSet: ResultSet | null;
  error: string | null;
}

export interface InstantiateResponse {
  spec: DashboardSpec;
  /** Present when instantiated with `resolve: true`. */
  dashboardId?: string;
  widgets?: ResolvedWidget[];
}

// ── Templates (engine templates.data.ts / templates.service.ts) ──────────────

export interface TemplateParameter {
  name: string;
  type: 'dimension_value' | 'time_range';
  dimension?: string;
  required: boolean;
  default?: string;
  description: string;
}

export interface TemplateSummary {
  id: string;
  label: string;
  icon: string;
  businessQuestion: string;
  version: number;
  parameters: TemplateParameter[];
}

// ── Insights (engine insights/insight.types.ts) ──────────────────────────────

export type DetectorName = 'cambio_significativo' | 'tendencia' | 'concentracion';

export interface Insight {
  id: string;
  detector: DetectorName;
  score: number;
  /** The exact numbers behind the sentence — auditable. */
  fact: Record<string, string | number | null>;
  /** Deterministic Spanish sentence rendered by the engine. */
  narrative: string;
  scope: { pais: string; categoria?: string };
  evidence: Record<string, unknown>;
}

export interface InsightsResponse {
  insights: Insight[];
  evaluated: number;
}
