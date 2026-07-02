'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

/** Toggles between the available locales, preserving the current path. */
export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="inline-flex items-center rounded-full border border-gray-200 p-0.5 text-xs dark:border-gray-700">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => router.replace(pathname, { locale: loc })}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium uppercase transition-colors ${
            loc === locale
              ? 'bg-blue-600 text-white'
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          aria-current={loc === locale}
        >
          {loc}
        </button>
      ))}
    </div>
  );
}
