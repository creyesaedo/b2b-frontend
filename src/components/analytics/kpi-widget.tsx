'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';
import type { ResultSet } from '@/lib/engine/types';
import { formatCell, formatDelta, type CellFormatOptions } from '@/lib/engine/format';

/**
 * Single-number widget. In compare mode the engine ships `<metric>__prev` and
 * `<metric>__delta_pct` (WoW fraction) alongside the metric — rendered as a
 * colored delta badge when `visualization.showDelta` is set.
 */
export function KpiWidget({
  resultSet,
  visualization,
  fmt,
}: {
  resultSet: ResultSet;
  visualization: Record<string, unknown>;
  fmt: CellFormatOptions;
}) {
  const metricCol = resultSet.columns.find((c) => c.role === 'metric');
  const row = resultSet.rows[0];
  if (!metricCol || !row) {
    return <p className="py-4 text-center text-2xl font-bold text-gray-300">—</p>;
  }

  const value = row[metricCol.name];
  const showDelta = visualization.showDelta === true;
  const deltaRaw = row[`${metricCol.name}__delta_pct`];
  const delta = typeof deltaRaw === 'number' ? deltaRaw : null;

  return (
    <div className="flex h-full flex-col justify-center gap-1">
      <p className="truncate text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        {formatCell(metricCol, value, fmt)}
      </p>
      {showDelta && delta !== null && (
        <span
          className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
            delta >= 0
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
          }`}
        >
          {delta >= 0 ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {formatDelta(delta, fmt.locale)}
        </span>
      )}
    </div>
  );
}
