'use client';

import { Card, Metric, Text } from '@tremor/react';
import {
  Area,
  CartesianGrid,
  AreaChart as RAreaChart,
  Line,
  LineChart as RLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type ChartDatum = { date: string; price: number | null; ranking: number | null };

/**
 * Price/ranking history chart built on Recharts directly (not Tremor's
 * AreaChart/LineChart) so the data points are always rendered, not only on hover.
 * Axis/grid colors use `currentColor` so they follow the light/dark theme.
 */
export function HistoryChart({
  type,
  data,
  dataKey,
  color,
  valueFormatter,
}: {
  type: 'area' | 'line';
  data: ChartDatum[];
  dataKey: 'price' | 'ranking';
  color: string;
  valueFormatter: (v: number) => string;
}) {
  const dot = { r: 3.5, fill: color, stroke: color, strokeWidth: 0 };
  const activeDot = { r: 5, fill: color, stroke: '#fff', strokeWidth: 2 };
  const axisProps = {
    tick: { fill: 'currentColor', fontSize: 11 },
    stroke: 'currentColor',
    strokeOpacity: 0.2,
  } as const;

  // Size the Y axis to the widest tick label so currencies with many digits
  // (e.g. COP) are not clipped. ~6.5px per char at fontSize 11 + padding.
  const maxLabelLen = data.reduce((max, d) => {
    const v = d[dataKey];
    return v === null ? max : Math.max(max, valueFormatter(v).length);
  }, 0);
  const yAxisWidth = Math.max(56, Math.ceil(maxLabelLen * 6.5) + 16);

  return (
    <div className="mt-4 h-80 text-tremor-content dark:text-dark-tremor-content">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'area' ? (
          <RAreaChart data={data} margin={{ top: 8, right: 12, bottom: 56, left: 4 }}>
            <defs>
              <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.12} vertical={false} />
            <XAxis
              dataKey="date"
              interval={0}
              angle={-45}
              textAnchor="end"
              height={56}
              {...axisProps}
            />
            <YAxis tickFormatter={valueFormatter} width={yAxisWidth} {...axisProps} />
            <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${dataKey})`}
              dot={dot}
              activeDot={activeDot}
              isAnimationActive={false}
            />
          </RAreaChart>
        ) : (
          <RLineChart data={data} margin={{ top: 8, right: 12, bottom: 56, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.12} vertical={false} />
            <XAxis
              dataKey="date"
              interval={0}
              angle={-45}
              textAnchor="end"
              height={56}
              {...axisProps}
            />
            <YAxis
              tickFormatter={valueFormatter}
              width={yAxisWidth}
              domain={[1, 20]}
              ticks={[1, 5, 10, 15, 20]}
              reversed
              allowDecimals={false}
              {...axisProps}
            />
            <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={dot}
              activeDot={activeDot}
              isAnimationActive={false}
            />
          </RLineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

/** Compact, theme-aware tooltip matching the app's card styling. */
function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  valueFormatter: (v: number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-md dark:border-gray-700 dark:bg-gray-800">
      <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
      <p className="text-gray-600 dark:text-gray-300">{valueFormatter(payload[0].value)}</p>
    </div>
  );
}

export function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card className="!w-auto !px-4 !py-3 dark:!bg-gray-900">
      <Text className="text-xs">{label}</Text>
      <Metric className="mt-1 text-center text-lg">{value}</Metric>
    </Card>
  );
}
