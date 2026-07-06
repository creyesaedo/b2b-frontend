'use client';

import { Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * Toggles the `dark` class on <html> and persists the choice in localStorage.
 * The initial class is set before paint by the inline script in the locale
 * layout, so both icons are rendered and CSS picks the visible one — no
 * client state, no hydration mismatch.
 */
export function ThemeToggle() {
  const t = useTranslations('common');

  const toggle = () => {
    const root = document.documentElement;
    const dark = root.classList.toggle('dark');
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    } catch {
      // Storage unavailable (private mode); the toggle still works for the session.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t('toggleTheme')}
      title={t('toggleTheme')}
      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:text-gray-900 dark:border-gray-700 dark:hover:text-gray-100"
    >
      <Moon className="h-3.5 w-3.5 dark:hidden" />
      <Sun className="hidden h-3.5 w-3.5 dark:block" />
    </button>
  );
}
