'use client';

import { useTranslations } from 'next-intl';
import { Badge, Card, Text, Title } from '@tremor/react';
import {
  ArrowRight,
  Database,
  LayoutGrid,
  LucideIcon,
  ShieldCheck,
  Tags,
  UserCog,
  UserPlus,
  Users,
} from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth/auth-context';

export default function AdminHomePage() {
  const t = useTranslations('adminHome');
  const { hasPermission } = useAuth();

  if (!hasPermission('admin:manage')) {
    return <div className="py-20 text-center text-gray-500">{t('noAccess')}</div>;
  }

  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <div className="space-y-6">
        <Section icon={Database} title={t('sectionNormalization')}>
          <AdminCard
            href="/admin/categories"
            icon={Tags}
            title={t('categoriesTitle')}
            description={t('categoriesDesc')}
          />
          <AdminCard
            icon={LayoutGrid}
            title={t('subcategoriesTitle')}
            description={t('subcategoriesDesc')}
            badge={t('comingSoon')}
          />
        </Section>

        <Section icon={Users} title={t('sectionUsers')}>
          <AdminCard
            icon={UserCog}
            title={t('assignRoleTitle')}
            description={t('assignRoleDesc')}
            badge={t('comingSoon')}
          />
          <AdminCard
            href="/admin/roles"
            icon={ShieldCheck}
            title={t('rolesPermsTitle')}
            description={t('rolesPermsDesc')}
          />
          <AdminCard
            icon={UserPlus}
            title={t('usersTitle')}
            description={t('usersDesc')}
            badge={t('comingSoon')}
          />
        </Section>
      </div>
    </>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-900/40">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-100">
        <span className="inline-flex rounded-lg bg-blue-50 p-1.5 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
          <Icon className="h-4 w-4" />
        </span>
        {title}
      </h2>
      <div className="flex flex-wrap gap-4">{children}</div>
    </section>
  );
}

function AdminCard({
  href,
  icon: Icon,
  title,
  description,
  badge,
}: {
  href?: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  badge?: string;
}) {
  const card = (
    <Card
      className={`group h-full w-full !p-4 dark:!bg-gray-900 ${
        href
          ? 'cursor-pointer transition-shadow hover:shadow-tremor-card'
          : 'cursor-not-allowed opacity-60'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="inline-flex rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
          <Icon className="h-7 w-7" />
        </div>
        {badge ? (
          <Badge color="gray" size="xs">
            {badge}
          </Badge>
        ) : (
          <ArrowRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-500" />
        )}
      </div>
      <Title className="mt-3">{title}</Title>
      {description ? <Text className="mt-0.5">{description}</Text> : null}
    </Card>
  );

  // Fixed-width flex item; align-stretch makes every card in a row equal height.
  return (
    <div className="w-full sm:w-64">
      {href ? (
        <Link href={href} className="block h-full">
          {card}
        </Link>
      ) : (
        card
      )}
    </div>
  );
}
