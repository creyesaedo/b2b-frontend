'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
// Local topojson (no runtime fetch). Whole world; we just frame Latin America.
import geoData from 'world-atlas/countries-110m.json';
import { useRouter } from '@/i18n/navigation';
import { siteName } from '@/lib/ml-sites';
import { formatNumber } from '@/lib/format';

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

const SCRAPED_FILL = '#bfdbfe'; // blue-200
const SCRAPED_HOVER = '#60a5fa'; // blue-400
const SCRAPED_PRESSED = '#2563eb'; // blue-600
const MUTED_FILL = '#e5e7eb'; // gray-200
const STROKE = '#ffffff';

interface MarketMapProps {
  data: Array<{ country: string; count: number }>;
  /** ML code currently selected (highlighted), if any. */
  selected?: string | null;
  /** Called with the ML site code when a scraped country is clicked. */
  onSelect?: (code: string) => void;
}

export function MarketMap({ data, selected, onSelect }: MarketMapProps) {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const [hovered, setHovered] = useState<{ code: string; count: number } | null>(null);

  const countByCode = new Map(data.map((d) => [d.country, d.count]));

  const handleSelect = (code: string) => {
    if (onSelect) onSelect(code);
    else router.push(`/products?country=${code}`);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-tremor-title font-medium text-gray-900 dark:text-gray-100">
            {t('mapTitle')}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('mapHint')}</p>
        </div>
        <div className="min-h-[1.25rem] text-right text-sm">
          {hovered ? (
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {siteName(hovered.code)} · {formatNumber(hovered.count)}
            </span>
          ) : (
            <span className="text-gray-400">&nbsp;</span>
          )}
        </div>
      </div>

      <div className="mt-2 overflow-hidden">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [-72, -12], scale: 330 }}
          width={520}
          height={520}
          style={{ width: '100%', height: 'auto' }}
        >
          <Geographies geography={geoData}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const numeric = String(geo.id).padStart(3, '0');
                const code = ML_BY_NUMERIC[numeric];
                const isScraped = !!code && countByCode.has(code);
                const isSelected = isScraped && code === selected;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={
                      isScraped
                        ? () => setHovered({ code, count: countByCode.get(code) ?? 0 })
                        : undefined
                    }
                    onMouseLeave={isScraped ? () => setHovered(null) : undefined}
                    onClick={isScraped ? () => handleSelect(code) : undefined}
                    style={{
                      default: {
                        fill: isSelected ? SCRAPED_PRESSED : isScraped ? SCRAPED_FILL : MUTED_FILL,
                        stroke: STROKE,
                        strokeWidth: 0.5,
                        outline: 'none',
                        cursor: isScraped ? 'pointer' : 'default',
                        pointerEvents: isScraped ? 'auto' : 'none',
                        transition: 'fill 0.15s ease',
                      },
                      hover: {
                        fill: isScraped ? SCRAPED_HOVER : MUTED_FILL,
                        stroke: STROKE,
                        strokeWidth: 0.5,
                        outline: 'none',
                        cursor: isScraped ? 'pointer' : 'default',
                      },
                      pressed: {
                        fill: SCRAPED_PRESSED,
                        stroke: STROKE,
                        strokeWidth: 0.5,
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
