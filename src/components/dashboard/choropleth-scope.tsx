'use client';

import type { ReactNode } from 'react';
import { CHORO_DARK, CHORO_LIGHT, NODATA_DARK, NODATA_LIGHT } from '@/lib/choropleth';

// Defines the `--choro-N` / `--choro-nodata` custom properties for everything
// inside it (map fills + legend swatches). The `.dark` override swaps the ramp
// for the dark surface, so colors are theme-aware without any JS observer.
const STYLE = `
  .choro-scope {
    ${CHORO_LIGHT.map((c, i) => `--choro-${i}:${c};`).join('')}
    --choro-nodata:${NODATA_LIGHT};
  }
  .dark .choro-scope {
    ${CHORO_DARK.map((c, i) => `--choro-${i}:${c};`).join('')}
    --choro-nodata:${NODATA_DARK};
  }
`;

/** Wraps children in the choropleth CSS-variable scope. */
export function ChoroplethScope({ children }: { children: ReactNode }) {
  return (
    <div className="choro-scope">
      <style>{STYLE}</style>
      {children}
    </div>
  );
}
