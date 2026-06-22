'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TextInput,
  Title,
} from '@tremor/react';
import { ArrowLeft, Search, Trash2, X } from 'lucide-react';
import { DataState } from '@/components/app/data-state';
import { PageHeader } from '@/components/app/page-header';
import { Link } from '@/i18n/navigation';
import * as api from '@/lib/api/endpoints';
import { formatCurrency, formatNumber } from '@/lib/format';
import { siteName } from '@/lib/ml-sites';
import { useAuth } from '@/lib/auth/auth-context';
import type { Product, SubcategoryCandidate } from '@/lib/types';

const ALL = 'all';

export default function AdminSubcategoriesPage() {
  const t = useTranslations('adminSub');
  const locale = useLocale();
  const { hasPermission } = useAuth();
  const qc = useQueryClient();

  // The selected canonical category scopes everything below it.
  const [globalId, setGlobalId] = useState('');
  const [newName, setNewName] = useState('');
  const [country, setCountry] = useState(ALL);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [target, setTarget] = useState('');
  // The leaf whose products are being peeked at in the modal (null = closed).
  const [peek, setPeek] = useState<SubcategoryCandidate | null>(null);

  const globalsQuery = useQuery({ queryKey: ['globals'], queryFn: api.listGlobalCategories });
  const subcatsQuery = useQuery({
    queryKey: ['subcats', globalId],
    queryFn: () => api.listGlobalSubcategories(Number(globalId)),
    enabled: globalId !== '',
  });
  // Fetch every leaf candidate once; country/canonical/search are filtered client-side.
  const candidatesQuery = useQuery({
    queryKey: ['subcat-candidates'],
    queryFn: () => api.getSubcategoryCandidates(),
  });
  // Products of the peeked leaf — only fetched while the modal is open.
  const peekQuery = useQuery({
    queryKey: ['peek-products', peek?.id, peek?.country],
    queryFn: () =>
      api.getProducts({ category_id: String(peek!.id), country: peek!.country, limit: 50 }),
    enabled: !!peek,
  });

  // Default to the first canonical category once they load.
  useEffect(() => {
    if (globalId === '' && globalsQuery.data && globalsQuery.data.length > 0) {
      setGlobalId(String(globalsQuery.data[0].id));
    }
  }, [globalsQuery.data, globalId]);

  // Reset cross-canonical state when the canonical category changes.
  useEffect(() => {
    setSelected(new Set());
    setTarget('');
  }, [globalId]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['subcats'] });
    qc.invalidateQueries({ queryKey: ['subcat-candidates'] });
    qc.invalidateQueries({ queryKey: ['product-categories'] });
  };

  const createMut = useMutation({
    mutationFn: (name: string) => api.createGlobalSubcategory(name, Number(globalId)),
    onSuccess: () => {
      setNewName('');
      invalidate();
    },
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => api.deleteGlobalSubcategory(id),
    onSuccess: invalidate,
  });
  const assignMut = useMutation({
    mutationFn: (vars: { id: number; ids: number[] }) =>
      api.assignSubcategories(vars.id, vars.ids),
    onSuccess: () => {
      setSelected(new Set());
      invalidate();
    },
  });
  const unassignMut = useMutation({
    mutationFn: (ids: number[]) => api.unassignSubcategories(ids),
    onSuccess: () => {
      setSelected(new Set());
      invalidate();
    },
  });

  const subcats = subcatsQuery.data ?? [];

  // Only leaves whose root parent belongs to the selected canonical category can
  // be grouped here (a leaf inherits its canonical category from its parent).
  const scoped = useMemo(() => {
    if (globalId === '') return [];
    const all = candidatesQuery.data ?? [];
    return all.filter((c) => c.global_category_id === Number(globalId));
  }, [candidatesQuery.data, globalId]);
  const countries = useMemo(
    () => [...new Set(scoped.map((c) => c.country))].sort(),
    [scoped],
  );
  const filtered = useMemo(() => {
    let list = scoped;
    if (country !== ALL) list = list.filter((c) => c.country === country);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.ml_id.toLowerCase().includes(q) ||
          (c.parent_name ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [scoped, country, search]);

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allVisibleSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.id));

  const toggleAllVisible = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) filtered.forEach((c) => next.delete(c.id));
      else filtered.forEach((c) => next.add(c.id));
      return next;
    });

  if (!hasPermission('admin:manage')) {
    return <div className="py-20 text-center text-gray-500">{t('noAccess')}</div>;
  }

  return (
    <>
      <Link
        href="/admin"
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('back')}
      </Link>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      {/* Canonical category scope selector */}
      <Card className="mb-6 dark:!bg-gray-900">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {t('canonicalLabel')}
          </label>
          <Select
            value={globalId}
            onValueChange={setGlobalId}
            placeholder={t('selectCanonical')}
            className="max-w-[280px]"
            enableClear={false}
          >
            {(globalsQuery.data ?? []).map((g) => (
              <SelectItem key={g.id} value={String(g.id)}>
                {g.name}
              </SelectItem>
            ))}
          </Select>
        </div>
      </Card>

      {globalId === '' ? (
        <div className="py-20 text-center text-gray-500">{t('pickCanonicalFirst')}</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Canonical subcategories under the selected canonical category */}
          <Card className="dark:!bg-gray-900">
            <Title>{t('subcatsTitle')}</Title>
            <form
              className="mt-4 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (newName.trim()) createMut.mutate(newName.trim());
              }}
            >
              <TextInput
                placeholder={t('newPlaceholder')}
                value={newName}
                onValueChange={setNewName}
              />
              <Button type="submit" loading={createMut.isPending} disabled={!newName.trim()}>
                {t('create')}
              </Button>
            </form>

            <DataState
              isLoading={subcatsQuery.isLoading}
              isError={subcatsQuery.isError}
              isEmpty={subcats.length === 0}
              onRetry={() => subcatsQuery.refetch()}
            >
              <ul className="mt-4 space-y-2">
                {subcats.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-800"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {s.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {t('linkedCount', { count: s.category_count })}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(t('confirmDelete'))) deleteMut.mutate(s.id);
                      }}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                      aria-label={t('delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </DataState>
          </Card>

          {/* Per-country leaf candidates for this canonical category */}
          <Card className="dark:!bg-gray-900">
            <Title>{t('candidatesTitle')}</Title>

            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 p-2 dark:bg-gray-800/50">
              <TextInput
                icon={Search}
                placeholder={t('searchPlaceholder')}
                value={search}
                onValueChange={setSearch}
                className="max-w-[200px]"
              />
              <Select value={country} onValueChange={setCountry} className="max-w-[160px]">
                <SelectItem value={ALL}>{t('allCountries')}</SelectItem>
                {countries.map((c) => (
                  <SelectItem key={c} value={c}>
                    {siteName(c)}
                  </SelectItem>
                ))}
              </Select>
              <span className="px-1 text-sm text-gray-500">
                {t('selected', { count: selected.size })}
              </span>
              <div className="ml-auto flex items-center gap-2">
                <Select
                  value={target}
                  onValueChange={setTarget}
                  placeholder={t('assignTo')}
                  className="max-w-[200px]"
                  enableClear={false}
                >
                  {subcats.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </Select>
                <Button
                  size="xs"
                  disabled={!target || selected.size === 0}
                  loading={assignMut.isPending}
                  onClick={() => assignMut.mutate({ id: Number(target), ids: [...selected] })}
                >
                  {t('assign')}
                </Button>
                <Button
                  size="xs"
                  variant="secondary"
                  disabled={selected.size === 0}
                  loading={unassignMut.isPending}
                  onClick={() => unassignMut.mutate([...selected])}
                >
                  {t('unassign')}
                </Button>
              </div>
            </div>

            <DataState
              isLoading={candidatesQuery.isLoading}
              isError={candidatesQuery.isError}
              isEmpty={filtered.length === 0}
              onRetry={() => candidatesQuery.refetch()}
            >
              <Table className="mt-2">
                <TableHead>
                  <TableRow>
                    <TableHeaderCell className="w-8">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleAllVisible}
                        className="h-4 w-4 rounded border-gray-300"
                        aria-label="select all"
                      />
                    </TableHeaderCell>
                    <TableHeaderCell>{t('colCountry')}</TableHeaderCell>
                    <TableHeaderCell>{t('colName')}</TableHeaderCell>
                    <TableHeaderCell>{t('colParent')}</TableHeaderCell>
                    <TableHeaderCell className="text-right">{t('colProducts')}</TableHeaderCell>
                    <TableHeaderCell>{t('colCurrent')}</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selected.has(c.id)}
                          onChange={() => toggle(c.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-gray-600 dark:text-gray-300">
                        {siteName(c.country)}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                        {c.name}
                        <span className="ml-1 text-xs text-gray-400">{c.ml_id}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {c.parent_name ?? t('none')}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <button
                          onClick={() => setPeek(c)}
                          className="font-medium text-blue-600 hover:underline"
                          title={t('viewProducts')}
                        >
                          {formatNumber(c.product_count, locale)}
                        </button>
                      </TableCell>
                      <TableCell>
                        {c.global_subcategory_name ? (
                          <Badge color="blue" size="xs">
                            {c.global_subcategory_name}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">{t('none')}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DataState>
          </Card>
        </div>
      )}

      {peek && (
        <ProductPeekModal
          leaf={peek}
          products={peekQuery.data?.data ?? []}
          isLoading={peekQuery.isLoading}
          isError={peekQuery.isError}
          onRetry={() => peekQuery.refetch()}
          onClose={() => setPeek(null)}
          locale={locale}
        />
      )}
    </>
  );
}

/** Internal detail/history link for a product row (same logic as the explorer). */
function detailHref(p: Product): string | null {
  if (p.ml_public_id) return `/products/${encodeURIComponent(p.ml_public_id)}?listing=1`;
  if (p.catalog_id) return `/products/${encodeURIComponent(p.catalog_id)}`;
  return null;
}

/** Lightweight modal listing the products of one leaf category. */
function ProductPeekModal({
  leaf,
  products,
  isLoading,
  isError,
  onRetry,
  onClose,
  locale,
}: {
  leaf: SubcategoryCandidate;
  products: Product[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onClose: () => void;
  locale: string;
}) {
  const t = useTranslations('adminSub');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-gray-100 p-4 dark:border-gray-800">
          <div>
            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {siteName(leaf.country)} · {leaf.name}
              <span className="ml-1 text-xs font-normal text-gray-400">{leaf.ml_id}</span>
            </p>
            <p className="text-xs text-gray-500">
              {t('peekSubtitle', { count: leaf.product_count })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
            aria-label={t('close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(80vh-72px)] overflow-y-auto p-4">
          <DataState
            isLoading={isLoading}
            isError={isError}
            isEmpty={products.length === 0}
            onRetry={onRetry}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>{t('pColName')}</TableHeaderCell>
                  <TableHeaderCell className="text-right">{t('pColPrice')}</TableHeaderCell>
                  <TableHeaderCell className="text-right">{t('pColSold')}</TableHeaderCell>
                  <TableHeaderCell className="text-right">{t('pColRanking')}</TableHeaderCell>
                  <TableHeaderCell>{t('pColSeller')}</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((p) => {
                  const href = detailHref(p);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="max-w-xs whitespace-normal break-words">
                        {href ? (
                          <Link
                            href={href}
                            target="_blank"
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {p.name}
                          </Link>
                        ) : (
                          <span className="text-gray-900 dark:text-gray-100">{p.name}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(p.price, p.currency ?? 'USD', locale)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {p.sold_count !== null ? formatNumber(p.sold_count, locale) : '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {p.ranking_position !== null ? `#${p.ranking_position}` : '—'}
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">
                        {p.seller?.nickname ?? '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </DataState>
        </div>
      </div>
    </div>
  );
}
