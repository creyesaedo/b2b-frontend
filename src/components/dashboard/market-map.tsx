'use client';

import { useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
// Local topojson (no runtime fetch). Whole world; we just frame Latin America.
import geoData from 'world-atlas/countries-110m.json';
import type { Choropleth } from '@/lib/choropleth';

// ISO 3166-1 numeric (as used by world-atlas) → MercadoLibre site code.
const ML_BY_NUMERIC: Record<string, string> = {
  '032': 'MLA', // Argentina
  '076': 'MLB', // Brazil
  '152': 'MLC', // Chile
  '170': 'MCO', // Colombia
  '218': 'MEC', // Ecuador
  '068': 'MBO', // Bolivia
  '484': 'MLM', // Mexico
  '600': 'MPY', // Paraguay
  '604': 'MPE', // Peru
  '858': 'MLU', // Uruguay
  '862': 'MLV', // Venezuela
  '320': 'MGT', // Guatemala
  '591': 'MPA', // Panama
  '214': 'MRD', // Dominican Republic
};

const STROKE = '#ffffff';
// Highlight strokes deliberately leave the blue family so they read against
// every step of the choropleth ramp.
const SELECTED_STROKE = '#ea580c'; // orange-600
const COMPARE_STROKE = '#d946ef'; // fuchsia-500

export interface HoverInfo {
  code: string;
  value: number | null;
}

interface MarketMapProps {
  /** Metric value per ML site code for the active view (may be a scrubber slice). */
  valueByCode: Map<string, number | null>;
  choropleth: Choropleth;
  /** ML code currently open in the detail panel. */
  selected?: string | null;
  /** ML codes picked for comparison (compare mode). */
  multiSelected?: string[];
  onSelect?: (code: string) => void;
  /** Bubbles the hovered country up so the page can render a readout overlay. */
  onHover?: (info: HoverInfo | null) => void;
}

/**
 * Choropleth of the Latin-American MercadoLibre sites. Renders as a bare SVG that
 * fills its positioned parent; the dashboard frames it full-bleed and floats its
 * controls on top. Fills reference `--choro-*` vars from an ancestor
 * <ChoroplethScope>, so colors stay theme-aware without any JS observer.
 */
export function MarketMap({
  valueByCode,
  choropleth,
  selected,
  multiSelected = [],
  onSelect,
  onHover,
}: MarketMapProps) {
  // Mirrored locally (besides bubbling via onHover) so the paint-order sort
  // below can move the hovered country on top of its neighbors.
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);

  const fillFor = (code: string | undefined): string => {
    if (!code || !valueByCode.has(code)) return 'var(--choro-nodata)';
    const bucket = choropleth.bucketOf(valueByCode.get(code));
    return bucket < 0 ? 'var(--choro-nodata)' : `var(--choro-${bucket})`;
  };

  const clearHover = () => {
    setHoveredCode(null);
    onHover?.(null);
  };

  return (
    // select-none + container-level clear keep hover state sane even when a
    // text-selection drag sweeps across the map (mouseleave events get lost).
    <div className="h-full w-full select-none" onMouseLeave={clearHover}>
    <ComposableMap
      projection="geoMercator"
      // Framed so the whole ML footprint fits: ~34.5°N (all of Mexico, incl.
      // Baja California) down to ~-56.7° (Chile complete, incl. Cape Horn).
      projectionConfig={{ center: [-73, -16], scale: 335 }}
      width={640}
      height={620}
      style={{ width: '100%', height: '100%' }}
    >
      <Geographies geography={geoData}>
        {({ geographies }) => {
          // SVG has no z-index: whoever paints last owns the shared border.
          // Sort highlighted countries to the end so their outline stays whole
          // instead of being half-covered by neighbors drawn after them.
          const highlightRank = (geo: (typeof geographies)[number]): number => {
            const c = ML_BY_NUMERIC[String(geo.id).padStart(3, '0')];
            if (!c) return 0;
            if (c === hoveredCode) return 3; // hover feedback always wins
            if (c === selected) return 2;
            return multiSelected.includes(c) ? 1 : 0;
          };

          return [...geographies]
            .sort((a, b) => highlightRank(a) - highlightRank(b))
            .map((geo) => {
            const numeric = String(geo.id).padStart(3, '0');
            const code = ML_BY_NUMERIC[numeric];
            const isActive = !!code && valueByCode.has(code);
            const isSelected = isActive && code === selected;
            const isCompared = isActive && !!code && multiSelected.includes(code);
            const isHovered = isActive && code === hoveredCode;
            const stroke = isSelected
              ? SELECTED_STROKE
              : isCompared
                ? COMPARE_STROKE
                : isHovered
                  ? SELECTED_STROKE
                  : STROKE;
            const strokeWidth = isSelected || isCompared ? 2 : isHovered ? 1.2 : 0.5;
            // Highlighted countries get a colored glow so the selection reads
            // even where the stroke sits against a similar fill.
            const baseFilter = isSelected
              ? 'drop-shadow(0 0 4px rgb(234 88 12 / 0.55)) drop-shadow(0 2px 4px rgb(15 23 42 / 0.2))'
              : isCompared
                ? 'drop-shadow(0 0 4px rgb(217 70 239 / 0.55)) drop-shadow(0 2px 4px rgb(15 23 42 / 0.2))'
                : isHovered
                  ? 'drop-shadow(0 3px 6px rgb(15 23 42 / 0.25))'
                  : isActive
                    ? 'drop-shadow(0 1px 1.5px rgb(15 23 42 / 0.15))'
                    : undefined;
            // Single source of truth: hover looks come from our own hoveredCode
            // state, so react-simple-maps' internal hover flag (which can get
            // stuck when mouseleave is missed) never changes what users see.
            const paint = {
              fill: fillFor(code),
              stroke,
              strokeWidth,
              outline: 'none',
              cursor: isActive ? 'pointer' : 'default',
              pointerEvents: (isActive ? 'auto' : 'none') as 'auto' | 'none',
              transition: 'fill 0.2s ease, stroke 0.15s ease, filter 0.15s ease',
              filter: baseFilter,
            };

            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                onMouseEnter={
                  isActive
                    ? () => {
                        setHoveredCode(code!);
                        onHover?.({ code: code!, value: valueByCode.get(code!) ?? null });
                      }
                    : undefined
                }
                onMouseLeave={
                  isActive
                    ? () => {
                        setHoveredCode(null);
                        onHover?.(null);
                      }
                    : undefined
                }
                onClick={isActive ? () => onSelect?.(code!) : undefined}
                style={{
                  default: paint,
                  hover: paint,
                  pressed: { ...paint, stroke: SELECTED_STROKE, strokeWidth: 2 },
                }}
              />
            );
            });
        }}
      </Geographies>
    </ComposableMap>
    </div>
  );
}
