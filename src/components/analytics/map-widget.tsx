'use client';

import { useMemo, useState } from 'react';
import { MarketMap, type HoverInfo } from '@/components/dashboard/market-map';
import { ChoroplethScope } from '@/components/dashboard/choropleth-scope';
import { buildChoropleth } from '@/lib/choropleth';
import { siteName } from '@/lib/ml-sites';
import type { ResultSet } from '@/lib/engine/types';
import { formatCell, type CellFormatOptions } from '@/lib/engine/format';

/**
 * Regional choropleth over a `pais`-dimension ResultSet (one row per ML site),
 * reusing the dashboard's MarketMap. First metric column colors the map.
 */
export function MapWidget({
  resultSet,
  fmt,
}: {
  resultSet: ResultSet;
  fmt: CellFormatOptions;
}) {
  const [hover, setHover] = useState<HoverInfo | null>(null);

  const dimCol = resultSet.columns.find((c) => c.role === 'dimension');
  const metricCol = resultSet.columns.find((c) => c.role === 'metric');

  const valueByCode = useMemo(() => {
    const map = new Map<string, number | null>();
    if (!dimCol || !metricCol) return map;
    for (const row of resultSet.rows) {
      const code = row[dimCol.name];
      const value = row[metricCol.name];
      if (typeof code === 'string') {
        map.set(code, typeof value === 'number' ? value : null);
      }
    }
    return map;
  }, [resultSet, dimCol, metricCol]);

  const choropleth = useMemo(
    () => buildChoropleth([...valueByCode.values()]),
    [valueByCode],
  );

  if (!dimCol || !metricCol || valueByCode.size === 0) {
    return <p className="flex h-full items-center justify-center text-sm text-gray-400">—</p>;
  }

  // Metrics on the map are cross-country (unit usd/none) — never local currency.
  const mapFmt: CellFormatOptions = { ...fmt, localCurrency: 'USD' };

  return (
    <ChoroplethScope className="relative h-full min-h-64">
      <MarketMap valueByCode={valueByCode} choropleth={choropleth} onHover={setHover} />
      {/* Hover readout */}
      {hover && (
        <div className="pointer-events-none absolute left-2 top-1 rounded-lg border border-gray-200 bg-white/95 px-2.5 py-1.5 text-xs shadow-sm dark:border-gray-700 dark:bg-gray-800/95">
          <p className="font-medium text-gray-900 dark:text-gray-100">{siteName(hover.code)}</p>
          <p className="text-gray-600 dark:text-gray-300">
            {formatCell(metricCol, hover.value, mapFmt)}
          </p>
        </div>
      )}
      {/* Min → max legend */}
      {!choropleth.empty && (
        <div className="pointer-events-none absolute bottom-1 left-2 flex items-center gap-2 text-[11px] tabular-nums text-gray-500 dark:text-gray-400">
          <span>{formatCell(metricCol, choropleth.min, mapFmt)}</span>
          <span className="flex h-1.5 w-20 overflow-hidden rounded-full ring-1 ring-black/5 dark:ring-white/10">
            {Array.from({ length: choropleth.steps }).map((_, i) => (
              <span key={i} className="flex-1" style={{ backgroundColor: `var(--choro-${i})` }} />
            ))}
          </span>
          <span>{formatCell(metricCol, choropleth.max, mapFmt)}</span>
        </div>
      )}
    </ChoroplethScope>
  );
}
