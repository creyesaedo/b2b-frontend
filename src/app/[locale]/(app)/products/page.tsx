'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  SearchSelect,
  SearchSelectItem,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TextInput,
} from '@tremor/react';
import { ChevronLeft, ChevronRight, Search, Star } from 'lucide-react';
import { DataState } from '@/components/app/data-state';
import { PageHeader } from '@/components/app/page-header';
import { getProductCategories, getProducts, getStats } from '@/lib/api/endpoints';
import { formatCurrency, formatDate, formatNumber, formatPercent } from '@/lib/format';
import { siteName } from '@/lib/ml-sites';
import { useDebounce } from '@/lib/use-debounce';
import { Link } from '@/i18n/navigation';
import type { Product } from '@/lib/types';

const PAGE_SIZE = 20;
const ALL = 'all';

export default function ProductsPage() {
  const t = useTranslations('products');
  const common = useTranslations('common');
  const locale = useLocale();

  const searchParams = useSearchParams();
  const [country, setCountry] = useState(searchParams.get('country') ?? ALL);
  // Encodes the selected facet: 'all' | `g:<id>` (canonical) | `c:<id>` (per-country).
  const [categorySel, setCategorySel] = useState(ALL);
  const [searchInput, setSearchInput] = useState('');
  const [currency, setCurrency] = useState<'local' | 'usd'>('local');
  const [page, setPage] = useState(1);
  const search = useDebounce(searchInput, 400);

  // Reset to page 1 whenever a filter changes.
  const resetPage = () => setPage(1);

  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: getStats });

  // Categories that actually have products (derived from the products table by
  // the backend), so the filter never lists empty categories. Scoped to the
  // selected country; when "all", entries are disambiguated by country since the
  // same category name exists per country.
  const { data: categoryOptions = [] } = useQuery({
    queryKey: ['product-categories', country],
    queryFn: () => getProductCategories(country === ALL ? undefined : country),
  });

  const params = useMemo(() => {
    const [kind, idStr] = categorySel === ALL ? [null, null] : categorySel.split(':');
    return {
      page,
      limit: PAGE_SIZE,
      country: country === ALL ? undefined : country,
      category_id: kind === 'c' ? idStr! : undefined,
      global_category_id: kind === 'g' ? idStr! : undefined,
      search: search || undefined,
    };
  }, [page, country, categorySel, search]);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['products', params],
    queryFn: () => getProducts(params),
    placeholderData: keepPreviousData,
  });

  const rows = data?.data ?? [];
  const meta = data?.meta;
  const isEmpty = !!data && rows.length === 0;

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        action={
          meta ? (
            <span className="text-sm text-gray-500">
              {t('resultsCount', { count: formatNumber(meta.total, locale) })}
            </span>
          ) : undefined
        }
      />

      {/* Filters */}
      <Card className="mb-4 dark:!bg-gray-900">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <TextInput
            icon={Search}
            placeholder={t('searchPlaceholder')}
            value={searchInput}
            onValueChange={(v) => {
              setSearchInput(v);
              resetPage();
            }}
          />
          <Select
            value={country}
            onValueChange={(v) => {
              setCountry(v);
              setCategorySel(ALL);
              resetPage();
            }}
          >
            <SelectItem value={ALL}>{t('allCountries')}</SelectItem>
            {(stats?.by_country ?? []).map((c) => (
              <SelectItem key={c.country} value={c.country}>
                {siteName(c.country)}
              </SelectItem>
            ))}
          </Select>
          <SearchSelect
            value={categorySel}
            onValueChange={(v) => {
              setCategorySel(v || ALL);
              resetPage();
            }}
          >
            <SearchSelectItem value={ALL}>{t('allCategories')}</SearchSelectItem>
            {categoryOptions.map((c) => (
              <SearchSelectItem
                key={`${c.kind}:${c.id}`}
                value={`${c.kind === 'global' ? 'g' : 'c'}:${c.id}`}
              >
                {c.kind === 'category' && country === ALL
                  ? `${c.name} · ${siteName(c.country)}`
                  : c.name}{' '}
                ({c.product_count})
              </SearchSelectItem>
            ))}
          </SearchSelect>
          <div className="flex items-center justify-end gap-2 self-center">
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
      </Card>

      <Card className="dark:!bg-gray-900">
        <DataState
          isLoading={isLoading}
          isError={isError}
          isEmpty={isEmpty}
          onRetry={() => refetch()}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{t('colName')}</TableHeaderCell>
                <TableHeaderCell>{common('country')}</TableHeaderCell>
                <TableHeaderCell className="text-right">{t('colPrice')}</TableHeaderCell>
                <TableHeaderCell className="text-right">{t('colDiscount')}</TableHeaderCell>
                <TableHeaderCell className="text-right">{t('colSold')}</TableHeaderCell>
                <TableHeaderCell className="text-right">{t('colRating')}</TableHeaderCell>
                <TableHeaderCell className="text-right">{t('colRanking')}</TableHeaderCell>
                <TableHeaderCell>{t('colSeller')}</TableHeaderCell>
                <TableHeaderCell className="text-right">{t('colHistory')}</TableHeaderCell>
                <TableHeaderCell className="text-right">{t('colLastSnapshot')}</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((p) => (
                <ProductRow key={p.id} product={p} currency={currency} locale={locale} officialLabel={t('official')} />
              ))}
            </TableBody>
          </Table>

          {meta && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {common('page')} {meta.page} {common('of')} {meta.total_pages || 1}
              </span>
              <div className="flex gap-2">
                <Button
                  size="xs"
                  variant="secondary"
                  icon={ChevronLeft}
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  {common('previous')}
                </Button>
                <Button
                  size="xs"
                  variant="secondary"
                  iconPosition="right"
                  icon={ChevronRight}
                  disabled={!!meta && page >= meta.total_pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {common('next')}
                </Button>
              </div>
            </div>
          )}
        </DataState>
      </Card>
    </>
  );
}

