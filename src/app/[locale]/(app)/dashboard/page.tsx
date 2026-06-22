'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { BarList, Card, Metric, Text, Title } from '@tremor/react';
import { CalendarRange, Layers, Package, Store } from 'lucide-react';
import { DataState } from '@/components/app/data-state';
import { PageHeader } from '@/components/app/page-header';
import { MarketMap } from '@/components/dashboard/market-map';
import { getStats } from '@/lib/api/endpoints';
import { formatDate, formatNumber } from '@/lib/format';
import { siteName } from '@/lib/ml-sites';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const locale = useLocale();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
  });

  const isEmpty = !!data && data.total_products === 0;

  const kpis = data
    ? [
        { icon: Package, label: t('kpiProducts'), value: formatNumber(data.total_products, locale) },
        { icon: Store, label: t('kpiSellers'), value: formatNumber(data.total_sellers, locale) },
        { icon: Layers, label: t('kpiCategories'), value: formatNumber(data.total_categories, locale) },
        { icon: CalendarRange, label: t('kpiLastSnapshot'), value: formatDate(data.latest_snapshot, locale) },
      ]
    : [];

  const byCountry =
    data?.by_country.map((c) => ({
      name: siteName(c.country),
      value: c.count,
    })) ?? [];

  const dates = data?.snapshot_dates ?? [];
  const coverage =
    dates.length > 0
      ? `${formatDate(dates[dates.length - 1], locale)} – ${formatDate(dates[0], locale)}`
      : '—';

  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <DataState isLoading={isLoading} isError={isError} isEmpty={isEmpty} onRetry={() => refetch()}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {kpis.map((k) => (
            <Card key={k.label} className="dark:!bg-gray-900">
              <div className="flex items-center gap-2 text-gray-500">
                <k.icon className="h-4 w-4" />
                <Text>{k.label}</Text>
              </div>
              <Metric className="mt-2">{k.value}</Metric>
            </Card>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card className="dark:!bg-gray-900">
            <MarketMap data={data?.by_country ?? []} />
          </Card>

          <div className="space-y-6">
            <Card className="dark:!bg-gray-900">
              <Title>{t('byCountry')}</Title>
              <BarList data={byCountry} className="mt-4" color="blue" />
            </Card>

            <Card className="dark:!bg-gray-900">
              <Title>{t('insightsTitle')}</Title>
              <dl className="mt-4 space-y-4">
                <Insight
                  label={t('insightTopCountry')}
                  value={byCountry.length ? byCountry[0].name : '—'}
                />
                <Insight label={t('insightSnapshots')} value={formatNumber(dates.length, locale)} />
                <Insight label={t('insightCoverage')} value={coverage} />
              </dl>
            </Card>
          </div>
        </div>
      </DataState>
    </>
  );
}

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 dark:border-gray-800">
      <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</dd>
    </div>
  );
}
