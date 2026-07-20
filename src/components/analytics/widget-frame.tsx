'use client';

import { AlertCircle, GripVertical, Info, Settings2, X } from 'lucide-react';
import type { QualityNote } from '@/lib/engine/types';

/**
 * Shared chrome of every dashboard widget: title, optional quality notes and
 * the per-widget error state (a broken widget shows its error, never blanks
 * the dashboard — engine Doc 03 §4).
 *
 * The WHOLE frame is the drag handle (`.widget-drag-handle`, wired to
 * DashboardCanvas). Inner scrollable areas opt out with `.widget-no-drag`
 * (their scrollbar would otherwise move the widget). The grip icon + grab
 * cursor are the drag affordance.
 */
export function WidgetFrame({
  title,
  error,
  quality = [],
  onRemove,
  removeLabel,
  onConfigure,
  configureLabel,
  children,
}: {
  title: string;
  error?: string | null;
  quality?: QualityNote[];
  /** Present for user-added widgets: shows an X that removes the widget. */
  onRemove?: () => void;
  removeLabel?: string;
  /** Present for configurable widgets: opens the data-binding dialog. */
  onConfigure?: () => void;
  configureLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="widget-drag-handle group flex h-full min-h-0 cursor-grab flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:border-gray-300 hover:shadow-md active:cursor-grabbing dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700">
      <div className="mb-2 flex items-start gap-2 select-none">
        <h3 className="min-w-0 truncate text-sm font-semibold text-gray-700 dark:text-gray-200">
          {title}
        </h3>
        <span className="ml-auto flex shrink-0 items-center gap-1.5">
          {quality.length > 0 && (
            <span className="text-gray-400" title={quality.map((q) => q.message).join('\n')}>
              <Info className="h-3.5 w-3.5" />
            </span>
          )}
          {onConfigure && (
            <button
              type="button"
              aria-label={configureLabel}
              title={configureLabel}
              onClick={onConfigure}
              // Opt out of the drag handle so the click configures, not drags.
              onPointerDown={(e) => e.stopPropagation()}
              className="widget-no-drag rounded p-0.5 text-gray-300 opacity-0 transition group-hover:opacity-100 hover:bg-gray-100 hover:text-blue-600 dark:text-gray-600 dark:hover:bg-gray-800"
            >
              <Settings2 className="h-3.5 w-3.5" />
            </button>
          )}
          {onRemove && (
            <button
              type="button"
              aria-label={removeLabel}
              title={removeLabel}
              onClick={onRemove}
              // Opt out of the drag handle so the click removes, not drags.
              onPointerDown={(e) => e.stopPropagation()}
              className="widget-no-drag rounded p-0.5 text-gray-300 opacity-0 transition group-hover:opacity-100 hover:bg-gray-100 hover:text-red-500 dark:text-gray-600 dark:hover:bg-gray-800"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <GripVertical className="h-4 w-4 text-gray-300 transition-colors group-hover:text-gray-500 dark:text-gray-600 dark:group-hover:text-gray-400" />
        </span>
      </div>
      {error ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
          <AlertCircle className="h-6 w-6 text-red-500" />
          <p className="max-w-full break-words text-xs text-gray-500 dark:text-gray-400">
            {error}
          </p>
        </div>
      ) : (
        <div className="min-h-0 flex-1">{children}</div>
      )}
    </div>
  );
}
