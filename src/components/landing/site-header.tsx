'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Brand } from '@/components/brand';
import { LocaleSwitcher } from '@/components/locale-switcher';

export function SiteHeader() {
  const t = useTranslations('nav');

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/">
          <Brand />
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-gray-600 md:flex dark:text-gray-300">
          <a href="#features" className="hover:text-gray-900 dark:hover:text-white">
            {t('features')}
          </a>
          <a href="#how" className="hover:text-gray-900 dark:hover:text-white">
            {t('howItWorks')}
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <Link
            href="/login"
            className="hidden text-sm font-medium text-gray-700 hover:text-gray-900 sm:block dark:text-gray-200 dark:hover:text-white"
          >
            {t('login')}
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            {t('getStarted')}
          </Link>
        </div>
      </div>
    </header>
  );
}
