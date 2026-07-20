'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { LineChart, X } from 'lucide-react';
import { WIDGET_PRESETS, type WidgetPreset } from '@/lib/engine/widget-presets';

/**
 * Modal that lets the user pick a widget to add to the analytics dashboard.
 * Presets come from `widget-presets.ts`; each is localized under
 * `analytics.presets.<id>` in the message bundles. Picking one calls `onAdd`
 * and closes the dialog.
 *
 * The custom line chart is the exception: it needs its data bound first, so it
 * hands off to the config dialog via `onAddCustomLine`.
 */
export function AddWidgetDialog({
  open,
  onClose,
  onAdd,
  onAddCustomLine,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (preset: WidgetPreset) => void;
  onAddCustomLine: () => void;
}) {
  const t = useTranslations('analytics');

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={t('addWidget')}
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {t('addWidgetTitle')}
          </h2>
          <button
            type="button"
            aria-label={t('close')}
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          {t('addWidgetSubtitle')}
        </p>

        {/* Custom line chart — the only entry that asks for its data first. */}
        <button
          type="button"
          onClick={onAddCustomLine}
          className="mb-3 flex w-full items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-left transition-colors hover:border-blue-500 dark:border-blue-900 dark:bg-blue-950/50 dark:hover:border-blue-500"
        >
          <LineChart className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-300" />
          <span className="min-w-0">
            <span className="block text-sm font-medium text-gray-800 dark:text-gray-100">
              {t('presets.custom_line.label')}
            </span>
            <span className="block text-xs text-gray-500 dark:text-gray-400">
              {t('presets.custom_line.desc')}
            </span>
          </span>
        </button>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {WIDGET_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onAdd(preset)}
              className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left transition-colors hover:border-blue-500 hover:bg-blue-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-500 dark:hover:bg-blue-950"
            >
              <span className="text-xl leading-none" aria-hidden>
                {preset.icon}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                  {t(`presets.${preset.id}.label`)}
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  {t(`presets.${preset.id}.desc`)}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
