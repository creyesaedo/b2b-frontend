'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Badge, Card, Text, Title } from '@tremor/react';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { DbDiagram } from '@/components/admin/db-diagram';
import { SystemFlow } from '@/components/admin/system-flow';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import {
  DB_TABLES,
  MARKET_LAYOUT,
  MARKET_RELATIONS,
  SchemaId,
  TableDoc,
  pickText,
} from '@/lib/db-docs';
import { ML_CONCEPTS, MlConceptDoc } from '@/lib/ml-docs';

const SCHEMA_ORDER: SchemaId[] = ['shared', 'mercadolibre'];

export default function DocumentationPage() {
  const t = useTranslations('dbDocs');
  const { hasPermission } = useAuth();

  if (!hasPermission('admin:manage')) {
    return <div className="py-20 text-center text-gray-500">{t('noAccess')}</div>;
  }

  return (
    <>
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('back')}
      </Link>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <div className="space-y-6">
        <Card className="dark:!bg-gray-900">
          <Title>{t('introTitle')}</Title>
          <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <li>
              <code className="font-semibold">mercadolibre</code> — {t('introMl')}
            </li>
            <li>
              <code className="font-semibold">shared</code> — {t('introShared')}
            </li>
          </ul>
        </Card>

        <Card className="dark:!bg-gray-900">
          <Title>{t('flow.title')}</Title>
          <Text className="mt-1">{t('flow.subtitle')}</Text>
          <div className="mt-6">
            <SystemFlow />
          </div>
        </Card>

        <div className="pt-2">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {t('mlTitle')}
          </h2>
          <Text className="mt-1">{t('mlSubtitle')}</Text>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {ML_CONCEPTS.map((concept) => (
            <ConceptCard key={concept.id} concept={concept} />
          ))}
        </div>

        <Card className="dark:!bg-gray-900">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <Title>{t('diagramTitle')}</Title>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <svg width="26" height="8" aria-hidden>
                  <line x1="0" y1="4" x2="26" y2="4" strokeWidth="1.5" className="stroke-gray-400" />
                </svg>
                {t('legendFk')}
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="26" height="8" aria-hidden>
                  <line x1="0" y1="4" x2="26" y2="4" strokeWidth="1.5" strokeDasharray="5 4" className="stroke-gray-400" />
                </svg>
                {t('legendSoft')}
              </span>
              <span className="flex items-center gap-1.5">
                <code className="font-mono font-semibold text-gray-400">?</code>
                {t('legendNullable')}
              </span>
            </div>
          </div>
          <Text className="mt-1">{t('clickHint')}</Text>

          <h3 className="mb-4 mt-6 text-sm font-semibold text-gray-700 dark:text-gray-200">
            {t('diagramMarket')}
          </h3>
          <DbDiagram layout={MARKET_LAYOUT} relations={MARKET_RELATIONS} />
        </Card>

        <h2 className="pt-2 text-lg font-semibold text-gray-800 dark:text-gray-100">
          {t('tablesTitle')}
        </h2>
        {SCHEMA_ORDER.flatMap((schema) =>
          DB_TABLES.filter((table) => table.schema === schema),
        ).map((table) => (
          <TableSection key={table.id} table={table} />
        ))}
      </div>
    </>
  );
}

function ConceptCard({ concept }: { concept: MlConceptDoc }) {
  const t = useTranslations('dbDocs');
  const locale = useLocale();

  return (
    <Card className="dark:!bg-gray-900">
      <Title>{pickText(concept.title, locale)}</Title>
      <Text className="mt-2">{pickText(concept.how, locale)}</Text>
      <div className="mt-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-950/40">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
          {t('mlApproach')}
        </p>
        <Text className="mt-1">{pickText(concept.approach, locale)}</Text>
      </div>
    </Card>
  );
}

function TableSection({ table }: { table: TableDoc }) {
  const t = useTranslations('dbDocs');
  const locale = useLocale();

  return (
    <Card id={`tbl-${table.id}`} className="scroll-mt-6 dark:!bg-gray-900">
      <div className="flex flex-wrap items-center gap-2">
        <Title className="font-mono">{table.id}</Title>
        <Badge color={table.schema === 'shared' ? 'violet' : 'blue'} size="xs">
          {table.schema}
        </Badge>
        <Badge color={table.kind === 'analytics' ? 'emerald' : 'gray'} size="xs">
          {table.kind === 'analytics' ? t('badgeAnalytics') : t('badgeOperational')}
        </Badge>
      </div>
      <Text className="mt-2">{pickText(table.description, locale)}</Text>
      {table.note ? (
        <Text className="mt-1 italic text-gray-400 dark:text-gray-500">
          {pickText(table.note, locale)}
        </Text>
      ) : null}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700">
              <th className="py-2 pr-4 font-medium">{t('colColumn')}</th>
              <th className="py-2 pr-4 font-medium">{t('colWhat')}</th>
              <th className="py-2 font-medium">{t('colValue')}</th>
            </tr>
          </thead>
          <tbody className="align-top text-gray-600 dark:text-gray-300">
            {table.columns.map((col) => (
              <tr key={col.name} className="border-b border-gray-100 last:border-0 dark:border-gray-800">
                <td className="whitespace-nowrap py-2 pr-4 font-mono text-xs font-semibold text-gray-800 dark:text-gray-100">
                  {col.name}
                  {col.pk ? <span className="ml-1 text-amber-500">PK</span> : null}
                  {col.fk ? (
                    <span className="ml-1 font-normal text-blue-400">
                      FK→{col.fk}
                    </span>
                  ) : null}
                </td>
                <td className="py-2 pr-4">{pickText(col.what, locale)}</td>
                <td className="py-2">{col.value ? pickText(col.value, locale) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
