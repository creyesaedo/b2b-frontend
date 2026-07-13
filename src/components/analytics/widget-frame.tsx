'use client';

import { AlertCircle, Info } from 'lucide-react';
import type { QualityNote } from '@/lib/engine/types';

/**
 * Shared chrome of every dashboard widget: title, optional quality notes and
 * the per-widget error state (a broken widget shows its error, never blanks
 * the dashboard — engine Doc 03 §4). The header doubles as the drag handle
 * (`.widget-drag-handle`, wired to DashboardCanvas's draggableHandle) so
 * dragging never fights chart/table interactions in the body.
 */
export function WidgetFrame({
  title,
  error,
  quality = [],
  children,
}: {
  title: string;
  error?: string | null;
  quality?: QualityNote[];
  children?: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="widget-drag-handle mb-2 flex cursor-move select-none items-start justify-between gap-2 active:cursor-grabbing">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</h3>
        {quality.length > 0 && (
          <span
            className="shrink-0 text-gray-400"
            title={quality.map((q) => q.message).join('\n')}
          >
            <Info className="h-3.5 w-3.5" />
          </span>
        )}
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
