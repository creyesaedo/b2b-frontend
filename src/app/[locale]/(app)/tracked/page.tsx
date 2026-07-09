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
import { ArrowRight, Loader2, Trash2 } from 'lucide-react';
import { DataState } from '@/components/app/data-state';
import { PageHeader } from '@/components/app/page-header';
import { Link } from '@/i18n/navigation';
import * as api from '@/lib/api/endpoints';
import { formatDate } from '@/lib/format';
import { siteName } from '@/lib/ml-sites';
import { type DetectStatus, detectProductUrl, ecommerceName } from '@/lib/product-url';

// Cadence in days, from 1 day to 1 week. Daily is the finest the backend
// supports (the cron runs once a day); we send `cadence_hours = days * 24`.
const CADENCE_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;
const HOURS_PER_DAY = 24;

// Non-ok detection statuses → the i18n key explaining what's wrong.
const DETECT_MESSAGE_KEY: Record<Exclude<DetectStatus, 'ok' | 'empty'>, string> = {
  invalid_url: 'detectInvalidUrl',
  unknown_ecommerce: 'detectUnknownEcommerce',
  unsupported_country: 'detectUnsupportedCountry',
  not_a_product: 'detectNotAProduct',
};

export default function TrackedProductsPage() {
  const t = useTranslations('tracked');
  const locale = useLocale();
  const qc = useQueryClient();

  const [url, setUrl] = useState('');
  const [cadenceDays, setCadenceDays] = useState(String(CADENCE_DAYS[0]));

  // Derive the e-commerce, country and product-ness from the URL itself.
  const detection = useMemo(() => detectProductUrl(url), [url]);
  const canSubscribe = detection.status === 'ok';

  const trackedQuery = useQuery({
    queryKey: ['tracked-products'],
    queryFn: api.getTrackedProducts,
    // While any follow is still awaiting its first snapshot (active but never
    // run), poll so the row fills in on its own once the seed scrape lands.
    refetchInterval: (query) =>
      (query.state.data ?? []).some((tp) => tp.active && !tp.last_run_at) ? 5000 : false,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['tracked-products'] });

  const subscribeMut = useMutation({
    mutationFn: (country: string) =>
      api.subscribeTrackedProduct({
        url: url.trim(),
        country,
        cadence_hours: Number(cadenceDays) * HOURS_PER_DAY,
      }),
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
            if (detection.status === 'ok' && detection.site) subscribeMut.mutate(detection.site);
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
              {t('colCadence')}
            </label>
            <Select value={cadenceDays} onValueChange={setCadenceDays} enableClear={false}>
              {CADENCE_DAYS.map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {t('cadenceDays', { days: d })}
                </SelectItem>
              ))}
            </Select>
          </div>
          <Button type="submit" loading={subscribeMut.isPending} disabled={!canSubscribe}>
            {t('subscribe')}
          </Button>

          {/* URL detection feedback: what we found, or why we can't track it. */}
          {detection.status === 'ok' && detection.ecommerce && (
            <p className="basis-full text-sm text-emerald-600 dark:text-emerald-400">
              {ecommerceName(detection.ecommerce)} · {siteName(detection.site)}
            </p>
          )}
          {detection.status !== 'ok' && detection.status !== 'empty' && (
            <p className="basis-full text-sm text-amber-600 dark:text-amber-500">
              {t(DETECT_MESSAGE_KEY[detection.status])}
            </p>
          )}
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
              {tracked.map((tp) => {
                // A follow that is active but has never run is still awaiting its
                // first snapshot (the seed scrape). Until it lands we have no name,
                // no last check, and the next-check date is meaningless — so the row
                // shows a dedicated "pending" treatment instead of the active one.
                const isPending = tp.active && !tp.last_run_at;
                return (
                <TableRow key={tp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <TableCell className="whitespace-nowrap text-gray-600 dark:text-gray-300">
                    {siteName(tp.country)}
                  </TableCell>
                  <TableCell className="max-w-[280px]">
                    {isPending && !tp.name ? (
                      // No product name yet — show a skeleton placeholder line rather
                      // than the raw URL, and don't link to an empty detail page. The
                      // "checking" state is already conveyed by the status badge and
                      // the last-check column, so no redundant label here.
                      <span
                        className="block h-4 w-40 max-w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700"
                        title={t('pendingHint')}
                        aria-label={t('checking')}
                      />
                    ) : (
                      <Link
                        href={`/tracked/${tp.id}`}
                        title={tp.url}
                        className="inline-flex max-w-full items-center gap-1 font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        <span className="truncate">
                          {tp.name ?? tp.catalog_id ?? tp.ml_public_id ?? tp.url}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                      </Link>
                    )}
                  </TableCell>
                  <TableCell>
                    {t('cadenceDays', { days: Math.round(tp.cadence_hours / HOURS_PER_DAY) })}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-gray-600 dark:text-gray-300">
                    {isPending ? (
                      <span className="inline-flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        {t('checking')}
                      </span>
                    ) : tp.last_run_at ? (
                      formatDate(tp.last_run_at, locale)
                    ) : (
                      t('never')
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-gray-600 dark:text-gray-300">
                    {/* next_run_at is a day-marker at 00:00 UTC → read it in UTC.
                        While pending, the stored value is "now" and carries no
                        meaning yet, so show a dash. */}
                    {isPending ? '—' : formatDate(tp.next_run_at, locale, { utc: true })}
                  </TableCell>
                  <TableCell>
                    {isPending ? (
                      <Badge
                        color="amber"
                        size="xs"
                        icon={() => (
                          <span className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                        )}
                      >
                        {t('pending')}
                      </Badge>
                    ) : (
                      <Badge color={tp.active ? 'emerald' : 'gray'} size="xs">
                        {tp.active ? t('active') : t('inactive')}
                      </Badge>
                    )}
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
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </DataState>
    </>
  );
}
