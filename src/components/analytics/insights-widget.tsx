'use client';

import { useTranslations } from 'next-intl';
import { Activity, Lightbulb, PieChart, TrendingUp } from 'lucide-react';
import type { DetectorName, Insight } from '@/lib/engine/types';

const DETECTOR_ICONS: Record<DetectorName, typeof Activity> = {
  cambio_significativo: Activity,
  tendencia: TrendingUp,
  concentracion: PieChart,
};

/**
 * Insight cards from the deterministic Insight Engine (Doc 09). The narrative
 * arrives pre-rendered from the engine (the number always comes from SQL).
 */
export function InsightsWidget({
  insights,
  isLoading,
}: {
  insights: Insight[];
  isLoading: boolean;
}) {
  const t = useTranslations('analytics');

  if (isLoading) {
    return <p className="flex h-full items-center justify-center text-sm text-gray-400">…</p>;
  }
  if (insights.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <Lightbulb className="h-5 w-5 text-gray-300" />
        <p className="text-xs text-gray-400">{t('noInsights')}</p>
      </div>
    );
  }

  return (
    <ul className="widget-no-drag flex h-full cursor-auto flex-col gap-2 overflow-auto">
      {insights.map((insight) => {
        const Icon = DETECTOR_ICONS[insight.detector] ?? Lightbulb;
        return (
          <li
            key={insight.id}
            className="flex items-start gap-2.5 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/60"
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="min-w-0">
              <p className="text-sm text-gray-700 dark:text-gray-200">{insight.narrative}</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-wide text-gray-400">
                {t(`detector_${insight.detector}`)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
