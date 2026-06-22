'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ApiError } from '@/lib/api/client';
import { googleLoginUrl } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/auth/auth-context';
import { Link, useRouter } from '@/i18n/navigation';
import { Brand } from '@/components/brand';
import { LocaleSwitcher } from '@/components/locale-switcher';

const schema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(8),
});

type FormValues = z.infer<typeof schema>;

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const t = useTranslations('auth');
  const router = useRouter();
  const { login, register: registerUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      if (mode === 'login') {
        await login(values.email, values.password);
      } else {
        await registerUser(values.email, values.password, values.name || undefined);
      }
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setServerError(t('errorInvalid'));
      } else {
        setServerError(err instanceof ApiError ? err.message : t('errorGeneric'));
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      <div className="flex items-center justify-between p-4">
        <Link href="/">
          <Brand />
        </Link>
        <LocaleSwitcher />
      </div>

      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {mode === 'login' ? t('loginTitle') : t('signupTitle')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {mode === 'login' ? t('loginSubtitle') : t('signupSubtitle')}
          </p>

          <a
            href={googleLoginUrl()}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <GoogleIcon />
            {t('google')}
          </a>

          <div className="my-5 flex items-center gap-3 text-xs uppercase text-gray-400">
            <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            {t('or')}
            <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {mode === 'signup' && (
              <Field label={t('name')} error={undefined}>
                <input
                  type="text"
                  autoComplete="name"
                  className={inputClass}
                  {...register('name')}
                />
              </Field>
            )}

            <Field label={t('email')} error={errors.email && t('errorGeneric')}>
              <input
                type="email"
                autoComplete="email"
                className={inputClass}
                {...register('email')}
              />
            </Field>

            <Field
              label={t('password')}
              hint={mode === 'signup' ? t('passwordHint') : undefined}
              error={errors.password && t('passwordHint')}
            >
              <input
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className={inputClass}
                {...register('password')}
              />
            </Field>

            {serverError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                {serverError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {mode === 'login' ? t('loginButton') : t('signupButton')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {mode === 'login' ? t('noAccount') : t('haveAccount')}{' '}
            <Link
              href={mode === 'login' ? '/signup' : '/login'}
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              {mode === 'login' ? t('signupLink') : t('loginLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
        {label}
      </span>
      {children}
      {hint && !error && (
        <span className="mt-1 block text-xs text-gray-400">{hint}</span>
      )}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
