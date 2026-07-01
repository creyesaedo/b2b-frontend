# Graph Report - b2b-frontend  (2026-06-25)

## Corpus Check
- 46 files · ~15,842 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 242 nodes · 463 edges · 14 communities (10 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `61995faa`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]

## God Nodes (most connected - your core abstractions)
1. `apiFetch()` - 31 edges
2. `compilerOptions` - 16 edges
3. `useAuth()` - 15 edges
4. `formatNumber()` - 14 edges
5. `siteName()` - 11 edges
6. `qs()` - 10 edges
7. `DataState()` - 9 edges
8. `PageHeader()` - 9 edges
9. `ProductRow()` - 7 edges
10. `CLAUDE.md — b2b-frontend` - 7 edges

## Surprising Connections (you probably didn't know these)
- `AdminCategoriesPage()` --calls--> `useAuth()`  [INFERRED]
  src/app/[locale]/(app)/admin/categories/page.tsx → src/lib/auth/auth-context.tsx
- `ProductDetailPage()` --calls--> `formatNumber()`  [EXTRACTED]
  src/app/[locale]/(app)/products/[catalogId]/page.tsx → src/lib/format.ts
- `AdminHomePage()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/[locale]/(app)/admin/page.tsx → src/lib/auth/auth-context.tsx
- `RolesPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/[locale]/(app)/admin/roles/page.tsx → src/lib/auth/auth-context.tsx
- `AdminSubcategoriesPage()` --calls--> `siteName()`  [EXTRACTED]
  src/app/[locale]/(app)/admin/subcategories/page.tsx → src/lib/ml-sites.ts

## Import Cycles
- None detected.

## Communities (14 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (48): apiFetch(), qs(), addProductOverride(), assignCategories(), assignSubcategories(), createGlobalCategory(), createGlobalSubcategory(), createPermission() (+40 more)

### Community 1 - "Community 1"
Cohesion: 0.13
Nodes (25): getProducts(), getStats(), DataState(), PageHeader(), CategoryAgg, MarketMap(), MarketMapProps, ML_BY_NUMERIC (+17 more)

### Community 2 - "Community 2"
Cohesion: 0.10
Nodes (18): AdminHomePage(), googleLoginUrl(), AppShell(), NAV, AuthGuard(), useAuth(), AuthForm(), FormValues (+10 more)

### Community 3 - "Community 3"
Cohesion: 0.21
Nodes (8): Providers(), Locale, routing, inter, metadata, config, intlMiddleware, middleware()

### Community 4 - "Community 4"
Cohesion: 0.18
Nodes (11): devDependencies, autoprefixer, eslint, eslint-config-next, postcss, tailwindcss, @types/node, @types/react (+3 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (24): dependencies, flag-icons, @hookform/resolvers, lucide-react, next, next-intl, react, react-dom (+16 more)

### Community 11 - "Community 11"
Cohesion: 0.15
Nodes (11): API contract consumed (via the BFF, `:provider = ml`), Architecture, CLAUDE.md — b2b-frontend, Commands, Conventions, Data dependency, Stack, b2b-frontend (+3 more)

### Community 12 - "Community 12"
Cohesion: 0.29
Nodes (6): ApiError, AuthContext, AuthContextValue, AuthProvider(), QueryProvider(), AuthUser

### Community 13 - "Community 13"
Cohesion: 0.22
Nodes (5): ChartDatum, Currency, Period, PriceView, ProductDetailPage()

## Knowledge Gaps
- **83 isolated node(s):** `extends`, `withNextIntl`, `nextConfig`, `name`, `version` (+78 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `Community 2` to `Community 1`, `Community 12`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `routing` connect `Community 3` to `Community 2`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `extends`, `withNextIntl`, `nextConfig` to the rest of the system?**
  _83 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0792156862745098 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.12846068660022147 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.09759759759759759 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._