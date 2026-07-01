'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
  Title,
} from '@tremor/react';
import { ArrowLeft } from 'lucide-react';
import { DataState } from '@/components/app/data-state';
import { HistoryChart, Kpi } from '@/components/app/history-chart';
import { getProductHistory, getTrackedProducts } from '@/lib/api/endpoints';
import { formatCurrency, formatDate, formatNumber, formatPercent } from '@/lib/format';
import { siteName } from '@/lib/ml-sites';
import { buildDailySnapshots } from '@/lib/tracked';
import { Link } from '@/i18n/navigation';

type Currency = 'local' | 'usd';

export default function TrackedDetailPage() {
  const t = useTranslations('tracked');
  const pd = useTranslations('productDetail');
  const locale = useLocale();
  const params = useParams<{ id: string }>();
  const trackedId = Number(params.id);
  const [currency, setCurrency] = useState<Currency>('local');
  const isUsd = currency === 'usd';

  // The subscription (cached from the list) gives us the canonical id to query.
  const trackedQuery = useQuery({
    queryKey: ['tracked-products'],
    queryFn: getTrackedProducts,
  });
  const subscription = trackedQuery.data?.find((tp) => tp.id === trackedId);
  const canonicalId = subscription?.catalog_id ?? subscription?.ml_public_id ?? null;
  const byCatalog = !!subscription?.catalog_id;

  const historyQuery = useQuery({
    queryKey: ['history', canonicalId, byCatalog],
    enabled: !!canonicalId,
    queryFn: () =>
      getProductHistory(
        byCatalog ? { catalog_id: canonicalId! } : { ml_public_id: canonicalId! },
      ),
  });

  const history = useMemo(() => historyQuery.data?.history ?? [], [historyQuery.data]);
  const visits = useMemo(() => historyQuery.data?.visits ?? [], [historyQuery.data]);

  const localCcy = history.length ? (history[history.length - 1].currency ?? 'USD') : 'USD';
  const ccyCode = isUsd ? 'USD' : localCcy;
  const priceFmt = (v: number) => formatCurrency(v, ccyCode, locale);

  const productName = history.length ? (history[history.length - 1].name ?? canonicalId) : canonicalId;

  // Chart series (ascending), price following the currency toggle.
  const points = useMemo(
    () =>
      history.map((h) => ({
        date: formatDate(h.snapshot_date, locale),
        price: isUsd ? h.usd_price : h.price,
        ranking: h.ranking_position,
      })),
    [history, locale, isUsd],
  );

  const prices = points.map((p) => p.price).filter((p): p is number => p !== null);
  const current = prices.length ? prices[prices.length - 1] : null;
  const lowest = prices.length ? Math.min(...prices) : null;
  const highest = prices.length ? Math.max(...prices) : null;

  const totalVisits = useMemo(
    () => visits.reduce((sum, v) => sum + (v.weekly_visits ?? 0), 0),
    [visits],
  );

  // The reconstructed daily snapshots (dense — one row per checked day), newest
  // first for the table.
  const dailySnapshots = useMemo(
    () => buildDailySnapshots(history, visits).reverse(),
    [history, visits],
  );

  const isEmpty = !historyQuery.isLoading && history.length === 0;

  return (
    <>
      <Link
        href="/tracked"
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('back')}
      </Link>

      <h1 className="mb-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        {productName ?? t('title')}
      </h1>
      {subscription && (
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          {siteName(subscription.country)} · {t('cadenceHours', { hours: subscription.cadence_hours })}
        </p>
      )}

      <DataState
        isLoading={trackedQuery.isLoading || historyQuery.isLoading}
        isError={trackedQuery.isError || historyQuery.isError}
        isEmpty={isEmpty}
        onRetry={() => historyQuery.refetch()}
      >
        {/* Currency toggle */}
        <div className="mb-4 flex items-center gap-2">
          <span className="whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400">
            {pd('currency')}:
          </span>
          <div className="inline-flex items-center rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
            {(['local', 'usd'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  currency === c
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                }`}
                aria-pressed={currency === c}
              >
                {c === 'local' ? pd('local') : 'USD'}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <Kpi label={pd('currentPrice')} value={current !== null ? priceFmt(current) : '—'} />
          <Kpi label={pd('lowestPrice')} value={lowest !== null ? priceFmt(lowest) : '—'} />
          <Kpi label={pd('highestPrice')} value={highest !== null ? priceFmt(highest) : '—'} />
          <Kpi label={pd('totalVisits')} value={formatNumber(totalVisits, locale)} />
          <Kpi label={t('checksCount')} value={formatNumber(dailySnapshots.length, locale)} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="dark:!bg-gray-900">
            <Title>{pd('priceHistory')}</Title>
            <HistoryChart
              type="area"
              data={points}
              dataKey="price"
              color="#3b82f6"
              valueFormatter={priceFmt}
            />
          </Card>

          <Card className="dark:!bg-gray-900">
            <Title>{pd('rankingHistory')}</Title>
            <Text className="mt-1">{pd('rankingNote')}</Text>
            <HistoryChart
              type="line"
              data={points.filter((d) => d.ranking !== null && d.ranking > 0)}
              dataKey="ranking"
              color="#f59e0b"
              valueFormatter={(v) => `#${v}`}
            />
          </Card>
        </div>

        {/* Daily snapshots table (dense — every checked day, unchanged days
            carry forward the last snapshot's values). */}
        <Card className="mt-6 dark:!bg-gray-900">
          <Title>{t('snapshots')}</Title>
          <Text className="mt-1">{t('snapshotsNote')}</Text>
          <div className="mt-4 max-h-96 overflow-y-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>{pd('colDate')}</TableHeaderCell>
                  <TableHeaderCell className="text-right">{pd('colPrice')}</TableHeaderCell>
                  <TableHeaderCell className="text-right">{pd('colDiscount')}</TableHeaderCell>
                  <TableHeaderCell className="text-right">{t('colRanking')}</TableHeaderCell>
                  <TableHeaderCell className="text-right">{t('colSold')}</TableHeaderCell>
                  <TableHeaderCell className="text-right">{pd('colVisits')}</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dailySnapshots.map((s) => {
                  const price = isUsd ? s.usd_price : s.price;
                  return (
                    <TableRow key={s.date}>
                      <TableCell>{formatDate(s.date, locale)}</TableCell>
                      <TableCell className="text-right">
                        {price !== null ? priceFmt(price) : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {s.discount_pct ? formatPercent(s.discount_pct, locale) : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {s.ranking_position && s.ranking_position > 0 ? `#${s.ranking_position}` : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {s.sold_count !== null ? formatNumber(s.sold_count, locale) : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {s.weekly_visits !== null ? formatNumber(s.weekly_visits, locale) : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      </DataState>
    </>
  );
}
