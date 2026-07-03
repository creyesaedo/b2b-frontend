'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
// Local topojson (no runtime fetch). Whole world; we just frame Latin America.
import geoData from 'world-atlas/countries-110m.json';
import type { CountryMetric } from '@/lib/types';
import { formatMetric, type Choropleth } from '@/lib/choropleth';
import { siteName } from '@/lib/ml-sites';

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
const SELECTED_STROKE = '#1d4ed8'; // blue-700
const COMPARE_STROKE = '#7c3aed'; // violet-600

interface MarketMapProps {
  /** Metric value per ML site code for the active view (may be a scrubber slice). */
  valueByCode: Map<string, number | null>;
  choropleth: Choropleth;
  metric: CountryMetric;
  /** ML code currently open in the detail panel. */
  selected?: string | null;
  /** ML codes picked for comparison (compare mode). */
  multiSelected?: string[];
  onSelect?: (code: string) => void;
  locale?: string;
}

export function MarketMap({
  valueByCode,
  choropleth,
  metric,
  selected,
  multiSelected = [],
  onSelect,
  locale,
}: MarketMapProps) {
  const t = useTranslations('dashboard');
  const [hovered, setHovered] = useState<{ code: string; value: number | null } | null>(null);

  // Fills reference `--choro-*` vars provided by an ancestor <ChoroplethScope>.
  const fillFor = (code: string | undefined): string => {
    if (!code || !valueByCode.has(code)) return 'var(--choro-nodata)';
    const bucket = choropleth.bucketOf(valueByCode.get(code));
    return bucket < 0 ? 'var(--choro-nodata)' : `var(--choro-${bucket})`;
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-tremor-title font-medium text-gray-900 dark:text-gray-100">
            {t('mapTitle')}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('mapHint')}</p>
        </div>
        <div className="min-h-[1.5rem] text-right text-sm">
          {hovered ? (
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {siteName(hovered.code)} · {formatMetric(metric, hovered.value, locale)}
            </span>
          ) : (
            <span className="text-gray-400">&nbsp;</span>
          )}
        </div>
      </div>

      <div className="mt-2 overflow-hidden">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [-62, -15], scale: 400 }}
          width={640}
          height={620}
          style={{ width: '100%', height: 'auto' }}
        >
          <Geographies geography={geoData}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const numeric = String(geo.id).padStart(3, '0');
                const code = ML_BY_NUMERIC[numeric];
                const isActive = !!code && valueByCode.has(code);
                const isSelected = isActive && code === selected;
                const isCompared = isActive && !!code && multiSelected.includes(code);
                const stroke = isSelected
                  ? SELECTED_STROKE
                  : isCompared
                    ? COMPARE_STROKE
                    : STROKE;
                const strokeWidth = isSelected || isCompared ? 1.4 : 0.5;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={
                      isActive
                        ? () => setHovered({ code: code!, value: valueByCode.get(code!) ?? null })
                        : undefined
                    }
                    onMouseLeave={isActive ? () => setHovered(null) : undefined}
                    onClick={isActive ? () => onSelect?.(code!) : undefined}
                    style={{
                      default: {
                        fill: fillFor(code),
                        stroke,
                        strokeWidth,
                        outline: 'none',
                        cursor: isActive ? 'pointer' : 'default',
                        pointerEvents: isActive ? 'auto' : 'none',
                        transition: 'fill 0.2s ease, stroke 0.15s ease',
                      },
                      hover: {
                        fill: fillFor(code),
                        stroke: isActive ? SELECTED_STROKE : stroke,
                        strokeWidth: isActive ? 1.2 : strokeWidth,
                        outline: 'none',
                        cursor: isActive ? 'pointer' : 'default',
                      },
                      pressed: {
                        fill: fillFor(code),
                        stroke: SELECTED_STROKE,
                        strokeWidth: 1.4,
                        outline: 'none',
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>
    </div>
  );
}
