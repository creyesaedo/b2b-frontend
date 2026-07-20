'use client';

import {
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import type { ResultColumn, ResultSet } from '@/lib/engine/types';
import { formatCell, type CellFormatOptions } from '@/lib/engine/format';

/**
 * Relationship between two metrics: one point per category, X = first metric,
 * Y = second, and an optional third metric sizing the bubble.
 *
 * This is the honest answer to "two measures of very different scale" — each
 * measure gets its OWN axis in its own dimension, instead of stacking two y
 * scales on one time axis, where the crossing point is an artifact of scaling.
 */
export function ScatterWidget({
  resultSet,
  fmt,
}: {
  resultSet: ResultSet;
  fmt: CellFormatOptions;
}) {
  const dimCol = resultSet.columns.find((c) => c.role === 'dimension');
  const metricCols = resultSet.columns.filter((c) => c.role === 'metric');
  const [xCol, yCol, sizeCol] = metricCols;

  if (!dimCol || !xCol || !yCol || resultSet.rows.length === 0) {
    return <p className="flex h-full items-center justify-center text-sm text-gray-400">—</p>;
  }

  const compact = (v: number) =>
    new Intl.NumberFormat(fmt.locale, { notation: 'compact', maximumFractionDigits: 1 }).format(v);

  return (
    <div className="h-full min-h-56 text-gray-500 dark:text-gray-400">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 12, bottom: 16, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.12} />
          <XAxis
            type="number"
            dataKey={xCol.name}
            name={xCol.label}
            tickFormatter={compact}
            tick={{ fill: 'currentColor', fontSize: 11 }}
            stroke="currentColor"
            strokeOpacity={0.2}
            // The axis label is what tells the reader which measure this is.
            label={{
              value: xCol.label,
              position: 'insideBottom',
              offset: -8,
              fill: 'currentColor',
              fontSize: 11,
            }}
          />
          <YAxis
            type="number"
            dataKey={yCol.name}
            name={yCol.label}
            tickFormatter={compact}
            width={52}
            tick={{ fill: 'currentColor', fontSize: 11 }}
            stroke="currentColor"
            strokeOpacity={0.2}
            label={{
              value: yCol.label,
              angle: -90,
              position: 'insideLeft',
              fill: 'currentColor',
              fontSize: 11,
            }}
          />
          {sizeCol && (
            <ZAxis type="number" dataKey={sizeCol.name} range={[40, 400]} name={sizeCol.label} />
          )}
          <Tooltip
            cursor={{ strokeDasharray: '3 3', stroke: 'currentColor', strokeOpacity: 0.3 }}
            contentStyle={{ fontSize: 12 }}
            formatter={(value: number, name: string) => {
              const col = resultSet.columns.find((c) => c.label === name) as
                | ResultColumn
                | undefined;
              return [col ? formatCell(col, value, fmt) : value, name];
            }}
            // Name the point itself — identity never rests on position alone.
            labelFormatter={() => ''}
            itemSorter={() => 0}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as Record<string, string | number | null>;
              return (
                <div className="rounded-lg border border-gray-200 bg-white p-2 text-xs shadow-sm dark:border-gray-700 dark:bg-gray-900">
                  <p className="mb-1 font-medium text-gray-800 dark:text-gray-100">
                    {String(row[dimCol.name])}
                  </p>
                  {[xCol, yCol, ...(sizeCol ? [sizeCol] : [])].map((c) => (
                    <p key={c.name} className="text-gray-600 dark:text-gray-300">
                      {c.label}: {formatCell(c, row[c.name] as number, fmt)}
                    </p>
                  ))}
                </div>
              );
            }}
          />
          <Scatter data={resultSet.rows} fill="#2a78d6" isAnimationActive={false}>
            {resultSet.rows.map((row, i) => (
              <Cell
                key={i}
                fill="#2a78d6"
                fillOpacity={0.65}
                // 2px surface ring so overlapping points stay countable.
                className="stroke-white dark:stroke-gray-900"
                strokeWidth={2}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
