# Graph Report - b2b-frontend  (2026-07-08)

## Corpus Check
- 65 files · ~66,332 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 347 nodes · 747 edges · 14 communities (10 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b6f4cfd4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]

## God Nodes (most connected - your core abstractions)
1. `apiFetch()` - 36 edges
2. `formatNumber()` - 21 edges
3. `useAuth()` - 19 edges
4. `siteName()` - 19 edges
5. `compilerOptions` - 16 edges
6. `formatDate()` - 13 edges
7. `qs()` - 12 edges
8. `formatCurrency()` - 12 edges
9. `formatPercent()` - 12 edges
10. `DataState()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `AdminCategoriesPage()` --calls--> `useAuth()`  [INFERRED]
  src/app/[locale]/(app)/admin/categories/page.tsx → src/lib/auth/auth-context.tsx
- `AdminHomePage()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/[locale]/(app)/admin/page.tsx → src/lib/auth/auth-context.tsx
- `RolesPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/[locale]/(app)/admin/roles/page.tsx → src/lib/auth/auth-context.tsx
- `AdminSubcategoriesPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/[locale]/(app)/admin/subcategories/page.tsx → src/lib/auth/auth-context.tsx
- `DashboardPage()` --calls--> `formatDate()`  [EXTRACTED]
  src/app/[locale]/(app)/dashboard/page.tsx → src/lib/format.ts

## Import Cycles
- None detected.

## Communities (14 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (64): apiFetch(), qs(), addProductOverride(), assignCategories(), assignSubcategories(), createGlobalCategory(), createGlobalSubcategory(), createPermission() (+56 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (40): getProducts(), getStats(), DataState(), ChartDatum, HistoryChart(), Kpi(), PageHeader(), Currency (+32 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (22): AdminHomePage(), ApiError, googleLoginUrl(), AppShell(), NAV, AuthGuard(), AuthContext, AuthContextValue (+14 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (35): dependencies, flag-icons, @hookform/resolvers, lucide-react, next, next-intl, react, react-dom (+27 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 11 - "Community 11"
Cohesion: 0.15
Nodes (11): API contract consumed (via the BFF, `:provider = ml`), Architecture, CLAUDE.md — b2b-frontend, Commands, Conventions, Data dependency, Stack, b2b-frontend (+3 more)

### Community 12 - "Community 12"
Cohesion: 0.24
Nodes (10): detectEcommerce(), detectProductUrl(), DetectResult, DetectStatus, Ecommerce, ECOMMERCE_NAMES, isMlProductPath(), ML_DOMAIN_TO_SITE (+2 more)

### Community 13 - "Community 13"
Cohesion: 0.11
Nodes (23): DbDiagram(), Edge, SCHEMA_BADGE, STEPS, SystemFlow(), ConceptCard(), SCHEMA_ORDER, TableSection() (+15 more)

### Community 14 - "Community 14"
Cohesion: 0.15
Nodes (11): AuthProvider(), Providers(), Locale, routing, QueryProvider(), inter, metadata, sora (+3 more)

### Community 15 - "Community 15"
Cohesion: 0.13
Nodes (23): ChoroplethScope(), CountryCompare(), MapLegend(), MapLegendProps, HoverInfo, MarketMap(), MarketMapProps, ML_BY_NUMERIC (+15 more)

## Knowledge Gaps
- **101 isolated node(s):** `extends`, `withNextIntl`, `nextConfig`, `name`, `version` (+96 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `Community 2` to `Community 1`, `Community 13`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `routing` connect `Community 14` to `Community 1`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `PageHeader()` connect `Community 1` to `Community 2`, `Community 13`, `Community 15`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `extends`, `withNextIntl`, `nextConfig` to the rest of the system?**
  _101 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.058823529411764705 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08671328671328671 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08970099667774087 - nodes in this community are weakly interconnected._