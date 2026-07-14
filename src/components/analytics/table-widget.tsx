'use client';

import type { ResultSet } from '@/lib/engine/types';
import { formatCell, type CellFormatOptions } from '@/lib/engine/format';

/**
 * Plain data table over every visible ResultSet column (dimensions + metrics;
 * derived `__prev`/`__delta_pct` columns are skipped for compactness).
 */
export function TableWidget({
  resultSet,
  fmt,
}: {
  resultSet: ResultSet;
  fmt: CellFormatOptions;
}) {
  const cols = resultSet.columns.filter((c) => c.role !== 'derived');

  if (resultSet.rows.length === 0) {
    return <p className="flex h-full items-center justify-center text-sm text-gray-400">—</p>;
  }

  return (
    <div className="widget-no-drag h-full cursor-auto overflow-auto">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-white text-xs text-gray-500 dark:bg-gray-900 dark:text-gray-400">
          <tr>
            {cols.map((c) => (
              <th
                key={c.name}
                className={`py-1.5 font-medium ${c.role === 'metric' ? 'pl-3 text-right' : 'pr-3'}`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {resultSet.rows.map((row, i) => (
            <tr key={i}>
              {cols.map((c) => (
                <td
                  key={c.name}
                  className={
                    c.role === 'metric'
                      ? 'py-1.5 pl-3 text-right tabular-nums text-gray-600 dark:text-gray-300'
                      : 'max-w-52 truncate py-1.5 pr-3 text-gray-800 dark:text-gray-200'
                  }
                  title={c.role === 'metric' ? undefined : String(row[c.name] ?? '')}
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
