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
import { InsightsWidget } from './insights-widget';

/**
 * 12-column dashboard canvas mirroring the engine's grid model (layout
 * x/y/w/h). Placement is explicit on md+ via CSS custom properties (so the
 * 2×2 KPI block can sit beside the tall map); on mobile widgets stack.
 */
export function DashboardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:auto-rows-[5.5rem]">
      {children}
    </div>
  );
}

export function WidgetRenderer({
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
  const { x, y, w, h } = widget.layout;
  const placement = {
    '--gc': `${x + 1} / span ${w}`,
    '--gr': `${y + 1} / span ${h}`,
  } as React.CSSProperties;

  return (
    <div
      style={placement}
      className="min-h-40 md:min-h-0 md:[grid-column:var(--gc)] md:[grid-row:var(--gr)]"
    >
      <WidgetFrame
        title={widget.title}
        error={resolved?.error}
        quality={resolved?.resultSet?.quality}
      >
        <WidgetBody
          widget={widget}
          resolved={resolved}
          insights={insights}
          insightsLoading={insightsLoading}
          fmt={fmt}
        />
      </WidgetFrame>
    </div>
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
