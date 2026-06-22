import { useTranslations } from 'next-intl';
import {
  ArrowRight,
  BarChart3,
  Database,
  LineChart,
  Sparkles,
  Store,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Brand } from '@/components/brand';
import { SiteHeader } from '@/components/landing/site-header';

export default function LandingPage() {
  const t = useTranslations('landing');
  const nav = useTranslations('nav');

  const features = [
    { icon: TrendingUp, title: t('features.priceTitle'), text: t('features.priceText') },
    { icon: Trophy, title: t('features.rankingTitle'), text: t('features.rankingText') },
    { icon: BarChart3, title: t('features.categoryTitle'), text: t('features.categoryText') },
    { icon: Store, title: t('features.sellerTitle'), text: t('features.sellerText') },
  ];

  const steps = [
    { icon: Database, title: t('howItWorks.step1Title'), text: t('howItWorks.step1Text') },
    { icon: Sparkles, title: t('howItWorks.step2Title'), text: t('howItWorks.step2Text') },
    { icon: LineChart, title: t('howItWorks.step3Title'), text: t('howItWorks.step3Text') },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950" />
        <div className="mx-auto max-w-6xl px-4 py-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
            <Sparkles className="h-3.5 w-3.5" />
            {t('hero.badge')}
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            {t('hero.title')}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
            {t('hero.subtitle')}
          </p>
          <div className="mt-9 flex items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              {t('hero.ctaPrimary')}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900"
            >
              {t('hero.ctaSecondary')}
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">{t('features.title')}</h2>
          <p className="mt-3 text-gray-600 dark:text-gray-300">{t('features.subtitle')}</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-gray-200 p-6 transition-shadow hover:shadow-md dark:border-gray-800"
            >
              <div className="inline-flex rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            {t('howItWorks.title')}
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title} className="relative text-center">
                <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
                  <s.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-semibold">
                  {i + 1}. {s.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h2 className="text-3xl font-bold tracking-tight">{t('cta.title')}</h2>
        <p className="mt-3 text-gray-600 dark:text-gray-300">{t('cta.subtitle')}</p>
        <Link
          href="/signup"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          {t('cta.button')}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-gray-500 sm:flex-row">
          <Brand />
          <div className="text-center sm:text-right">
            <p>{t('footer.tagline')}</p>
            <p className="text-xs text-gray-400">{t('footer.note')}</p>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-gray-900 dark:hover:text-white">
              {nav('login')}
            </Link>
            <Link href="/signup" className="hover:text-gray-900 dark:hover:text-white">
              {nav('getStarted')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