function detailHref(p: Product): string | null {
  // Prefer the listing id so the detail history matches this row's snapshot_count.
  if (p.ml_public_id) return `/products/${encodeURIComponent(p.ml_public_id)}?listing=1`;
  if (p.catalog_id) return `/products/${encodeURIComponent(p.catalog_id)}`;
  return null;
}

function ProductRow({
  product: p,
  currency,
  locale,
  officialLabel,
}: {
  product: Product;
  currency: 'local' | 'usd';
  locale: string;
  officialLabel: string;
}) {
  const href = detailHref(p);
  const price =
    currency === 'usd'
      ? formatCurrency(p.usd_price, 'USD', locale)
      : formatCurrency(p.price, p.currency ?? 'USD', locale);

  return (
    <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <TableCell className="max-w-xs whitespace-normal break-words align-top">
        {href ? (
          <Link href={href} className="font-medium text-blue-600 hover:underline">
            {p.name}
          </Link>
        ) : (
          <span className="text-gray-900 dark:text-gray-100">{p.name}</span>
        )}
        <span className="mt-0.5 block text-xs text-gray-400">{p.category?.name}</span>
      </TableCell>
      <TableCell className="whitespace-nowrap text-gray-700 dark:text-gray-300">
        {siteName(p.country)}
      </TableCell>
      <TableCell className="text-right tabular-nums">{price}</TableCell>
      <TableCell className="text-right tabular-nums">
        {p.discount_pct ? (
          <span className="text-emerald-600">-{formatPercent(p.discount_pct, locale)}</span>
        ) : (
          '—'
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {p.sold_count !== null ? formatNumber(p.sold_count, locale) : '—'}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {p.rating !== null ? (
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {p.rating.toFixed(1)}
          </span>
        ) : (
          '—'
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {p.ranking_position !== null ? `#${p.ranking_position}` : '—'}
      </TableCell>
      <TableCell>
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {p.seller?.nickname ?? '—'}
        </span>
        {p.seller?.is_official_store && (
          <Badge color="blue" size="xs" className="ml-2">
            {officialLabel}
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatNumber(p.snapshot_count, locale)}
      </TableCell>
      <TableCell className="text-right tabular-nums whitespace-nowrap">
        {formatDate(p.last_snapshot_date, locale)}
      </TableCell>
    </TableRow>
  );
}
