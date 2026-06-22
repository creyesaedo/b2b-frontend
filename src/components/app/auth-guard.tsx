'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useRouter } from '@/i18n/navigation';

/**
 * Client-side gate for the app section. The middleware already does a cheap
 * cookie-presence check; this validates the session for real via /auth/me and
 * redirects to /login if it's missing/expired.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const t = useTranslations('common');

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        {t('loading')}
      </div>
    );
  }

  return <>{children}</>;
}
