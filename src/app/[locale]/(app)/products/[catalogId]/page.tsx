'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  AreaChart,
  Card,
  LineChart,
  Metric,
  Select,
  SelectItem,
  Text,
  Title,
} from '@tremor/react';
import { ArrowLeft } from 'lucide-react';
import { DataState } from '@/components/app/data-state';
import { getProductHistory } from '@/lib/api/endpoints';
import { formatDate, formatNumber } from '@/lib/format';
import { Link } from '@/i18n/navigation';

type Period = 'all' | 'year' | 'month';
const DAY = 86_400_000;

export default function ProductDetailPage() {
  const t = useTranslations('productDetail');
  const locale = useLocale();
  const params = useParams<{ catalogId: string }>();
  const searchParams = useSearchParams();
  const isListing = searchParams.get('listing') === '1';
  const id = decodeURIComponent(params.catalogId);
  const [period, setPeriod] = useState<Period>('all');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['history', id, isListing],
    queryFn: () =>
      getProductHistory(isListing ? { ml_public_id: id } : { catalog_id: id }),
  });

  const history = data ?? [];
  const isEmpty = !!data && history.length === 0;

  const productName = history.length ? (history[history.length - 1].name ?? id) : id;

  // Full series (ascending) for charts; price chart is then sliced by `period`.
  const points = useMemo(
    () =>
      history.map((h) => ({
        raw: h.snapshot_date,
        date: formatDate(h.snapshot_date, locale),
        price: h.price,
        ranking: h.ranking_position,
      })),
    [history, locale],
  );

  const pricePoints = useMemo(() => {
    if (period === 'all') return points;
    const cutoff = Date.now() - (period === 'month' ? 30 : 365) * DAY;
    return points.filter((p) => new Date(p.raw).getTime() >= cutoff);
  }, [points, period]);

  const prices = history.map((h) => h.price).filter((p): p is number => p !== null);
  const rankings = history
    .map((h) => h.ranking_position)
    .filter((r): r is number => r !== null);

  const current = prices.length ? prices[prices.length - 1] : null;
  const lowest = prices.length ? Math.min(...prices) : null;
  const highest = prices.length ? Math.max(...prices) : null;
  const bestRanking = rankings.length ? Math.min(...rankings) : null;

  const priceFmt = (v: number) => formatNumber(v, locale);
  const rotate = { angle: -45, verticalShift: 24, xAxisHeight: 64 };

  return (
    <>
      <Link
        href="/products"
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('back')}
      </Link>

      <h1 className="mb-5 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        {productName}
      </h1>

      <DataState isLoading={isLoading} isError={isError} isEmpty={isEmpty} onRetry={() => refetch()}>
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <Kpi label={t('currentPrice')} value={priceFmt(current ?? 0)} />
          <Kpi label={t('lowestPrice')} value={lowest !== null ? priceFmt(lowest) : '—'} />
          <Kpi label={t('highestPrice')} value={highest !== null ? priceFmt(highest) : '—'} />
          <Kpi label={t('bestRanking')} value={bestRanking !== null ? `#${bestRanking}` : '—'} />
          <Kpi label={t('historyCount')} value={formatNumber(history.length, locale)} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="dark:!bg-gray-900">
            <div className="flex items-center justify-between gap-3">
              <Title>{t('priceHistory')}</Title>
              <Select
                value={period}
                onValueChange={(v) => setPeriod(v as Period)}
                className="max-w-[160px]"
              >
                <SelectItem value="all">{t('periodAll')}</SelectItem>
                <SelectItem value="year">{t('periodYear')}</SelectItem>
                <SelectItem value="month">{t('periodMonth')}</SelectItem>
              </Select>
            </div>
            <AreaChart
              className="mt-4 h-80"
              data={pricePoints}
              index="date"
              categories={['price']}
              colors={['blue']}
              valueFormatter={priceFmt}
              showLegend={false}
              curveType="monotone"
              intervalType={0}
              rotateLabelX={rotate}
            />
          </Card>

          <Card className="dark:!bg-gray-900">
            <Title>{t('rankingHistory')}</Title>
            <Text className="mt-1">{t('rankingNote')}</Text>
            <LineChart
              className="mt-4 h-80"
              data={points.filter((d) => d.ranking !== null)}
              index="date"
              categories={['ranking']}
              colors={['amber']}
              valueFormatter={(v) => `#${v}`}
              showLegend={false}
              curveType="monotone"
              intervalType={0}
              rotateLabelX={rotate}
            />
          </Card>
        </div>
      </DataState>
    </>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card className="dark:!bg-gray-900">
      <Text>{label}</Text>
      <Metric className="mt-2 text-xl">{value}</Metric>
    </Card>
  );
}
