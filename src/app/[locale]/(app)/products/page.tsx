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
import { siteCountryCode, siteName } from '@/lib/ml-sites';
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

  // Flag shown in the country select's closed control. Tremor renders only the
  // selected item's text in the trigger, so the per-item flag span is dropped;
  // the `icon` prop is the supported slot for leading content. Undefined when
  // "all countries" is selected so no flag is shown.
  const SelectedCountryFlag = useMemo(() => {
    const code = country === ALL ? null : siteCountryCode(country);
    if (!code) return undefined;
    const Flag = () => <span className={`fi fi-${code} !h-4 !w-5`} />;
    Flag.displayName = 'SelectedCountryFlag';
    return Flag;
  }, [country]);

  // The header lives in its own (non-scrolling) table so the body's scrollbar
  // starts at the header divider instead of running the full height. This
  // border-b draws that divider line.
  const headerClass =
    'border-b border-tremor-border bg-white dark:border-dark-tremor-border dark:bg-gray-900';

  // Shared column widths for the header and body tables. Both use `table-fixed`
  // + this same colgroup so their columns line up exactly; the product-name
  // column is left unsized so it absorbs the remaining width.
  const colGroup = (
    <colgroup>
      <col />
      {country === ALL && <col className="w-[4.5rem]" />}
      <col className="w-28" />
      <col className="w-16" />
      <col className="w-24" />
      <col className="w-24" />
      <col className="w-24" />
      <col className="w-44" />
      <col className="w-24" />
      <col className="w-32" />
    </colgroup>
  );

  return (
    <div className="flex h-full flex-col">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      {/* Filters */}
      <Card className="mb-4 !p-3 dark:!bg-gray-900">
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
            icon={SelectedCountryFlag}
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
                {siteCountryCode(c.country) && (
                  <span className={`fi fi-${siteCountryCode(c.country)} mr-2`} />
                )}
                {siteName(c.country)}
              </SelectItem>
            ))}
          </Select>
          <SearchSelect
            value={categorySel}
            enableClear={categorySel !== ALL}
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
                  : c.name}
              </SearchSelectItem>
            ))}
          </SearchSelect>
          <div className="flex items-center gap-2 self-center">
            {meta && (
              <span className="whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('resultsCount', { count: formatNumber(meta.total, locale) })}
              </span>
            )}
            <span className="ml-auto whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400">
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

      <Card className="flex min-h-0 flex-1 flex-col !py-3 !pr-0 dark:!bg-gray-900">
        <DataState
          isLoading={isLoading}
          isError={isError}
          isEmpty={isEmpty}
          onRetry={() => refetch()}
        >
          <div className="flex min-h-0 flex-1 flex-col">
            {/* Static header. Reserves a scrollbar-width gutter (its own
                scrollbar is transparent) so its columns align with the body,
                whose scrollbar starts right at this header's divider line. */}
            <div className="shrink-0 overflow-y-scroll [&::-webkit-scrollbar-thumb]:bg-transparent [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-2.5">
              <table className="w-full table-fixed text-tremor-default text-tremor-content dark:text-dark-tremor-content [&_th]:px-2">
                {colGroup}
                <TableHead>
                  <TableRow>
                    <TableHeaderCell className={headerClass}>{t('colName')}</TableHeaderCell>
                    {country === ALL && (
                      <TableHeaderCell className={headerClass}>{common('country')}</TableHeaderCell>
                    )}
                    <TableHeaderCell className={`${headerClass} text-right`}>{t('colPrice')}</TableHeaderCell>
                    <TableHeaderCell className={`${headerClass} text-right`}>{t('colDiscount')}</TableHeaderCell>
                    <TableHeaderCell className={`${headerClass} text-right`}>{t('colSold')}</TableHeaderCell>
                    <TableHeaderCell className={`${headerClass} text-right`}>{t('colRating')}</TableHeaderCell>
                    <TableHeaderCell className={`${headerClass} text-right`}>{t('colRanking')}</TableHeaderCell>
                    <TableHeaderCell className={headerClass}>{t('colSeller')}</TableHeaderCell>
                    <TableHeaderCell className={`${headerClass} text-right`}>{t('colHistory')}</TableHeaderCell>
                    <TableHeaderCell className={`${headerClass} text-right !pr-5`}>{t('colLastSnapshot')}</TableHeaderCell>
                  </TableRow>
                </TableHead>
              </table>
            </div>
            {/* Scrolling body; its scrollbar begins at the header divider. */}
            <div className="min-h-0 flex-1 overflow-y-scroll [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar]:w-2.5 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600">
              <table className="w-full table-fixed text-tremor-default text-tremor-content dark:text-dark-tremor-content [&_td]:px-2">
                {colGroup}
                <TableBody>
                  {rows.map((p) => (
                    <ProductRow key={p.id} product={p} currency={currency} locale={locale} officialLabel={t('official')} showCountry={country === ALL} />
                  ))}
                </TableBody>
              </table>
            </div>
          </div>

          {meta && (
            <div className="mt-4 flex shrink-0 items-center justify-between pr-6">
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
    </div>
  );
}

function detailHref(p: Product): string | null {
  // Identify by canonical_id (catalog_id for catalog products, else ml_public_id)
  // so a catalog opens its catalog-level history, not just the current winner's.
  // `?listing=1` only for non-catalog listings (their history is keyed by
  // ml_public_id). Falls back to the raw ids for rows predating canonical_id.
  const id = p.canonical_id ?? p.catalog_id ?? p.ml_public_id;
  if (!id) return null;
  // The history is keyed by catalog_id when the product has one (canonical_id ==
  // catalog_id), else by ml_public_id (?listing=1). This follows catalog
  // membership, not product_type — a /up/ user_product WITH a catalog_id still
  // opens its catalog-level history.
  const isCatalog = !!p.catalog_id;
  return `/products/${encodeURIComponent(id)}${isCatalog ? '' : '?listing=1'}`;
}

function ProductRow({
  product: p,
  currency,
  locale,
  officialLabel,
  showCountry,
}: {
  product: Product;
  currency: 'local' | 'usd';
  locale: string;
  officialLabel: string;
  showCountry: boolean;
}) {
  const href = detailHref(p);
  const price =
    currency === 'usd'
      ? formatCurrency(p.usd_price, 'USD', locale)
      : formatCurrency(p.price, p.currency ?? 'USD', locale);

  return (
    <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <TableCell className="w-full min-w-[12rem] max-w-md whitespace-normal break-words align-top">
        {href ? (
          <Link href={href} className="font-medium text-blue-600 hover:underline">
            {p.name}
          </Link>
        ) : (
          <span className="text-gray-900 dark:text-gray-100">{p.name}</span>
        )}
        <span className="mt-0.5 block text-xs text-gray-400">{p.category?.name}</span>
      </TableCell>
      {showCountry && (
        <TableCell className="whitespace-nowrap text-gray-700 dark:text-gray-300">
          {siteName(p.country)}
        </TableCell>
      )}
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
      <TableCell className="text-right tabular-nums whitespace-nowrap !pr-5">
        {formatDate(p.last_snapshot_date, locale)}
      </TableCell>
    </TableRow>
  );
}
