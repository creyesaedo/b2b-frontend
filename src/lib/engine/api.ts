// Typed calls to the dashboard-engine endpoints exposed by the BFF.
// The BFF injects the IdentityContext server-side; nothing auth-related is
// sent from here beyond the session cookie (apiFetch).
import { apiFetch } from '../api/client';
import type {
  InsightsResponse,
  InstantiateResponse,
  ResolvedWidget,
  ResultSet,
  TemplateSummary,
} from './types';

const PROVIDER = 'ml';

// Postgres numerics travel as strings over JSON (same as the Prisma Decimal
// case in endpoints.ts). Coerce every number-typed column so widgets can do
// math/formatting safely.
function normalizeResultSet(rs: ResultSet): ResultSet {
  const numberCols = rs.columns.filter((c) => c.type === 'number').map((c) => c.name);
  if (numberCols.length === 0) return rs;
  return {
    ...rs,
    rows: rs.rows.map((row) => {
      const out = { ...row };
      for (const name of numberCols) {
        const v = out[name];
        if (typeof v === 'string') {
          const n = Number(v);
          out[name] = Number.isNaN(n) ? null : n;
        }
      }
      return out;
    }),
  };
}

function normalizeWidgets(widgets: ResolvedWidget[] | undefined): ResolvedWidget[] {
  return (widgets ?? []).map((w) => ({
    ...w,
    resultSet: w.resultSet ? normalizeResultSet(w.resultSet) : null,
  }));
}

export const listEngineTemplates = () =>
  apiFetch<TemplateSummary[]>(`/v1/${PROVIDER}/templates`);

/** Params → concrete DashboardSpec with every widget resolved in one call. */
export const instantiateTemplate = async (
  id: string,
  params: Record<string, string>,
): Promise<InstantiateResponse> => {
  const res = await apiFetch<InstantiateResponse>(
    `/v1/${PROVIDER}/templates/${encodeURIComponent(id)}/instantiate`,
    { method: 'POST', body: JSON.stringify({ params, resolve: true }) },
  );
  return { ...res, widgets: normalizeWidgets(res.widgets) };
};

/** Deterministic insight cards for a scope (feeds insight_card widgets). */
export const getInsights = (scope: { pais: string; categoria?: string }) =>
  apiFetch<InsightsResponse>(`/v1/${PROVIDER}/insights`, {
    method: 'POST',
    body: JSON.stringify({ scope }),
  });
