'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
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
import { ArrowRight, Trash2 } from 'lucide-react';
import { DataState } from '@/components/app/data-state';
import { PageHeader } from '@/components/app/page-header';
import { Link } from '@/i18n/navigation';
import * as api from '@/lib/api/endpoints';
import { formatDate } from '@/lib/format';
import { SITE_CODES, siteName } from '@/lib/ml-sites';

const DEFAULT_COUNTRY = 'MLC';
// Daily is the finest cadence the backend supports (the cron runs once a day).
const CADENCE_OPTIONS = [24, 48, 72, 168] as const;

export default function TrackedProductsPage() {
  const t = useTranslations('tracked');
  const locale = useLocale();
  const qc = useQueryClient();

  const [url, setUrl] = useState('');
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [cadence, setCadence] = useState(String(CADENCE_OPTIONS[0]));

  const trackedQuery = useQuery({
    queryKey: ['tracked-products'],
    queryFn: api.getTrackedProducts,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['tracked-products'] });

  const subscribeMut = useMutation({
    mutationFn: () =>
      api.subscribeTrackedProduct({ url: url.trim(), country, cadence_hours: Number(cadence) }),
    onSuccess: () => {
      setUrl('');
      invalidate();
    },
  });

  const unsubscribeMut = useMutation({
    mutationFn: (id: number) => api.unsubscribeTrackedProduct(id),
    onSuccess: invalidate,
  });

  const tracked = trackedQuery.data ?? [];

  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      {/* Subscribe form */}
      <Card className="mb-6 dark:!bg-gray-900">
        <Title>{t('addTitle')}</Title>
        <form
          className="mt-4 flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (url.trim()) subscribeMut.mutate();
          }}
        >
          <div className="flex-1 min-w-[240px]">
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('urlLabel')}
            </label>
            <TextInput
              placeholder={t('urlPlaceholder')}
              value={url}
              onValueChange={setUrl}
              type="url"
            />
          </div>
          <div className="w-[160px]">
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('colCountry')}
            </label>
            <Select value={country} onValueChange={setCountry} enableClear={false}>
              {SITE_CODES.map((c) => (
                <SelectItem key={c} value={c}>
                  {siteName(c)}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div className="w-[160px]">
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('colCadence')}
            </label>
            <Select value={cadence} onValueChange={setCadence} enableClear={false}>
              {CADENCE_OPTIONS.map((h) => (
                <SelectItem key={h} value={String(h)}>
                  {t('cadenceHours', { hours: h })}
                </SelectItem>
              ))}
            </Select>
          </div>
          <Button type="submit" loading={subscribeMut.isPending} disabled={!url.trim()}>
            {t('subscribe')}
          </Button>
        </form>
        {subscribeMut.isError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{t('subscribeError')}</p>
        )}
      </Card>

      <DataState
        isLoading={trackedQuery.isLoading}
        isError={trackedQuery.isError}
        isEmpty={tracked.length === 0}
        onRetry={() => trackedQuery.refetch()}
      >
        <Card className="dark:!bg-gray-900">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{t('colCountry')}</TableHeaderCell>
                <TableHeaderCell>{t('colProduct')}</TableHeaderCell>
                <TableHeaderCell>{t('colCadence')}</TableHeaderCell>
                <TableHeaderCell>{t('colLastRun')}</TableHeaderCell>
                <TableHeaderCell>{t('colNextRun')}</TableHeaderCell>
                <TableHeaderCell>{t('colStatus')}</TableHeaderCell>
                <TableHeaderCell className="text-right">{t('colActions')}</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tracked.map((tp) => (
                <TableRow key={tp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <TableCell className="whitespace-nowrap text-gray-600 dark:text-gray-300">
                    {siteName(tp.country)}
                  </TableCell>
                  <TableCell className="max-w-[280px]">
                    <Link
                      href={`/tracked/${tp.id}`}
                      className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      <span className="truncate">
                        {tp.catalog_id ?? tp.ml_public_id ?? tp.url}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                    </Link>
                  </TableCell>
                  <TableCell>{t('cadenceHours', { hours: tp.cadence_hours })}</TableCell>
                  <TableCell className="whitespace-nowrap text-gray-600 dark:text-gray-300">
                    {tp.last_run_at ? formatDate(tp.last_run_at, locale) : t('never')}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-gray-600 dark:text-gray-300">
                    {formatDate(tp.next_run_at, locale)}
                  </TableCell>
                  <TableCell>
                    <Badge color={tp.active ? 'emerald' : 'gray'} size="xs">
                      {tp.active ? t('active') : t('inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => {
                        if (confirm(t('confirmUnsubscribe'))) unsubscribeMut.mutate(tp.id);
                      }}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                      aria-label={t('unsubscribe')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
