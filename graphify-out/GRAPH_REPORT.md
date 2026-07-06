# Graph Report - b2b-frontend  (2026-07-05)

## Corpus Check
- 59 files · ~24,097 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 307 nodes · 668 edges · 13 communities (9 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5780d491`
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

## God Nodes (most connected - your core abstractions)
1. `apiFetch()` - 36 edges
2. `formatNumber()` - 21 edges
3. `siteName()` - 19 edges
4. `compilerOptions` - 16 edges
5. `useAuth()` - 15 edges
6. `qs()` - 12 edges
7. `formatCurrency()` - 12 edges
8. `formatDate()` - 12 edges
9. `DataState()` - 11 edges
10. `formatPercent()` - 11 edges

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

## Communities (13 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (62): apiFetch(), qs(), addProductOverride(), assignCategories(), assignSubcategories(), createGlobalCategory(), createGlobalSubcategory(), createPermission() (+54 more)

### Community 1 - "Community 1"
Cohesion: 0.10
Nodes (42): getProducts(), ChoroplethScope(), CountryCompare(), CountryCompareProps, CountryPanel(), CountryPanelProps, MapLegend(), MapLegendProps (+34 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (22): ApiError, googleLoginUrl(), NAV, AuthProvider(), AuthForm(), FormValues, schema, Brand() (+14 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (15): AdminHomePage(), AppShell(), AuthGuard(), PageHeader(), AuthContext, AuthContextValue, useAuth(), AdminCategoriesPage() (+7 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (35): dependencies, flag-icons, @hookform/resolvers, lucide-react, next, next-intl, react, react-dom (+27 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 6 - "Community 6"
Cohesion: 0.18
Nodes (9): DataState(), ChartDatum, HistoryChart(), Kpi(), Currency, PriceView, ProductDetailPage(), Currency (+1 more)

### Community 11 - "Community 11"
Cohesion: 0.15
Nodes (11): API contract consumed (via the BFF, `:provider = ml`), Architecture, CLAUDE.md — b2b-frontend, Commands, Conventions, Data dependency, Stack, b2b-frontend (+3 more)

### Community 12 - "Community 12"
Cohesion: 0.18
Nodes (14): detectEcommerce(), detectProductUrl(), DetectResult, DetectStatus, Ecommerce, ECOMMERCE_NAMES, ecommerceName(), isMlProductPath() (+6 more)

## Knowledge Gaps
- **92 isolated node(s):** `extends`, `withNextIntl`, `nextConfig`, `name`, `version` (+87 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `Community 3` to `Community 2`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `formatNumber()` connect `Community 1` to `Community 3`, `Community 6`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `extends`, `withNextIntl`, `nextConfig` to the rest of the system?**
  _92 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.062004662004662 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.09966329966329966 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08080808080808081 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.11494252873563218 - nodes in this community are weakly interconnected._