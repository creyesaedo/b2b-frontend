'use client';

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { ResultSet } from '@/lib/engine/types';
import { formatCell, type CellFormatOptions } from '@/lib/engine/format';

/** Label of the engine's `topN.includeOthers` remainder bucket (sql-builder.ts). */
const OTHERS_LABEL = 'Otros';

/**
 * Part-to-whole: one metric split across one category. `visualization.variant`
 * picks donut (default) or pie — the data contract is identical, which is why
 * the engine has a single `pie` widget type.
 *
 * Color: the categorical slots come from a validated palette (worst adjacent
 * CVD ΔE 24.2 light / 10.3 dark). Two obligations follow from that validation
 * and are implemented here: slices carry DIRECT % labels (light-mode aqua and
 * yellow fall below 3:1 on the surface — the relief rule) and are separated by
 * a 2px surface gap (the dark set sits in the CVD floor band, so identity never
 * rests on hue alone). The remainder bucket is deliberately neutral: it is a
 * leftover, not an entity.
 */
const SLOT_COUNT = 6;

export function PieWidget({
  resultSet,
  visualization,
  fmt,
}: {
  resultSet: ResultSet;
  visualization: Record<string, unknown>;
  fmt: CellFormatOptions;
}) {
  const dimCol = resultSet.columns.find((c) => c.role === 'dimension');
  const metricCol = resultSet.columns.find((c) => c.role === 'metric');
  if (!dimCol || !metricCol || resultSet.rows.length === 0) {
    return <p className="flex h-full items-center justify-center text-sm text-gray-400">—</p>;
  }

  const isPie = visualization?.variant === 'pie';
  const rows = resultSet.rows.filter((r) => Number(r[metricCol.name]) > 0);
  if (rows.length === 0) {
    return <p className="flex h-full items-center justify-center text-sm text-gray-400">—</p>;
  }

  const colorOf = (row: (typeof rows)[number], i: number) =>
    String(row[dimCol.name]) === OTHERS_LABEL
      ? 'var(--pie-other)'
      : `var(--pie-${(i % SLOT_COUNT) + 1})`;

  return (
    <div
      className="h-full min-h-56 text-gray-500 [--pie-1:#2a78d6] [--pie-2:#1baf7a] [--pie-3:#eda100] [--pie-4:#008300] [--pie-5:#4a3aa7] [--pie-6:#e34948] [--pie-other:#8b8b86] dark:text-gray-400 dark:[--pie-1:#3987e5] dark:[--pie-2:#199e70] dark:[--pie-3:#c98500] dark:[--pie-4:#008300] dark:[--pie-5:#9085e9] dark:[--pie-6:#e66767] dark:[--pie-other:#6f6f6a]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <Pie
            data={rows}
            dataKey={metricCol.name}
            nameKey={dimCol.name}
            innerRadius={isPie ? 0 : '55%'}
            outerRadius="80%"
            // 2px surface gap: the secondary encoding the palette validation requires.
            paddingAngle={2}
            className="stroke-white dark:stroke-gray-900"
            strokeWidth={2}
            isAnimationActive={false}
            label={({ percent }: { percent?: number }) =>
              percent && percent >= 0.04 ? `${Math.round(percent * 100)}%` : ''
            }
            labelLine={false}
          >
            {rows.map((row, i) => (
              <Cell key={String(row[dimCol.name])} fill={colorOf(row, i)} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: number) => formatCell(metricCol, v, fmt)}
            contentStyle={{ fontSize: 12 }}
          />
          <Legend
            verticalAlign="bottom"
            height={28}
            iconSize={9}
            // Identity is never color-alone: every slice is named in the legend.
            formatter={(value: string) => (
              <span className="text-xs text-gray-600 dark:text-gray-300">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
