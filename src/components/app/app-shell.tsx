'use client';

import { useTranslations } from 'next-intl';
import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  Package,
  SlidersHorizontal,
  Store,
  Tags,
} from 'lucide-react';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { Brand } from '@/components/brand';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { useAuth } from '@/lib/auth/auth-context';

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, key: 'dashboard', permission: null },
  { href: '/products', icon: Package, key: 'products', permission: null },
  { href: '/categories', icon: Tags, key: 'categories', permission: null },
  { href: '/sellers', icon: Store, key: 'sellers', permission: null },
  { href: '/admin', icon: SlidersHorizontal, key: 'admin', permission: 'admin:manage' },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations('nav');
  const common = useTranslations('common');
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, hasPermission } = useAuth();

  const navItems = NAV.filter((item) => !item.permission || hasPermission(item.permission));

  const onLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <aside className="hidden w-60 flex-col border-r border-gray-200 bg-white p-4 md:flex dark:border-gray-800 dark:bg-gray-900">
        <Link href="/dashboard" className="px-2 py-1">
          <Brand />
        </Link>
        <nav className="mt-6 flex-1 space-y-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {t(item.key)}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <LogOut className="h-4 w-4" />
          {common('logout')}
        </button>
      </aside>

      {/* Main */}
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
          {/* Mobile brand */}
          <Link href="/dashboard" className="md:hidden">
            <BarChart3 className="h-5 w-5 text-blue-600" />
          </Link>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3">
            <LocaleSwitcher />
            <span className="hidden text-sm text-gray-600 sm:block dark:text-gray-300">
              {user?.name ?? user?.email}
            </span>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="flex gap-1 overflow-x-auto border-b border-gray-200 bg-white px-2 py-2 md:hidden dark:border-gray-800 dark:bg-gray-900">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${
                  active
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
