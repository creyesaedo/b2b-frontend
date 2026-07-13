'use client';

import type { ResultColumn, ResultSet } from '@/lib/engine/types';
import { formatCell, type CellFormatOptions } from '@/lib/engine/format';

interface ColorRule {
  metric?: string;
  scale?: string;
  center?: number;
}

/**
 * Ordered top-N list: rank #, the dimension, then each metric column.
 * `visualization.colorRule` (diverging) colors a metric by its sign — used by
 * "Top categorías por crecimiento" to read growth vs decline at a glance.
 */
export function RankingWidget({
  resultSet,
  visualization,
  fmt,
}: {
  resultSet: ResultSet;
  visualization: Record<string, unknown>;
  fmt: CellFormatOptions;
}) {
  const dimCols = resultSet.columns.filter((c) => c.role === 'dimension');
  const metricCols = resultSet.columns.filter((c) => c.role === 'metric');
  const colorRule = (visualization.colorRule ?? {}) as ColorRule;

  if (resultSet.rows.length === 0) {
    return <p className="flex h-full items-center justify-center text-sm text-gray-400">—</p>;
  }

  const divergingClass = (col: ResultColumn, value: unknown): string => {
    if (colorRule.scale !== 'diverging' || col.semanticRef !== colorRule.metric) return '';
    if (typeof value !== 'number') return '';
    const center = colorRule.center ?? 0;
    if (value > center) return 'text-emerald-600 dark:text-emerald-400 font-medium';
    if (value < center) return 'text-red-600 dark:text-red-400 font-medium';
    return '';
  };

  return (
    <div className="h-full overflow-auto">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-white text-xs text-gray-500 dark:bg-gray-900 dark:text-gray-400">
          <tr>
            <th className="py-1.5 pr-2 font-medium">#</th>
            {dimCols.map((c) => (
              <th key={c.name} className="py-1.5 pr-3 font-medium">
                {c.label}
              </th>
            ))}
            {metricCols.map((c) => (
              <th key={c.name} className="py-1.5 pl-3 text-right font-medium">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {resultSet.rows.map((row, i) => (
            <tr key={i}>
              <td className="py-1.5 pr-2 tabular-nums text-gray-400">{i + 1}</td>
              {dimCols.map((c) => (
                <td
                  key={c.name}
                  className="max-w-52 truncate py-1.5 pr-3 text-gray-800 dark:text-gray-200"
                  title={String(row[c.name] ?? '')}
                >
                  {formatCell(c, row[c.name], fmt)}
                </td>
              ))}
              {metricCols.map((c) => (
                <td
                  key={c.name}
                  className={`py-1.5 pl-3 text-right tabular-nums text-gray-600 dark:text-gray-300 ${divergingClass(c, row[c.name])}`}
                >
                  {formatCell(c, row[c.name], fmt)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
