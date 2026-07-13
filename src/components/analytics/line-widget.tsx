'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ResultColumn, ResultSet } from '@/lib/engine/types';
import { formatCell, type CellFormatOptions } from '@/lib/engine/format';

const COLORS = ['#2563eb', '#059669', '#d97706', '#dc2626'];

/**
 * Time-series widget: one line per metric column, over the `semana`/`mes`
 * bucket. `visualization.dualAxis` puts the second metric on a right axis
 * (price vs count share no scale). Recharts directly, mirroring history-chart.
 */
export function LineWidget({
  resultSet,
  visualization,
  fmt,
}: {
  resultSet: ResultSet;
  visualization: Record<string, unknown>;
  fmt: CellFormatOptions;
}) {
  const timeCol = resultSet.columns.find((c) => c.role === 'time');
  const metricCols = resultSet.columns.filter((c) => c.role === 'metric');
  if (!timeCol || metricCols.length === 0 || resultSet.rows.length === 0) {
    return <Empty />;
  }

  const dualAxis = visualization.dualAxis === true && metricCols.length > 1;
  const data = [...resultSet.rows].sort((a, b) =>
    String(a[timeCol.name]).localeCompare(String(b[timeCol.name])),
  );

  const axisProps = {
    tick: { fill: 'currentColor', fontSize: 11 },
    stroke: 'currentColor',
    strokeOpacity: 0.2,
  } as const;
  const shortFmt = (col: ResultColumn) => (v: number) => compact(col, v, fmt);

  return (
    <div className="h-full min-h-56 text-gray-500 dark:text-gray-400">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 4 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="currentColor"
            strokeOpacity={0.12}
            vertical={false}
          />
          <XAxis
            dataKey={timeCol.name}
            tickFormatter={(v: string) => String(v).slice(5)}
            {...axisProps}
          />
          <YAxis yAxisId="left" tickFormatter={shortFmt(metricCols[0])} width={52} {...axisProps} />
          {dualAxis && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={shortFmt(metricCols[1])}
              width={44}
              {...axisProps}
            />
          )}
          <Tooltip content={<LineTooltip cols={metricCols} fmt={fmt} />} />
          {metricCols.map((col, i) => (
            <Line
              key={col.name}
              yAxisId={dualAxis && i > 0 ? 'right' : 'left'}
              type="monotone"
              dataKey={col.name}
              name={col.label}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3, fill: COLORS[i % COLORS.length], strokeWidth: 0 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Compact axis labels: 39.9K instead of a full currency string. */
function compact(col: ResultColumn, v: number, fmt: CellFormatOptions): string {
  if (col.format === 'percent') return `${(v * 100).toFixed(0)}%`;
  return new Intl.NumberFormat(fmt.locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(v);
}

function LineTooltip({
  active,
  payload,
  label,
  cols,
  fmt,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string }>;
  label?: string;
  cols: ResultColumn[];
  fmt: CellFormatOptions;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-md dark:border-gray-700 dark:bg-gray-800">
      <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
      {payload.map((p) => {
        const col = cols.find((c) => c.name === p.dataKey);
        return (
          <p key={p.dataKey} className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
            {col?.label}: {col ? formatCell(col, p.value, fmt) : p.value}
          </p>
        );
      })}
    </div>
  );
}

function Empty() {
  return (
    <p className="flex h-full items-center justify-center text-sm text-gray-400">—</p>
  );
}
