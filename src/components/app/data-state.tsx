'use client';

import { useTranslations } from 'next-intl';
import { AlertCircle, Inbox, Loader2 } from 'lucide-react';

/**
 * Standard loading / error / empty wrapper for query-backed sections. Renders
 * `children` only when there is data to show.
 */
export function DataState({
  isLoading,
  isError,
  isEmpty,
  onRetry,
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  isEmpty?: boolean;
  onRetry?: () => void;
  children: React.ReactNode;
}) {
  const t = useTranslations('common');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        {t('loading')}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="text-sm text-gray-600 dark:text-gray-300">{t('error')}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {t('retry')}
          </button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <Inbox className="h-8 w-8 text-gray-400" />
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {t('noData')}
        </p>
        <p className="max-w-xs text-xs text-gray-400">{t('noDataHint')}</p>
      </div>
    );
  }

  return <>{children}</>;
}
