'use client';

import type { Insight, ResolvedWidget, WidgetSpec } from '@/lib/engine/types';
import type { CellFormatOptions } from '@/lib/engine/format';
import { WidgetFrame } from './widget-frame';
import { KpiWidget } from './kpi-widget';
import { LineWidget } from './line-widget';
import { BarsWidget } from './bars-widget';
import { RankingWidget } from './ranking-widget';
import { TableWidget } from './table-widget';
import { MapWidget } from './map-widget';
import { PieWidget } from './pie-widget';
import { InsightsWidget } from './insights-widget';

/**
 * One widget: frame + type-specific body. Placement/drag live in
 * DashboardCanvas (react-grid-layout) — this component only fills its cell.
 */
export function WidgetRenderer({
  widget,
  resolved,
  insights,
  insightsLoading,
  fmt,
  onRemove,
  removeLabel,
  onConfigure,
  configureLabel,
}: {
  widget: WidgetSpec;
  resolved?: ResolvedWidget;
  insights: Insight[];
  insightsLoading: boolean;
  fmt: CellFormatOptions;
  /** Present for user-added widgets: removes the widget from the dashboard. */
  onRemove?: () => void;
  removeLabel?: string;
  /** Present for configurable widgets: re-binds the widget's data. */
  onConfigure?: () => void;
  configureLabel?: string;
}) {
  return (
    <WidgetFrame
      title={widget.title}
      error={resolved?.error}
      quality={resolved?.resultSet?.quality}
      onRemove={onRemove}
      removeLabel={removeLabel}
      onConfigure={onConfigure}
      configureLabel={configureLabel}
    >
      <WidgetBody
        widget={widget}
        resolved={resolved}
        insights={insights}
        insightsLoading={insightsLoading}
        fmt={fmt}
      />
    </WidgetFrame>
  );
}

function WidgetBody({
  widget,
  resolved,
  insights,
  insightsLoading,
  fmt,
}: {
  widget: WidgetSpec;
  resolved?: ResolvedWidget;
  insights: Insight[];
  insightsLoading: boolean;
  fmt: CellFormatOptions;
}) {
  if (widget.type === 'insight_card') {
    return <InsightsWidget insights={insights} isLoading={insightsLoading} />;
  }

  const resultSet = resolved?.resultSet;
  if (!resultSet) {
    return <p className="flex h-full items-center justify-center text-sm text-gray-400">—</p>;
  }

  switch (widget.type) {
    case 'kpi':
      return <KpiWidget resultSet={resultSet} visualization={widget.visualization} fmt={fmt} />;
    case 'line':
      return <LineWidget resultSet={resultSet} visualization={widget.visualization} fmt={fmt} />;
    case 'bars':
      return <BarsWidget resultSet={resultSet} fmt={fmt} />;
    case 'pie':
      return <PieWidget resultSet={resultSet} visualization={widget.visualization} fmt={fmt} />;
    case 'ranking':
      return <RankingWidget resultSet={resultSet} visualization={widget.visualization} fmt={fmt} />;
    case 'table':
      return <TableWidget resultSet={resultSet} fmt={fmt} />;
    case 'map':
      return <MapWidget resultSet={resultSet} fmt={fmt} />;
    default:
      return <TableWidget resultSet={resultSet} fmt={fmt} />;
  }
}
