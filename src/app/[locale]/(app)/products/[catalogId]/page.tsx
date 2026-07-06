'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  Card,
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
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Camera,
  CircleDollarSign,
  Download,
  Eye,
  Info,
  TrendingDown,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { DataState } from '@/components/app/data-state';
import { HistoryChart } from '@/components/app/history-chart';
import { getProductHistory } from '@/lib/api/endpoints';
import { formatCurrency, formatDate, formatNumber, formatPercent } from '@/lib/format';
import { Link } from '@/i18n/navigation';

type Currency = 'local' | 'usd';

type View = 'price' | 'ranking' | 'table';

// Categorical palette for the visits donut, validated for CVD separation and
// contrast against both light and dark surfaces (see dataviz six checks).
const SHARE_PALETTE = ['#3b82f6', '#d97706', '#0891b2', '#8b5cf6', '#059669'];

export default function ProductDetailPage() {
  const t = useTranslations('productDetail');
  const locale = useLocale();
  const params = useParams<{ catalogId: string }>();
  const searchParams = useSearchParams();
  const isListing = searchParams.get('listing') === '1';
  const id = decodeURIComponent(params.catalogId);
  const [view, setView] = useState<View>('price');
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
  const latest = history.length ? history[history.length - 1] : null;

  // Local currency code (from the latest snapshot); USD when the toggle is on.
  const localCcy = latest?.currency ?? 'USD';
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

  // Visits broken down per buy-box winner. Visits are a dense daily series with
  // no seller of their own, so we attribute each day to whichever winner held
  // the Buy Box that day — the most recent snapshot on or before it. The
  // per-winner totals reconcile with "Visitas acumuladas" over the full history.
  const visitsByWinner = useMemo(() => {
    const totals = new Map<string, number>();
    // Snapshots naming a winner, ascending by day (history is ascending).
    const marks = history
      .filter((h) => h.ml_public_id)
      .map((h) => ({ day: h.snapshot_date.slice(0, 10), id: h.ml_public_id! }));
    for (const v of visitSeries) {
      if (v.weekly_visits == null) continue;
      const day = v.date.slice(0, 10);
      let winnerId: string | null = null;
      for (const m of marks) {
        if (m.day <= day) winnerId = m.id;
        else break;
      }
      if (!winnerId) continue;
      totals.set(winnerId, (totals.get(winnerId) ?? 0) + v.weekly_visits);
    }
    return totals;
  }, [history, visitSeries]);

  // Effective product class for the type badge + the buy-box winners table.
  // Falls back to 'listing' for older snapshots lacking product_type when the
  // page was opened in listing mode.
  const productType = useMemo<'catalog' | 'user_product' | 'listing' | null>(() => {
    const pt = latest?.product_type ?? null;
    return pt ?? (isListing ? 'listing' : null);
  }, [latest, isListing]);

  // The buy-box panels/table only make sense for catalog/user_product (a
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
  const previous = prices.length > 1 ? prices[prices.length - 2] : null;
  const lowest = prices.length ? Math.min(...prices) : null;
  const highest = prices.length ? Math.max(...prices) : null;
  const bestRanking = rankings.length ? Math.min(...rankings) : null;

  // Price movement vs the previous snapshot in the range, as a percentage.
  const priceDelta =
    current !== null && previous !== null && previous !== 0
      ? ((current - previous) / previous) * 100
      : null;

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

  // Visits share per winner for the donut; beyond 5 entries the tail folds
  // into "Others" so identity stays readable (never a generated 6th hue).
  const visitShares = useMemo(() => {
    const entries = winners
      .map((w) => ({
        name: (w.seller ?? w.id) + (w.official ? ' ★' : ''),
        value: visitsByWinner.get(w.id) ?? 0,
      }))
      .filter((e) => e.value > 0)
      .sort((a, b) => b.value - a.value);
    if (entries.length <= SHARE_PALETTE.length) return entries;
    const top = entries.slice(0, SHARE_PALETTE.length - 1);
    const rest = entries.slice(SHARE_PALETTE.length - 1).reduce((s, e) => s + e.value, 0);
    return [...top, { name: t('others'), value: rest }];
  }, [winners, visitsByWinner, t]);

  const totalSnapshotsWon = winners.reduce((sum, w) => sum + w.count, 0);

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

  const tabs: Array<{ key: View; label: string }> = [
    { key: 'price', label: t('priceHistory') },
    { key: 'ranking', label: t('rankingHistory') },
    { key: 'table', label: t('viewTable') },
  ];

  return (
    <>
      <Link
        href="/products"
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('back')}
      </Link>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          {productName}
        </h1>
        <ProductTypeBadge type={productType} t={t} />
      </div>

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

        {/* KPI strip — connected stat tiles with hairline dividers */}
        <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-gray-200 bg-gray-200 shadow-sm sm:grid-cols-3 xl:grid-cols-6 dark:border-gray-800 dark:bg-gray-800">
          <Stat
            icon={CircleDollarSign}
            label={t('currentPrice')}
            value={current !== null ? priceFmt(current) : '—'}
            delta={
              priceDelta !== null
                ? {
                    dir: priceDelta >= 0 ? 'up' : 'down',
                    text: `${priceDelta > 0 ? '+' : ''}${formatPercent(priceDelta, locale)} ${t('vsPrev')}`,
                  }
                : undefined
            }
          />
          <Stat
            icon={ArrowDownRight}
            label={t('lowestPrice')}
            value={lowest !== null ? priceFmt(lowest) : '—'}
          />
          <Stat
            icon={ArrowUpRight}
            label={t('highestPrice')}
            value={highest !== null ? priceFmt(highest) : '—'}
          />
          <Stat
            icon={Trophy}
            label={t('bestRanking')}
            value={bestRanking !== null ? `#${bestRanking}` : '—'}
          />
          <Stat
            icon={Eye}
            label={t('totalVisits')}
            value={totalVisits !== null ? formatNumber(totalVisits, locale) : '—'}
          />
          <Stat
            icon={Camera}
            label={t('historyCount')}
            value={formatNumber(rangedPoints.length, locale)}
          />
        </div>

        {/* Main chart card with tab switcher */}
        <Card className="dark:!bg-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-800">
            <div className="flex gap-6">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setView(tab.key)}
                  aria-pressed={view === tab.key}
                  className={`-mb-px border-b-2 pb-2.5 text-sm font-medium transition-colors ${
                    view === tab.key
                      ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={exportCsv}
              disabled={rangedPoints.length === 0}
              className="mb-1.5 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:text-white"
            >
              <Download className="h-4 w-4" />
              {t('exportCsv')}
            </button>
          </div>

          {view === 'price' && (
            <HistoryChart
              type="area"
              data={rangedPoints}
              dataKey="price"
              color="#3b82f6"
              valueFormatter={priceFmt}
            />
          )}
          {view === 'ranking' && (
            <>
              <Text className="mt-3">{t('rankingNote')}</Text>
              <HistoryChart
                type="line"
                data={rangedPoints.filter((d) => d.ranking !== null && d.ranking > 0)}
                dataKey="ranking"
                color="#f59e0b"
                valueFormatter={(v) => `#${v}`}
              />
            </>
          )}
          {view === 'table' && (
            <div className="mt-4 max-h-96 overflow-y-auto">
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
        </Card>

        {/* Breakdown panels */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {showWinnersTable && (
            <Card className="dark:!bg-gray-900">
              <Title>{t('buyboxShare')}</Title>
              <Text className="mt-1">{t('buyboxShareNote')}</Text>
              <ul className="mt-5 space-y-4">
                {winners.slice(0, 6).map((w) => {
                  const share = totalSnapshotsWon ? (w.count / totalSnapshotsWon) * 100 : 0;
                  return (
                    <li key={w.id}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="truncate font-medium text-gray-700 dark:text-gray-300">
                          {(w.seller ?? w.id) + (w.official ? ' ★' : '')}
                        </span>
                        <span className="shrink-0 text-gray-500 dark:text-gray-400">
                          {formatNumber(w.count, locale)} · {formatPercent(share, locale)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                        <div
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${share}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          {showWinnersTable && visitShares.length > 0 && (
            <Card className="dark:!bg-gray-900">
              <Title>{t('visitsShare')}</Title>
              <Text className="mt-1">{t('visitsShareNote')}</Text>
              <ShareDonut data={visitShares} locale={locale} />
            </Card>
          )}

          <Card className="dark:!bg-gray-900">
            <Title>{t('details')}</Title>
            <dl className="mt-4 divide-y divide-gray-100 text-sm dark:divide-gray-800">
              <DetailRow label={t('colId')} value={id} mono />
              <DetailRow
                label={t('productType')}
                value={typeLabel(productType, t)}
              />
              <DetailRow label={t('detailCurrency')} value={localCcy} />
              <DetailRow
                label={t('detailLastSnapshot')}
                value={latest ? formatDate(latest.snapshot_date, locale) : '—'}
              />
              <DetailRow
                label={t('detailSeller')}
                value={latest?.seller?.nickname ?? '—'}
              />
              <DetailRow
                label={t('detailOfficial')}
                value={latest?.seller?.is_official_store ? t('yes') : t('no')}
              />
              <DetailRow
                label={t('detailDiscount')}
                value={
                  latest?.discount_pct
                    ? formatPercent(latest.discount_pct, locale)
                    : t('noDiscount')
                }
              />
            </dl>
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
                    <TableHeaderCell className="text-right">{t('colVisits')}</TableHeaderCell>
                    <TableHeaderCell className="text-right">{t('colDate')}</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {winners.map((w) => {
                    const price = isUsd ? w.usdPrice : w.price;
                    const visits = visitsByWinner.get(w.id);
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
                        <TableCell className="text-right">
                          {visits != null ? formatNumber(visits, locale) : '—'}
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

/** One tile of the connected KPI strip: icon + label, value, optional delta. */
function Stat({
  icon: Icon,
  label,
  value,
  delta,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: { dir: 'up' | 'down'; text: string };
}) {
  return (
    <div className="bg-white px-5 py-4 dark:bg-gray-900">
      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-1.5 truncate text-xl font-bold tracking-tight text-gray-900 dark:text-white">
        {value}
      </p>
      {delta && (
        <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          {delta.dir === 'up' ? (
            <TrendingUp className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="truncate">{delta.text}</span>
        </p>
      )}
    </div>
  );
}

/** One row of the details panel. */
function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-gray-500 dark:text-gray-400">{label}</dt>
      <dd
        className={`truncate text-right font-medium text-gray-900 dark:text-gray-100 ${mono ? 'font-mono text-xs' : ''}`}
      >
        {value}
      </dd>
    </div>
  );
}

function typeLabel(
  type: 'catalog' | 'user_product' | 'listing' | null,
  t: (key: string) => string,
) {
  return type === 'catalog'
    ? t('typeCatalog')
    : type === 'user_product'
      ? t('typeUserProduct')
      : type === 'listing'
        ? t('typeListing')
        : t('typeUnknown');
}

/**
 * Donut of visits share per buy-box winner, with a labeled legend (identity is
 * carried by the legend text + percentages, never by color alone).
 */
function ShareDonut({
  data,
  locale,
}: {
  data: Array<{ name: string; value: number }>;
  locale: string;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <div className="mt-4">
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="95%"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {data.map((d, i) => (
                <Cell
                  key={d.name}
                  fill={SHARE_PALETTE[i % SHARE_PALETTE.length]}
                  className="stroke-white dark:stroke-gray-900"
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-md dark:border-gray-700 dark:bg-gray-800">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {payload[0].name}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300">
                      {formatNumber(payload[0].value as number, locale)}
                    </p>
                  </div>
                ) : null
              }
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-4 space-y-2 text-sm">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: SHARE_PALETTE[i % SHARE_PALETTE.length] }}
              />
              <span className="truncate text-gray-700 dark:text-gray-300">{d.name}</span>
            </span>
            <span className="shrink-0 font-medium text-gray-900 dark:text-gray-100">
              {total ? formatPercent((d.value / total) * 100, locale) : '—'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Badge naming the product's class (catalog / user_product / listing), with a
 * hover info bubble explaining what each type means.
 */
function ProductTypeBadge({
  type,
  t,
}: {
  type: 'catalog' | 'user_product' | 'listing' | null;
  t: (key: string) => string;
}) {
  const rows: Array<[string, string, string]> = [
    ['catalog', t('typeCatalog'), t('typeCatalogDesc')],
    ['user_product', t('typeUserProduct'), t('typeUserProductDesc')],
    ['listing', t('typeListing'), t('typeListingDesc')],
  ];

  return (
    <span className="group relative inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
      {typeLabel(type, t)}
      <Info className="h-3.5 w-3.5 cursor-help" />
      <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-72 -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-3 text-left text-xs font-normal opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 dark:border-gray-700 dark:bg-gray-800">
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
  );
}
