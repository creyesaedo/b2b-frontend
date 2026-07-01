'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  Card,
  Metric,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
  Title,
} from '@tremor/react';
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
import { ArrowLeft, ArrowRight, Download, Info } from 'lucide-react';
import { DataState } from '@/components/app/data-state';
import { getProductHistory } from '@/lib/api/endpoints';
import { formatCurrency, formatDate, formatNumber, formatPercent } from '@/lib/format';
import { Link } from '@/i18n/navigation';

type Currency = 'local' | 'usd';

type PriceView = 'chart' | 'table';

export default function ProductDetailPage() {
  const t = useTranslations('productDetail');
  const locale = useLocale();
  const params = useParams<{ catalogId: string }>();
  const searchParams = useSearchParams();
  const isListing = searchParams.get('listing') === '1';
  const id = decodeURIComponent(params.catalogId);
  const [priceView, setPriceView] = useState<PriceView>('chart');
  // Snapshot range, as indices into the ascending history. `null` = the open
  // ends (first / last snapshot); they're resolved + clamped against the loaded
  // history below, so they stay valid even as the data changes.
  const [fromIdx, setFromIdx] = useState<number | null>(null);
  const [toIdx, setToIdx] = useState<number | null>(null);
  const [currency, setCurrency] = useState<Currency>('local');
  const isUsd = currency === 'usd';

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['history', id, isListing],
    queryFn: () =>
      getProductHistory(isListing ? { ml_public_id: id } : { catalog_id: id }),
  });

  const history = useMemo(() => data?.history ?? [], [data]);
  // Visits are returned as their own series now (daily for tracked products,
  // derived from snapshots for best-sellers) — see the split visits table.
  const visitSeries = useMemo(() => data?.visits ?? [], [data]);
  const isEmpty = !!data && history.length === 0;

  const productName = history.length ? (history[history.length - 1].name ?? id) : id;

  // Local currency code (from the latest snapshot); USD when the toggle is on.
  const localCcy = history.length ? (history[history.length - 1].currency ?? 'USD') : 'USD';
  const ccyCode = isUsd ? 'USD' : localCcy;

  // Distinct buy-box winners present in this catalog's snapshots. A catalog's
  // winning listing (ml_public_id + seller) rotates over time; a single listing
  // has just one. Sorted by how many snapshots each winner holds.
  const winners = useMemo(() => {
    const byId = new Map<
      string,
      {
        id: string;
        seller: string | null;
        official: boolean;
        count: number;
        lastDate: string;
        // Price/discount captured at each winner's most recent snapshot.
        price: number | null;
        usdPrice: number | null;
        discount: number | null;
      }
    >();
    for (const h of history) {
      if (!h.ml_public_id) continue;
      const e = byId.get(h.ml_public_id);
      if (!e) {
        byId.set(h.ml_public_id, {
          id: h.ml_public_id,
          seller: h.seller?.nickname ?? null,
          official: h.seller?.is_official_store ?? false,
          count: 1,
          lastDate: h.snapshot_date,
          price: h.price,
          usdPrice: h.usd_price,
          discount: h.discount_pct,
        });
      } else {
        e.count += 1;
        if (h.snapshot_date >= e.lastDate) {
          e.lastDate = h.snapshot_date;
          e.seller = h.seller?.nickname ?? e.seller;
          e.official = h.seller?.is_official_store ?? e.official;
          e.price = h.price;
          e.usdPrice = h.usd_price;
          e.discount = h.discount_pct;
        }
      }
    }
    return [...byId.values()].sort((a, b) => b.count - a.count);
  }, [history]);

  // Effective product class for the type card + the buy-box winners table.
  // Falls back to 'listing' for older snapshots lacking product_type when the
  // page was opened in listing mode.
  const productType = useMemo<'catalog' | 'user_product' | 'listing' | null>(() => {
    const t = history.length ? (history[history.length - 1].product_type ?? null) : null;
    return t ?? (isListing ? 'listing' : null);
  }, [history, isListing]);

  // The buy-box winners table only makes sense for catalog/user_product (a
  // listing has a single seller, no Buy Box competition).
  const showWinnersTable =
    (productType === 'catalog' || productType === 'user_product') && winners.length > 0;

  const [selectedWinner, setSelectedWinner] = useState<string>('all');
  // The winners menu only makes sense for a catalog with >1 winner over time.
  const showWinners = !isListing && winners.length > 1;
  const filteredHistory = useMemo(
    () =>
      selectedWinner === 'all' || !showWinners
        ? history
        : history.filter((h) => h.ml_public_id === selectedWinner),
    [history, selectedWinner, showWinners],
  );

  // Full series (ascending); the plotted price follows the currency toggle.
  // Scoped to the selected winner (or all). Feeds the chart + range dropdowns.
  const points = useMemo(
    () =>
      filteredHistory.map((h) => ({
        raw: h.snapshot_date,
        date: formatDate(h.snapshot_date, locale),
        price: isUsd ? h.usd_price : h.price,
        ranking: h.ranking_position,
      })),
    [filteredHistory, locale, isUsd],
  );

  // Resolve + clamp the selected range against the loaded history. We key the
  // range off snapshot indices (not dates) so duplicate snapshot dates stay
  // distinguishable. `lo`/`hi` are always a valid, ordered window.
  const lastIdx = Math.max(0, points.length - 1);
  const lo = Math.min(fromIdx ?? 0, lastIdx);
  const hi = Math.min(Math.max(toIdx ?? lastIdx, lo), lastIdx);

  // Everything below — charts, KPIs and the CSV export — is scoped to the range.
  const rangedPoints = useMemo(() => points.slice(lo, hi + 1), [points, lo, hi]);

  const prices = rangedPoints.map((p) => p.price).filter((p): p is number => p !== null);
  // A rank of 0 (or null) means "not in a best-sellers list" — never a real
  // position. Exclude both so "best ranking" reflects the true best (#1 is best),
  // not a sentinel. This guards the KPI even for legacy rows not yet backfilled.
  const rankings = rangedPoints
    .map((p) => p.ranking)
    .filter((r): r is number => r !== null && r > 0);

  const current = prices.length ? prices[prices.length - 1] : null;
  const lowest = prices.length ? Math.min(...prices) : null;
  const highest = prices.length ? Math.max(...prices) : null;
  const bestRanking = rankings.length ? Math.min(...rankings) : null;

  // "Visitas acumuladas" sums the dedicated visits series over the selected
  // range's date window (compared by calendar day, since visit points are
  // date-only while snapshots carry a time).
  const rangeStartDay = rangedPoints.length ? rangedPoints[0].raw.slice(0, 10) : null;
  const rangeEndDay = rangedPoints.length
    ? rangedPoints[rangedPoints.length - 1].raw.slice(0, 10)
    : null;
  const totalVisits = useMemo(() => {
    if (!rangeStartDay || !rangeEndDay) return null;
    const inRange = visitSeries.filter((v) => {
      const day = v.date.slice(0, 10);
      return day >= rangeStartDay && day <= rangeEndDay && v.weekly_visits != null;
    });
    if (!inRange.length) return null;
    return inRange.reduce((sum, v) => sum + (v.weekly_visits ?? 0), 0);
  }, [visitSeries, rangeStartDay, rangeEndDay]);

  const priceFmt = (v: number) => formatCurrency(v, ccyCode, locale);

  const exportCsv = () => {
    const header = [t('colDate'), `${t('colPrice')} (${ccyCode})`];
    const rows = rangedPoints.map((p) => [p.date, p.price ?? '']);
    const meta = [
      [t('colId'), id],
      [t('colName'), productName],
      [],
    ];
    const csv = [...meta, header, ...rows]
      .map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${id}-${ccyCode}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="flex items-center gap-2.5">
            <span className="whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400">
              {t('rangeLabel')}:
            </span>
            <Select
              value={String(lo)}
              onValueChange={(v) => setFromIdx(Number(v))}
              enableClear={false}
              aria-label={t('rangeFrom')}
              className="w-[140px]"
            >
              {points.map((p, i) =>
                i <= hi ? (
                  <SelectItem key={p.raw} value={String(i)}>
                    {p.date}
                  </SelectItem>
                ) : null,
              )}
            </Select>
            <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
            <Select
              value={String(hi)}
              onValueChange={(v) => setToIdx(Number(v))}
              enableClear={false}
              aria-label={t('rangeTo')}
              className="w-[140px]"
            >
              {points.map((p, i) =>
                i >= lo ? (
                  <SelectItem key={p.raw} value={String(i)}>
                    {p.date}
                  </SelectItem>
                ) : null,
              )}
            </Select>
          </div>
          {showWinners && (
            <div className="flex items-center gap-2.5">
              <span className="whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('winnerLabel')}:
              </span>
              <Select
                value={selectedWinner}
                onValueChange={(v) => {
                  setSelectedWinner(v);
                  setFromIdx(null);
                  setToIdx(null);
                }}
                enableClear={false}
                aria-label={t('winnerLabel')}
                className="w-[240px]"
              >
                <SelectItem value="all">{t('allWinners')}</SelectItem>
                {winners.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {`${w.seller ?? w.id}${w.official ? ' ★' : ''} (${w.count})`}
                  </SelectItem>
                ))}
              </Select>
            </div>
          )}
          <div className="flex items-center gap-2">
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
        </div>
        <div className="mb-6 flex flex-wrap gap-3">
          <ProductTypeCard type={productType} t={t} />
          <Kpi label={t('currentPrice')} value={priceFmt(current ?? 0)} />
          <Kpi label={t('lowestPrice')} value={lowest !== null ? priceFmt(lowest) : '—'} />
          <Kpi label={t('highestPrice')} value={highest !== null ? priceFmt(highest) : '—'} />
          <Kpi label={t('bestRanking')} value={bestRanking !== null ? `#${bestRanking}` : '—'} />
          <Kpi
            label={t('totalVisits')}
            value={totalVisits !== null ? formatNumber(totalVisits, locale) : '—'}
          />
          <Kpi label={t('historyCount')} value={formatNumber(rangedPoints.length, locale)} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="flex flex-col dark:!bg-gray-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Title>{t('priceHistory')}</Title>
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
                  {(['chart', 'table'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setPriceView(v)}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        priceView === v
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                      }`}
                      aria-pressed={priceView === v}
                    >
                      {v === 'chart' ? t('viewChart') : t('viewTable')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {priceView === 'chart' ? (
              <HistoryChart
                type="area"
                data={rangedPoints}
                dataKey="price"
                color="#3b82f6"
                valueFormatter={priceFmt}
              />
            ) : (
              <div className="mt-4 max-h-80 overflow-y-auto">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>{t('colDate')}</TableHeaderCell>
                      <TableHeaderCell className="text-right">{t('colPrice')}</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rangedPoints.map((p) => (
                      <TableRow key={p.raw}>
                        <TableCell>{p.date}</TableCell>
                        <TableCell className="text-right">
                          {p.price !== null ? priceFmt(p.price) : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="mt-4 flex justify-end border-t border-gray-100 pt-3 dark:border-gray-800">
              <button
                type="button"
                onClick={exportCsv}
                disabled={rangedPoints.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:text-white"
              >
                <Download className="h-4 w-4" />
                {t('exportCsv')}
              </button>
            </div>
          </Card>

          <Card className="dark:!bg-gray-900">
            <Title>{t('rankingHistory')}</Title>
            <Text className="mt-1">{t('rankingNote')}</Text>
            <HistoryChart
              type="line"
              data={rangedPoints.filter((d) => d.ranking !== null && d.ranking > 0)}
              dataKey="ranking"
              color="#f59e0b"
              valueFormatter={(v) => `#${v}`}
            />
          </Card>
        </div>

        {showWinnersTable && (
          <Card className="mt-6 dark:!bg-gray-900">
            <Title>{t('buyboxWinners')}</Title>
            <Text className="mt-1">{t('buyboxNote')}</Text>
            <div className="mt-4 max-h-80 overflow-y-auto">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>{t('colSeller')}</TableHeaderCell>
                    <TableHeaderCell className="text-right">{t('colPrice')}</TableHeaderCell>
                    <TableHeaderCell className="text-right">{t('colDiscount')}</TableHeaderCell>
                    <TableHeaderCell className="text-right">{t('colDate')}</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {winners.map((w) => {
                    const price = isUsd ? w.usdPrice : w.price;
                    return (
                      <TableRow key={w.id}>
                        <TableCell>
                          {(w.seller ?? w.id) + (w.official ? ' ★' : '')}
                        </TableCell>
                        <TableCell className="text-right">
                          {price !== null ? priceFmt(price) : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {w.discount ? formatPercent(w.discount, locale) : t('noDiscount')}
                        </TableCell>
                        <TableCell className="text-right">{formatDate(w.lastDate, locale)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
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

  // Size the Y axis to the widest tick label so currencies with many digits
  // (e.g. COP) are not clipped. ~6.5px per char at fontSize 11 + padding.
  const maxLabelLen = data.reduce((max, d) => {
    const v = d[dataKey];
    return v === null ? max : Math.max(max, valueFormatter(v).length);
  }, 0);
  const yAxisWidth = Math.max(56, Math.ceil(maxLabelLen * 6.5) + 16);

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
            <YAxis tickFormatter={valueFormatter} width={yAxisWidth} {...axisProps} />
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
              width={yAxisWidth}
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
    <Card className="!w-auto !px-4 !py-3 dark:!bg-gray-900">
      <Text className="text-xs">{label}</Text>
      <Metric className="mt-1 text-center text-lg">{value}</Metric>
    </Card>
  );
}

/**
 * KPI-style card naming the product's class (catalog / user_product / listing),
 * with a hover info bubble explaining what each type means.
 */
function ProductTypeCard({
  type,
  t,
}: {
  type: 'catalog' | 'user_product' | 'listing' | null;
  t: (key: string) => string;
}) {
  const label =
    type === 'catalog'
      ? t('typeCatalog')
      : type === 'user_product'
        ? t('typeUserProduct')
        : type === 'listing'
          ? t('typeListing')
          : t('typeUnknown');

  const rows: Array<[string, string, string]> = [
    ['catalog', t('typeCatalog'), t('typeCatalogDesc')],
    ['user_product', t('typeUserProduct'), t('typeUserProductDesc')],
    ['listing', t('typeListing'), t('typeListingDesc')],
  ];

  return (
    <Card className="!w-auto !px-4 !py-3 dark:!bg-gray-900">
      <div className="flex items-center justify-center gap-1.5">
        <Text className="text-xs">{t('productType')}</Text>
        <span className="group relative inline-flex">
          <Info className="h-3.5 w-3.5 cursor-help text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
          <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-72 -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-3 text-left text-xs opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 dark:border-gray-700 dark:bg-gray-800">
            <p className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
              {t('typeInfoTitle')}
            </p>
            <ul className="space-y-1.5">
              {rows.map(([key, name, desc]) => (
                <li key={key}>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{name}: </span>
                  <span className="text-gray-600 dark:text-gray-300">{desc}</span>
                </li>
              ))}
            </ul>
          </div>
        </span>
      </div>
      <p className="mt-1 text-center text-lg font-semibold text-gray-900 dark:text-white">
        {label}
      </p>
    </Card>
  );
}
