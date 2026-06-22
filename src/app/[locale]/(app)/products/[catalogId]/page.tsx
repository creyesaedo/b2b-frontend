'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Card, Metric, Select, SelectItem, Text, Title } from '@tremor/react';
import {
  Area,
  CartesianGrid,
  AreaChart as RAreaChart,
  Line,
  LineChart as RLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowLeft } from 'lucide-react';
import { DataState } from '@/components/app/data-state';
import { getProductHistory } from '@/lib/api/endpoints';
import { formatCurrency, formatDate, formatNumber } from '@/lib/format';
import { Link } from '@/i18n/navigation';

type Currency = 'local' | 'usd';

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
  const [currency, setCurrency] = useState<Currency>('local');
  const isUsd = currency === 'usd';

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['history', id, isListing],
    queryFn: () =>
      getProductHistory(isListing ? { ml_public_id: id } : { catalog_id: id }),
  });

  const history = data ?? [];
  const isEmpty = !!data && history.length === 0;

  const productName = history.length ? (history[history.length - 1].name ?? id) : id;

  // Local currency code (from the latest snapshot); USD when the toggle is on.
  const localCcy = history.length ? (history[history.length - 1].currency ?? 'USD') : 'USD';
  const ccyCode = isUsd ? 'USD' : localCcy;

  // Full series (ascending) for charts; the plotted price follows the currency
  // toggle. Price chart is then sliced by `period`.
  const points = useMemo(
    () =>
      history.map((h) => ({
        raw: h.snapshot_date,
        date: formatDate(h.snapshot_date, locale),
        price: isUsd ? h.usd_price : h.price,
        ranking: h.ranking_position,
      })),
    [history, locale, isUsd],
  );

  const pricePoints = useMemo(() => {
    if (period === 'all') return points;
    const cutoff = Date.now() - (period === 'month' ? 30 : 365) * DAY;
    return points.filter((p) => new Date(p.raw).getTime() >= cutoff);
  }, [points, period]);

  const prices = history
    .map((h) => (isUsd ? h.usd_price : h.price))
    .filter((p): p is number => p !== null);
  const rankings = history
    .map((h) => h.ranking_position)
    .filter((r): r is number => r !== null);

  const current = prices.length ? prices[prices.length - 1] : null;
  const lowest = prices.length ? Math.min(...prices) : null;
  const highest = prices.length ? Math.max(...prices) : null;
  const bestRanking = rankings.length ? Math.min(...rankings) : null;

  const priceFmt = (v: number) => formatCurrency(v, ccyCode, locale);

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
        <div className="mb-4 flex items-center justify-end gap-2">
          <span className="whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400">
            {t('currency')}:
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
                {c === 'local' ? t('local') : 'USD'}
              </button>
            ))}
          </div>
        </div>
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
            <HistoryChart
              type="area"
              data={pricePoints}
              dataKey="price"
              color="#3b82f6"
              valueFormatter={priceFmt}
            />
          </Card>

          <Card className="dark:!bg-gray-900">
            <Title>{t('rankingHistory')}</Title>
            <Text className="mt-1">{t('rankingNote')}</Text>
            <HistoryChart
              type="line"
              data={points.filter((d) => d.ranking !== null)}
              dataKey="ranking"
              color="#f59e0b"
              valueFormatter={(v) => `#${v}`}
            />
          </Card>
        </div>
      </DataState>
    </>
  );
}

type ChartDatum = { date: string; price: number | null; ranking: number | null };

/**
 * Price/ranking history chart built on Recharts directly (not Tremor's
 * AreaChart/LineChart) so the data points are always rendered, not only on hover.
 * Axis/grid colors use `currentColor` so they follow the light/dark theme.
 */
function HistoryChart({
  type,
  data,
  dataKey,
  color,
  valueFormatter,
}: {
  type: 'area' | 'line';
  data: ChartDatum[];
  dataKey: 'price' | 'ranking';
  color: string;
  valueFormatter: (v: number) => string;
}) {
  const dot = { r: 3.5, fill: color, stroke: color, strokeWidth: 0 };
  const activeDot = { r: 5, fill: color, stroke: '#fff', strokeWidth: 2 };
  const axisProps = {
    tick: { fill: 'currentColor', fontSize: 11 },
    stroke: 'currentColor',
    strokeOpacity: 0.2,
  } as const;

  return (
    <div className="mt-4 h-80 text-tremor-content dark:text-dark-tremor-content">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'area' ? (
          <RAreaChart data={data} margin={{ top: 8, right: 12, bottom: 56, left: 4 }}>
            <defs>
              <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.12} vertical={false} />
            <XAxis
              dataKey="date"
              interval={0}
              angle={-45}
              textAnchor="end"
              height={56}
              {...axisProps}
            />
            <YAxis tickFormatter={valueFormatter} width={56} {...axisProps} />
            <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${dataKey})`}
              dot={dot}
              activeDot={activeDot}
              isAnimationActive={false}
            />
          </RAreaChart>
        ) : (
          <RLineChart data={data} margin={{ top: 8, right: 12, bottom: 56, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.12} vertical={false} />
            <XAxis
              dataKey="date"
              interval={0}
              angle={-45}
              textAnchor="end"
              height={56}
              {...axisProps}
            />
            <YAxis
              tickFormatter={valueFormatter}
              width={56}
              domain={[1, 20]}
              ticks={[1, 5, 10, 15, 20]}
              reversed
              allowDecimals={false}
              {...axisProps}
            />
            <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={dot}
              activeDot={activeDot}
              isAnimationActive={false}
            />
          </RLineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

/** Compact, theme-aware tooltip matching the app's card styling. */
function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  valueFormatter: (v: number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-md dark:border-gray-700 dark:bg-gray-800">
      <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
      <p className="text-gray-600 dark:text-gray-300">{valueFormatter(payload[0].value)}</p>
    </div>
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
