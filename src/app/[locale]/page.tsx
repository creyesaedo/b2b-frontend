import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  Database,
  Eye,
  LineChart,
  Sparkles,
  Store,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Brand } from '@/components/brand';
import { SiteHeader } from '@/components/landing/site-header';
import { RedirectIfAuthenticated } from '@/components/auth/redirect-if-authenticated';

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

  const trackingItems = [
    { icon: Eye, title: t('tracking.watchTitle'), text: t('tracking.watchText') },
    { icon: Bell, title: t('tracking.alertTitle'), text: t('tracking.alertText') },
    { icon: LineChart, title: t('tracking.historyTitle'), text: t('tracking.historyText') },
  ];

  const trustItems = [t('hero.trust1'), t('hero.trust2'), t('hero.trust3')];

  const decisionBullets = [
    t('decisions.bullet1'),
    t('decisions.bullet2'),
    t('decisions.bullet3'),
  ];

  return (
    <RedirectIfAuthenticated>
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-50 via-white to-white dark:from-gray-900 dark:via-gray-950 dark:to-gray-950" />
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-20 lg:grid-cols-2 lg:py-28">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
              <Sparkles className="h-3.5 w-3.5" />
              {t('hero.badge')}
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.15] tracking-tight sm:text-[2.5rem]">
              {t.rich('hero.title', {
                highlight: (chunks) => (
                  <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent sm:whitespace-nowrap dark:from-blue-400 dark:to-cyan-300">
                    {chunks}
                  </span>
                ),
                nowrap: (chunks) => <span className="sm:whitespace-nowrap">{chunks}</span>,
                br: () => <br className="hidden sm:block" />,
              })}
            </h1>
            <p className="mt-5 text-pretty text-lg leading-relaxed text-gray-600 dark:text-gray-300">
              {t('hero.subtitle')}
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
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
            <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-600 lg:justify-start dark:text-gray-400">
              {trustItems.map((item) => (
                <li key={item} className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-tr from-blue-600/15 via-cyan-400/10 to-transparent blur-2xl" />
            <Image
              src="/landing/boardroom.jpg"
              alt={t('hero.imageAlt')}
              width={1600}
              height={1067}
              priority
              className="rounded-2xl object-cover shadow-xl ring-1 ring-gray-900/10 dark:ring-white/10"
            />

            {/* Floating KPI card: price trend */}
            <div className="absolute -bottom-6 -left-4 hidden rounded-xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:block dark:border-gray-800 dark:bg-gray-900/95">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {t('heroCards.priceLabel')}
              </p>
              <svg
                viewBox="0 0 96 32"
                className="mt-2 h-8 w-24 text-blue-600 dark:text-blue-400"
                aria-hidden="true"
              >
                <polyline
                  points="0,8 14,12 28,10 42,18 56,16 70,23 84,21 96,26"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="mt-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                {t('heroCards.priceDelta')}
              </p>
            </div>

            {/* Floating KPI card: ranking */}
            <div className="absolute -right-4 top-8 hidden items-center gap-3 rounded-xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:flex dark:border-gray-800 dark:bg-gray-900/95">
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {t('heroCards.rankLabel')}
                </p>
                <p className="text-sm font-bold">
                  {t('heroCards.rankValue')}{' '}
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {t('heroCards.rankDelta')}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20">
        <div className="text-center">
          <h2 className="text-balance font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t('features.title')}
          </h2>
          <p className="mt-3 text-gray-600 dark:text-gray-300">{t('features.subtitle')}</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-900"
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

      {/* Product tracking */}
      <section id="tracking" className="mx-auto max-w-6xl px-4 pb-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
            <Bell className="h-3.5 w-3.5" />
            {t('tracking.badge')}
          </span>
          <h2 className="mt-6 text-balance font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t('tracking.title')}
          </h2>
          <p className="mt-4 text-pretty text-gray-600 dark:text-gray-300">{t('tracking.text')}</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {trackingItems.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-900"
            >
              <div className="inline-flex rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Data-driven decisions */}
      <section className="border-y border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 lg:grid-cols-2">
          <div className="relative order-last mx-auto w-full max-w-xl lg:order-first lg:max-w-none">
            <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-bl from-blue-600/10 to-transparent blur-2xl" />
            <Image
              src="/landing/exec-meeting.jpg"
              alt={t('decisions.imageAlt')}
              width={1600}
              height={1067}
              className="rounded-2xl object-cover shadow-lg ring-1 ring-gray-900/10 dark:ring-white/10"
            />
          </div>
          <div>
            <h2 className="text-balance font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {t('decisions.title')}
            </h2>
            <p className="mt-4 text-gray-600 dark:text-gray-300">{t('decisions.text')}</p>
            <ul className="mt-8 space-y-4">
              {decisionBullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-balance text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {t('howItWorks.title')}
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="relative text-center">
              <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-md">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold">
                {i + 1}. {s.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gray-900 dark:bg-blue-950">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-600/30 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="relative grid items-center gap-10 px-8 py-14 sm:px-12 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <h2 className="text-balance font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {t('cta.title')}
              </h2>
              <p className="mt-3 text-gray-300">{t('cta.subtitle')}</p>
              <Link
                href="/signup"
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm transition-colors hover:bg-gray-100"
              >
                {t('cta.button')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mx-auto w-full max-w-md lg:max-w-none">
              <Image
                src="/landing/analyst-screens.jpg"
                alt={t('cta.imageAlt')}
                width={1600}
                height={1140}
                className="rounded-xl object-cover shadow-2xl ring-1 ring-white/20"
              />
            </div>
          </div>
        </div>
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
    </RedirectIfAuthenticated>
  );
}
