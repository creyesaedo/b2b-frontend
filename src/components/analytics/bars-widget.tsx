'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ResultSet } from '@/lib/engine/types';
import { formatCell, type CellFormatOptions } from '@/lib/engine/format';

/** Categorical bars: first dimension on X, first metric as bar height. */
export function BarsWidget({
  resultSet,
  fmt,
}: {
  resultSet: ResultSet;
  fmt: CellFormatOptions;
}) {
  const dimCol = resultSet.columns.find((c) => c.role === 'dimension');
  const metricCol = resultSet.columns.find((c) => c.role === 'metric');
  if (!dimCol || !metricCol || resultSet.rows.length === 0) {
    return <p className="flex h-full items-center justify-center text-sm text-gray-400">—</p>;
  }

  return (
    <div className="h-full min-h-56 text-gray-500 dark:text-gray-400">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={resultSet.rows} margin={{ top: 8, right: 8, bottom: 8, left: 4 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="currentColor"
            strokeOpacity={0.12}
            vertical={false}
          />
          <XAxis
            dataKey={dimCol.name}
            tick={{ fill: 'currentColor', fontSize: 11 }}
            stroke="currentColor"
            strokeOpacity={0.2}
          />
          <YAxis
            tickFormatter={(v: number) =>
              new Intl.NumberFormat(fmt.locale, {
                notation: 'compact',
                maximumFractionDigits: 1,
              }).format(v)
            }
            width={52}
            tick={{ fill: 'currentColor', fontSize: 11 }}
            stroke="currentColor"
            strokeOpacity={0.2}
          />
          <Tooltip
            cursor={{ fill: 'currentColor', opacity: 0.06 }}
            formatter={(v: number) => formatCell(metricCol, v, fmt)}
          />
          <Bar dataKey={metricCol.name} name={metricCol.label} fill="#2563eb" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
