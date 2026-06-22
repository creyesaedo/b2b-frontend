# b2b-frontend

Market-analysis frontend for the MercadoLibre data platform: a marketing landing
page + an analytics product (dashboard, product explorer, price/ranking history,
category & seller analytics). Bilingual (ES/EN). Built as a data-analyst portfolio
project.

It talks **only** to the [`b2b-bff`](../b2b-bff) — the single entry point — with
the session cookie. It never calls the auth or data services directly.

## Stack

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS v3 ·
@tremor/react (charts) · next-intl (i18n) · TanStack Query · react-hook-form + zod.

> Pinned to Next 14 / React 18 because `@tremor/react` v3 doesn't support React 19.

## Quick start

```bash
cp .env.example .env.local      # NEXT_PUBLIC_BFF_URL=http://localhost:8002
npm install
npm run dev                     # http://localhost:3000
```

Requires a reachable `b2b-bff` (which in turn needs `b2b-auth-service` and
`ml-service`). For the dashboard to show data, `ml-service` must have run a sync;
otherwise the UI shows empty states.

## Pages

- `/` — marketing landing (public, SEO).
- `/login`, `/signup` — email/password + "Continue with Google".
- `/dashboard` — KPIs and market overview.
- `/products` — filterable, paginated explorer (country, category, search, ARS/USD).
- `/products/[id]` — price & ranking history charts for a product.
- `/categories`, `/sellers` — comparative analytics.

Routes are locale-prefixed (`/es/...`, `/en/...`).

See [CLAUDE.md](CLAUDE.md) for architecture and conventions.
