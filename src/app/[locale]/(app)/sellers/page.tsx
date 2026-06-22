'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import {
  Badge,
  BarList,
  Card,
  DonutChart,
  Legend,
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
import { formatNumber } from '@/lib/format';
import { siteName } from '@/lib/ml-sites';

const ALL = 'all';
const SAMPLE = 100;

interface SellerAgg {
  name: string;
  count: number;
  official: boolean;
}

export default function SellersPage() {
  const t = useTranslations('sellers');
  const products = useTranslations('products');
  const locale = useLocale();
  const [country, setCountry] = useState(ALL);

  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: getStats });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['products-sample', 'sellers', country],
    queryFn: () =>
      getProducts({
        limit: SAMPLE,
        country: country === ALL ? undefined : country,
      }),
  });

  const rows = data?.data ?? [];
  const isEmpty = !!data && rows.length === 0;

  const { sellers, officialSplit } = useMemo(() => {
    const map = new Map<string, SellerAgg>();
    let official = 0;
    let nonOfficial = 0;
    for (const p of rows) {
      const name = p.seller?.nickname ?? '—';
      const entry = map.get(name) ?? { name, count: 0, official: p.seller?.is_official_store ?? false };
      entry.count += 1;
      map.set(name, entry);
      if (p.seller?.is_official_store) official += 1;
      else nonOfficial += 1;
    }
    return {
      sellers: [...map.values()].sort((a, b) => b.count - a.count),
      officialSplit: [
        { name: t('official'), value: official },
        { name: t('notOfficial'), value: nonOfficial },
      ],
    };
  }, [rows, t]);

  const barData = sellers.slice(0, 10).map((s) => ({ name: s.name, value: s.count }));

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
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <Card className="dark:!bg-gray-900">
            <Title>{t('topSellers')}</Title>
            <BarList data={barData} className="mt-4" color="indigo" />
          </Card>
          <Card className="dark:!bg-gray-900">
            <Title>{t('officialVsNot')}</Title>
            <DonutChart
              className="mt-4 h-52"
              data={officialSplit}
              category="value"
              index="name"
              colors={['blue', 'gray']}
            />
            <Legend
              className="mt-3 justify-center"
              categories={officialSplit.map((s) => s.name)}
              colors={['blue', 'gray']}
            />
          </Card>
        </div>

        <Card className="dark:!bg-gray-900">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{t('colSeller')}</TableHeaderCell>
                <TableHeaderCell className="text-right">{t('colProducts')}</TableHeaderCell>
                <TableHeaderCell>{t('colOfficial')}</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sellers.map((s) => (
                <TableRow key={s.name}>
                  <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                    {s.name}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(s.count, locale)}
                  </TableCell>
                  <TableCell>
                    {s.official ? <Badge color="blue" size="xs">{t('official')}</Badge> : '—'}
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
