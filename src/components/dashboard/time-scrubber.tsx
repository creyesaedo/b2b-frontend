'use client';

import { useLocale, useTranslations } from 'next-intl';
import { formatDate } from '@/lib/format';

interface TimeScrubberProps {
  /** Snapshot dates in ascending order. */
  dates: string[];
  /** Index of the active date within `dates`. */
  index: number;
  onChange: (index: number) => void;
}

/** Range slider over snapshot dates; scrubbing recolors the choropleth by date. */
export function TimeScrubber({ dates, index, onChange }: TimeScrubberProps) {
  const t = useTranslations('dashboard');
  const locale = useLocale();

  if (dates.length < 2) return null;

  const isLatest = index >= dates.length - 1;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {t('scrubberLabel')}
        </span>
        <span className="text-xs font-semibold tabular-nums text-gray-900 dark:text-gray-100">
          {formatDate(dates[index], locale)}
          {isLatest && (
            <span className="ml-1.5 font-normal text-gray-400">{t('scrubberLatest')}</span>
          )}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={dates.length - 1}
        step={1}
        value={index}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={t('scrubberLabel')}
        aria-valuetext={formatDate(dates[index], locale)}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-blue-600 dark:bg-gray-700"
      />
    </div>
  );
}
