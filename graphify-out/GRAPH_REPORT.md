# Graph Report - b2b-frontend  (2026-07-02)

## Corpus Check
- 51 files · ~20,269 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 272 nodes · 542 edges · 14 communities (10 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

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
1. `apiFetch()` - 34 edges
2. `formatNumber()` - 16 edges
3. `compilerOptions` - 16 edges
4. `useAuth()` - 15 edges
5. `siteName()` - 15 edges
6. `DataState()` - 11 edges
7. `PageHeader()` - 10 edges
8. `qs()` - 10 edges
9. `formatDate()` - 8 edges
10. `ProductRow()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `AdminCategoriesPage()` --calls--> `useAuth()`  [INFERRED]
  src/app/[locale]/(app)/admin/categories/page.tsx → src/lib/auth/auth-context.tsx
- `ProductDetailPage()` --calls--> `formatNumber()`  [EXTRACTED]
  src/app/[locale]/(app)/products/[catalogId]/page.tsx → src/lib/format.ts
- `AdminHomePage()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/[locale]/(app)/admin/page.tsx → src/lib/auth/auth-context.tsx
- `RolesPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/[locale]/(app)/admin/roles/page.tsx → src/lib/auth/auth-context.tsx
- `AdminSubcategoriesPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/[locale]/(app)/admin/subcategories/page.tsx → src/lib/auth/auth-context.tsx

## Import Cycles
- None detected.

## Communities (14 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (57): apiFetch(), qs(), addProductOverride(), assignCategories(), assignSubcategories(), createGlobalCategory(), createGlobalSubcategory(), createPermission() (+49 more)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (33): getProducts(), getStats(), DataState(), PageHeader(), CategoryAgg, MarketMap(), MarketMapProps, ML_BY_NUMERIC (+25 more)

### Community 2 - "Community 2"
Cohesion: 0.10
Nodes (19): AdminHomePage(), googleLoginUrl(), AppShell(), NAV, AuthGuard(), AuthContext, AuthContextValue, useAuth() (+11 more)

### Community 3 - "Community 3"
Cohesion: 0.14
Nodes (11): ApiError, AuthProvider(), Providers(), Locale, routing, QueryProvider(), inter, metadata (+3 more)

### Community 4 - "Community 4"
Cohesion: 0.10
Nodes (20): description, devDependencies, autoprefixer, eslint, eslint-config-next, postcss, tailwindcss, @types/node (+12 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 6 - "Community 6"
Cohesion: 0.13
Nodes (15): dependencies, flag-icons, @hookform/resolvers, lucide-react, next, next-intl, react, react-dom (+7 more)

### Community 11 - "Community 11"
Cohesion: 0.15
Nodes (11): API contract consumed (via the BFF, `:provider = ml`), Architecture, CLAUDE.md — b2b-frontend, Commands, Conventions, Data dependency, Stack, b2b-frontend (+3 more)

### Community 12 - "Community 12"
Cohesion: 0.24
Nodes (10): detectEcommerce(), detectProductUrl(), DetectResult, DetectStatus, Ecommerce, ECOMMERCE_NAMES, isMlProductPath(), ML_DOMAIN_TO_SITE (+2 more)

### Community 13 - "Community 13"
Cohesion: 0.24
Nodes (6): ChartDatum, HistoryChart(), Kpi(), Currency, PriceView, ProductDetailPage()

## Knowledge Gaps
- **90 isolated node(s):** `extends`, `withNextIntl`, `nextConfig`, `name`, `version` (+85 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `routing` connect `Community 3` to `Community 2`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Community 2` to `Community 1`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 6` to `Community 4`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `extends`, `withNextIntl`, `nextConfig` to the rest of the system?**
  _90 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06612021857923497 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.10708898944193061 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.09743589743589744 - nodes in this community are weakly interconnected._