'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
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
import { ArrowLeft, Search, Trash2 } from 'lucide-react';
import { DataState } from '@/components/app/data-state';
import { PageHeader } from '@/components/app/page-header';
import { Link } from '@/i18n/navigation';
import * as api from '@/lib/api/endpoints';
import { formatNumber } from '@/lib/format';
import { siteName } from '@/lib/ml-sites';
import { useAuth } from '@/lib/auth/auth-context';

const ALL = 'all';

export default function AdminCategoriesPage() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const { hasPermission } = useAuth();
  const qc = useQueryClient();

  const [newName, setNewName] = useState('');
  const [country, setCountry] = useState(ALL);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [target, setTarget] = useState('');

  const globalsQuery = useQuery({ queryKey: ['globals'], queryFn: api.listGlobalCategories });
  const candidatesQuery = useQuery({
    queryKey: ['candidates', country],
    queryFn: () => api.getCategoryCandidates(country === ALL ? undefined : country),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['globals'] });
    qc.invalidateQueries({ queryKey: ['candidates'] });
    qc.invalidateQueries({ queryKey: ['product-categories'] });
  };

  const createMut = useMutation({
    mutationFn: (name: string) => api.createGlobalCategory(name),
    onSuccess: () => {
      setNewName('');
      invalidate();
    },
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => api.deleteGlobalCategory(id),
    onSuccess: invalidate,
  });
  const assignMut = useMutation({
    mutationFn: (vars: { id: number; ids: number[] }) => api.assignCategories(vars.id, vars.ids),
    onSuccess: () => {
      setSelected(new Set());
      invalidate();
    },
  });
  const unassignMut = useMutation({
    mutationFn: (ids: number[]) => api.unassignCategories(ids),
    onSuccess: () => {
      setSelected(new Set());
      invalidate();
    },
  });

  const candidates = candidatesQuery.data ?? [];
  const countries = useMemo(
    () => [...new Set(candidates.map((c) => c.country))].sort(),
    [candidates],
  );
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter(
      (c) => c.name.toLowerCase().includes(q) || c.ml_id.toLowerCase().includes(q),
    );
  }, [candidates, search]);

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
    return (
      <div className="py-20 text-center text-gray-500">{t('noAccess')}</div>
    );
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

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Canonical categories */}
        <Card className="dark:!bg-gray-900">
          <Title>{t('canonicalTitle')}</Title>
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
            isLoading={globalsQuery.isLoading}
            isError={globalsQuery.isError}
            onRetry={() => globalsQuery.refetch()}
          >
            <ul className="mt-4 space-y-2">
              {(globalsQuery.data ?? []).map((g) => (
                <li
                  key={g.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-800"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {g.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {t('linkedCount', { count: g.category_count })}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(t('confirmDelete'))) deleteMut.mutate(g.id);
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

        {/* Per-country candidates */}
        <Card className="dark:!bg-gray-900">
          <Title>{t('candidatesTitle')}</Title>

          {/* Search + country filter + bulk actions */}
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
                {(globalsQuery.data ?? []).map((g) => (
                  <SelectItem key={g.id} value={String(g.id)}>
                    {g.name}
                  </SelectItem>
                ))}
              </Select>
              <Button
                size="xs"
                disabled={!target || selected.size === 0}
                loading={assignMut.isPending}
                onClick={() =>
                  assignMut.mutate({ id: Number(target), ids: [...selected] })
                }
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
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(c.product_count, locale)}
                    </TableCell>
                    <TableCell>
                      {c.global_name ? (
                        <Badge color="blue" size="xs">
                          {c.global_name}
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
    </>
  );
}
