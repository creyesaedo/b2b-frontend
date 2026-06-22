'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Button, Card, TextInput, Title } from '@tremor/react';
import { ArrowLeft, Plus } from 'lucide-react';
import { DataState } from '@/components/app/data-state';
import { PageHeader } from '@/components/app/page-header';
import { Link } from '@/i18n/navigation';
import * as api from '@/lib/api/endpoints';
import { useAuth } from '@/lib/auth/auth-context';

export default function RolesPage() {
  const t = useTranslations('roles');
  const { hasPermission } = useAuth();
  const qc = useQueryClient();

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState('');
  const [newPermKey, setNewPermKey] = useState('');
  const [newPermDesc, setNewPermDesc] = useState('');
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const rolesQuery = useQuery({ queryKey: ['roles'], queryFn: api.listRoles });
  const permsQuery = useQuery({ queryKey: ['permissions'], queryFn: api.listPermissions });

  const roles = rolesQuery.data ?? [];
  const permissions = permsQuery.data ?? [];
  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? null;

  // Sync the checkbox state to the selected role's granted permissions.
  useEffect(() => {
    if (selectedRole) {
      setChecked(new Set(selectedRole.permissions.map((p) => p.permission.key)));
    }
  }, [selectedRole]);

  const createRoleMut = useMutation({
    mutationFn: (name: string) => api.createRole(name),
    onSuccess: () => {
      setNewRole('');
      qc.invalidateQueries({ queryKey: ['roles'] });
    },
  });
  const createPermMut = useMutation({
    mutationFn: (vars: { key: string; desc?: string }) =>
      api.createPermission(vars.key, vars.desc || undefined),
    onSuccess: () => {
      setNewPermKey('');
      setNewPermDesc('');
      qc.invalidateQueries({ queryKey: ['permissions'] });
    },
  });
  const saveMut = useMutation({
    mutationFn: (vars: { roleId: string; keys: string[] }) =>
      api.setRolePermissions(vars.roleId, vars.keys),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  });

  const toggle = (key: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
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

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Roles list */}
        <Card className="dark:!bg-gray-900">
          <Title>{t('rolesTitle')}</Title>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (newRole.trim()) createRoleMut.mutate(newRole.trim());
            }}
          >
            <TextInput
              placeholder={t('newRolePlaceholder')}
              value={newRole}
              onValueChange={setNewRole}
            />
            <Button type="submit" loading={createRoleMut.isPending} disabled={!newRole.trim()}>
              {t('create')}
            </Button>
          </form>

          <DataState
            isLoading={rolesQuery.isLoading}
            isError={rolesQuery.isError}
            onRetry={() => rolesQuery.refetch()}
          >
            <ul className="mt-4 space-y-1">
              {roles.map((r) => {
                const active = r.id === selectedRoleId;
                return (
                  <li key={r.id}>
                    <button
                      onClick={() => setSelectedRoleId(r.id)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        active
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="font-medium">{r.name}</span>
                      <span className="text-xs text-gray-400">
                        {t('permissionCount', { count: r.permissions.length })}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </DataState>
        </Card>

        {/* Permissions editor */}
        <Card className="dark:!bg-gray-900">
          {!selectedRole ? (
            <div className="py-16 text-center text-sm text-gray-500">{t('selectRole')}</div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <Title>{t('permissionsOf', { role: selectedRole.name })}</Title>
                <Button
                  size="xs"
                  loading={saveMut.isPending}
                  onClick={() =>
                    saveMut.mutate({ roleId: selectedRole.id, keys: [...checked] })
                  }
                >
                  {t('save')}
                </Button>
              </div>

              <DataState
                isLoading={permsQuery.isLoading}
                isError={permsQuery.isError}
                isEmpty={permissions.length === 0}
                onRetry={() => permsQuery.refetch()}
              >
                <ul className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
                  {permissions.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={checked.has(p.key)}
                        onChange={() => toggle(p.key)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <div className="min-w-0">
                        <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                          {p.key}
                        </code>
                        {p.description && (
                          <span className="ml-2 text-sm text-gray-500">{p.description}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </DataState>

              {/* Create permission */}
              <div className="mt-6 border-t border-gray-100 pt-4 dark:border-gray-800">
                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                  {t('newPermTitle')}
                </p>
                <form
                  className="flex flex-wrap gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newPermKey.trim())
                      createPermMut.mutate({ key: newPermKey.trim(), desc: newPermDesc.trim() });
                  }}
                >
                  <TextInput
                    placeholder={t('permKeyPlaceholder')}
                    value={newPermKey}
                    onValueChange={setNewPermKey}
                    className="max-w-[220px]"
                  />
                  <TextInput
                    placeholder={t('permDescPlaceholder')}
                    value={newPermDesc}
                    onValueChange={setNewPermDesc}
                    className="max-w-[260px]"
                  />
                  <Button
                    type="submit"
                    variant="secondary"
                    icon={Plus}
                    loading={createPermMut.isPending}
                    disabled={!newPermKey.trim()}
                  >
                    {t('create')}
                  </Button>
                </form>
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
