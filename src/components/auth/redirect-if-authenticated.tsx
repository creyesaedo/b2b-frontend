'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useRouter } from '@/i18n/navigation';

/**
 * Wraps public entry points (landing, login, signup) and sends users who
 * already have a valid session straight to the dashboard. Relies on the
 * validated `user` from `/auth/me` (not just cookie presence), so a stale/
 * expired `sid` resolves to `user === null` and no redirect loop can form.
 *
 * While the session is still resolving we render `children` so anonymous
 * visitors (and SEO for the landing) are never blocked; once we know a user
 * is present we swap to a spinner to avoid flashing public content.
 */
export function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [loading, user, router]);

  if (!loading && user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
