'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { LayoutGrid, Move, Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

/**
 * First-time coachmark for the analytics view. Shows once per user — gated on
 * the backend-persisted `preferences.seenAnalyticsTutorial` flag — and explains
 * that the user can ADD widgets and REORDER them freely. Finishing (or skipping)
 * persists the flag via `updatePreferences`, so it never shows again on any
 * device.
 */
const STEPS = [
  { key: 'add', Icon: Plus },
  { key: 'reorder', Icon: Move },
  { key: 'arrange', Icon: LayoutGrid },
] as const;

export function AnalyticsTutorial() {
  const t = useTranslations('analytics.tutorial');
  const { user, updatePreferences } = useAuth();
  const [step, setStep] = useState(0);
  // Hide immediately on dismissal even if the network write is still in flight.
  const [dismissed, setDismissed] = useState(false);

  const alreadySeen = user?.preferences?.seenAnalyticsTutorial === true;
  if (!user || alreadySeen || dismissed) return null;

  const finish = () => {
    setDismissed(true);
    // Best-effort persistence; the local dismissal already closed the overlay.
    void updatePreferences({ seenAnalyticsTutorial: true }).catch(() => {});
  };

  const isLast = step === STEPS.length - 1;
  const { key, Icon } = STEPS[step];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('title')}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
          <Icon className="h-6 w-6" />
        </div>

        <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {step === 0 ? t('title') : t(`${key}.title`)}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">{t(`${key}.body`)}</p>

        {/* Progress dots */}
        <div className="mt-5 flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <span
              key={s.key}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-5 bg-blue-600' : 'w-1.5 bg-gray-300 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={finish}
            className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {t('skip')}
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {t('back')}
              </button>
            )}
            <button
              type="button"
              onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              {isLast ? t('done') : t('next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
