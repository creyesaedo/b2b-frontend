# CLAUDE.md — b2b-frontend

This file guides Claude Code when working in this repository.

`b2b-frontend` is the **Next.js app** users see: a **marketing landing** (to sell a
market-analysis product) plus the **analytics product** (dashboard + explorer +
deep analysis) over MercadoLibre data. It also doubles as a **data-analyst
portfolio** project. It talks **only** to the [`b2b-bff`](../b2b-bff) (the single
entry point); it never calls `b2b-auth-service` or `ml-service` directly.

```
Browser ──(auth + data, httpOnly `sid` cookie, credentials:include)──> b2b-bff (8002)
```

Runs on `http://localhost:3000` — the `FRONTEND_URL` the BFF allows via
credentialed CORS.

## Stack

- **Next.js 14 (App Router) + TypeScript**. (Next 14 / React 18 — `@tremor/react`
  v3 does NOT support React 19, so do not bump to Next 15 / React 19 without
  switching charts.)
- **Tailwind CSS v3** + **@tremor/react** for dashboard UI/charts (Tailwind v4 is
  incompatible with Tremor v3 — keep v3).
- **next-intl** for bilingual routing (`es` default, `en`), path-prefixed.
- **TanStack Query** for data fetching/caching; **react-hook-form + zod** for forms.

## Commands

```bash
npm install
npm run dev      # http://localhost:3000 (needs a reachable b2b-bff)
npm run build
npm run lint
```

Env: copy `.env.example` → `.env.local` (`NEXT_PUBLIC_BFF_URL=http://localhost:8002`).

## Architecture

- **i18n** — `src/i18n/{routing,navigation,request}.ts`, messages in
  `src/messages/{es,en}.json`, wired by `src/middleware.ts`. **Always** import
  `Link`, `useRouter`, `usePathname` from `@/i18n/navigation` (locale-aware), not
  from `next/*`. The `[locale]` layout passes `messages` to
  `NextIntlClientProvider` explicitly (client components need it).
- **Auth** — the BFF owns the httpOnly `sid` cookie (set on `localhost`, sent here
  too). `src/lib/auth/auth-context.tsx` resolves the user via `GET /auth/me`;
  `AuthGuard` (`src/components/app/auth-guard.tsx`) redirects to `/login` on 401;
  `middleware.ts` adds a cheap cookie-presence gate. Google login is a full-page
  nav to `${BFF}/auth/google`.
- **Data layer** — `src/lib/api/client.ts` (fetch wrapper, `credentials:'include'`,
  `ApiError`) + `src/lib/api/endpoints.ts` (typed calls). Types mirror the BFF
  contract in `src/lib/types.ts` — keep in sync with the BFF/ml-service.
- **Analytics (dashboard-engine)** — `src/lib/engine/` mirrors the engine's
  contracts (`types.ts`), calls its BFF routes (`api.ts`) and formats cells from
  the ResultSet column metadata (`format.ts`; percent metrics are FRACTIONS).
  `src/components/analytics/` is the widget runtime: `widget-renderer.tsx`
  dispatches per widget type (kpi/line/bars/table/ranking/map/insight_card) onto
  the engine's 12-column grid (layout x/y/w/h, explicit placement on md+).
  `insight_card` widgets are fed by `POST /v1/ml/insights`, not a ResultSet.
- **Routing** —
  - `app/[locale]/page.tsx` — landing (public, server component).
  - `app/[locale]/{login,signup}` — auth (shared `AuthForm`).
  - `app/[locale]/(app)/*` — gated product: `dashboard`, `analytics` (templated
    dashboards resolved by the dashboard-engine), `products`,
    `products/[catalogId]` (history charts), `categories`, `sellers`. The `(app)`
    layout wraps them in `AuthGuard` + `AppShell`.

## API contract consumed (via the BFF, `:provider = ml`)

`GET /auth/me` · `POST /auth/login|register` · `POST /auth/logout` ·
`GET /auth/google` (nav) · `GET /v1/ml/stats` · `GET /v1/ml/products` (paginated,
`{data, meta}`) · `GET /v1/ml/products/catalog` · `GET /v1/ml/products/history`
(`?catalog_id|ml_public_id`) · `GET /v1/ml/categories`. Many product fields are
nullable — components must handle `null`.

Analytics (dashboard-engine via the BFF): `GET /v1/ml/templates` ·
`POST /v1/ml/templates/:id/instantiate` (`{params, resolve:true}` → spec +
per-widget ResultSets) · `POST /v1/ml/insights` (`{scope}` → insight cards).

## Data dependency

The dashboard/explorer are empty until `ml-service` has data. Run a small sync
(`POST /v1/ml/sync/run` as an admin, or `npm run sync:run` in ml-service). Empty
states are handled by `DataState` (`src/components/app/data-state.tsx`).

## Conventions

- **Everything in English** in code (identifiers, comments). UI strings live in
  the message bundles (es/en), never hardcoded in components.
- Server components for static/SEO (landing); client components (`'use client'`)
  for anything using Tremor, TanStack Query or hooks.
- Reuse `PageHeader`, `DataState`, `formatCurrency/Number/Percent/Date`
  (`src/lib/format.ts`) and `siteName` (`src/lib/ml-sites.ts`).
