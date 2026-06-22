'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import {
  BarList,
  Card,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Title,
} from '@tremor/react';
import { DataState } from '@/components/app/data-state';
import { PageHeader } from '@/components/app/page-header';
import { getProducts, getStats } from '@/lib/api/endpoints';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format';
import { siteName } from '@/lib/ml-sites';

const ALL = 'all';
const SAMPLE = 100;

interface CategoryAgg {
  name: string;
  count: number;
  avgPrice: number;
  avgDiscount: number;
  officialShare: number;
}

export default function CategoriesPage() {
  const t = useTranslations('categories');
  const products = useTranslations('products');
  const locale = useLocale();
  const [country, setCountry] = useState(ALL);

  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: getStats });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['products-sample', 'categories', country],
    queryFn: () =>
      getProducts({
        limit: SAMPLE,
        country: country === ALL ? undefined : country,
      }),
  });

  const rows = data?.data ?? [];
  const isEmpty = !!data && rows.length === 0;

  const aggregates = useMemo<CategoryAgg[]>(() => {
    const map = new Map<string, { count: number; priceSum: number; priceN: number; discSum: number; discN: number; official: number }>();
    for (const p of rows) {
      const key = p.category?.name ?? '—';
      const entry = map.get(key) ?? { count: 0, priceSum: 0, priceN: 0, discSum: 0, discN: 0, official: 0 };
      entry.count += 1;
      const price = p.usd_price ?? p.price;
      if (price != null) {
        entry.priceSum += price;
        entry.priceN += 1;
      }
      if (p.discount_pct != null) {
        entry.discSum += p.discount_pct;
        entry.discN += 1;
      }
      if (p.seller?.is_official_store) entry.official += 1;
      map.set(key, entry);
    }
    return [...map.entries()]
      .map(([name, e]) => ({
        name,
        count: e.count,
        avgPrice: e.priceN ? e.priceSum / e.priceN : 0,
        avgDiscount: e.discN ? e.discSum / e.discN : 0,
        officialShare: e.count ? (e.official / e.count) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [rows]);

  const barData = aggregates.slice(0, 10).map((a) => ({ name: a.name, value: a.count }));

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        action={
          <Select value={country} onValueChange={setCountry} className="max-w-[200px]">
            <SelectItem value={ALL}>{products('allCountries')}</SelectItem>
            {(stats?.by_country ?? []).map((c) => (
              <SelectItem key={c.country} value={c.country}>
                {siteName(c.country)}
              </SelectItem>
            ))}
          </Select>
        }
      />

      <DataState isLoading={isLoading} isError={isError} isEmpty={isEmpty} onRetry={() => refetch()}>
        <Card className="mb-6 dark:!bg-gray-900">
          <Title>{t('topByProducts')}</Title>
          <BarList data={barData} className="mt-4" color="blue" />
        </Card>

        <Card className="dark:!bg-gray-900">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{t('colCategory')}</TableHeaderCell>
                <TableHeaderCell className="text-right">{t('colProducts')}</TableHeaderCell>
                <TableHeaderCell className="text-right">{t('colAvgPrice')}</TableHeaderCell>
                <TableHeaderCell className="text-right">{t('colAvgDiscount')}</TableHeaderCell>
                <TableHeaderCell className="text-right">{t('colOfficial')}</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {aggregates.map((a) => (
                <TableRow key={a.name}>
                  <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                    {a.name}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(a.count, locale)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(a.avgPrice, 'USD', locale)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPercent(a.avgDiscount, locale)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPercent(a.officialShare, locale)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </DataState>
    </>
  );
}
