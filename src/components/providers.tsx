'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth/auth-context';
import { QueryProvider } from '@/lib/query';

/** Client-side providers shared across the app (data cache + session state). */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>{children}</AuthProvider>
    </QueryProvider>
  );
}
