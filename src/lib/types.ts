// Data contract mirrored from the b2b-bff API. Keep in sync with the BFF/ml-service.
// Decimals arrive as numbers (or strings) over JSON; we normalize with Number().

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
  permissions: string[];
  /** Free-form per-user UI preferences (onboarding flags, etc.). */
  preferences: UserPreferences;
}

/** Per-user UI preferences the frontend owns. All fields optional. */
export interface UserPreferences {
  /** Set once the user has completed/dismissed the analytics tutorial. */
  seenAnalyticsTutorial?: boolean;
  [key: string]: unknown;
}

export interface ProductCategoryRef {
  name: string;
  ml_id: string;
}

export interface ProductSellerRef {
  nickname: string | null;
  is_official_store: boolean;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  original_price: number | null;
  discount_pct: number | null;
  country: string | null;
  snapshot_date: string;
  ranking_position: number | null;
  sold_count: number | null;
  rating: number | null;
  review_count: number | null;
  brand: string | null;
  ml_public_id: string | null;
  catalog_id: string | null;
  /**
   * Stable product identity: catalog_id for catalog products, else ml_public_id
   * (the listing). Use THIS — not ml_public_id — to dedupe/key/navigate, so a
   * catalog's rotating buy-box winners are one product. `product_type` says which.
   */
  canonical_id: string | null;
  /** URL-form class: 'catalog' (/p/), 'user_product' (/up/), 'listing' (classic). */
  product_type: 'catalog' | 'user_product' | 'listing' | null;
  shipping_type: string | null;
  is_cbt: boolean;
  usd_price: number | null;
  currency: string | null;
  category: ProductCategoryRef;
  seller: ProductSellerRef;
  /** How many snapshots we have for this product (by canonical_id). */
  snapshot_count: number;
  /** Date of the most recent snapshot for this product. */
  last_snapshot_date: string;
  /**
   * Only present when the listing was fetched with `include_overrides` (admin
   * curation): true if this product has a curation override removing it from its
   * leaf (either a pure exclusion or a remap).
   */
  is_excluded?: boolean;
  /**
   * The canonical subcategory this product was remapped to, when `is_excluded`
   * and it's a remap (null = the override is a pure exclusion).
   */
  override_target_subcategory_id?: number | null;
}

export interface Paginated<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface CatalogProduct {
  catalog_id: string;
  name: string;
  brand: string | null;
  first_seen_at: string;
  last_seen_at: string;
}

export interface HistoryPoint {
  name?: string | null;
  snapshot_date: string;
  price: number;
  original_price: number | null;
  /** Discount applied at this snapshot, as a percentage (e.g. 9.16 = 9.16%). */
  discount_pct: number | null;
  usd_price: number | null;
  currency: string | null;
  ranking_position: number | null;
  sold_count: number | null;
  /** Visits in the trailing 7 days at the time of the snapshot. */
  weekly_visits: number | null;
  brand: string | null;
  ml_public_id: string | null;
  catalog_id: string | null;
  /** URL-form class: 'catalog' (/p/), 'user_product' (/up/), 'listing' (classic). */
  product_type: 'catalog' | 'user_product' | 'listing' | null;
  /** The buy-box winner (seller) at this snapshot, for the winners menu. */
  seller: { nickname: string | null; is_official_store: boolean } | null;
}

/** One point on the daily visits series (separate from the snapshot history). */
export interface VisitPoint {
  /** Calendar day of the visits count (ISO date). */
  date: string;
  weekly_visits: number | null;
}

/**
 * One reconstructed daily row for a tracked product's snapshots table. The wide
 * `products` table is insert-on-change (sparse), so days that were checked but
 * unchanged have no real snapshot; we carry forward the latest snapshot's values
 * and pair them with that day's `weekly_visits` from the dense visits series, so
 * every checked day shows a row. See `buildDailySnapshots` in `lib/tracked.ts`.
 */
export interface DailySnapshot {
  /** The checked day (ISO date, from the visits series). */
  date: string;
  price: number | null;
  discount_pct: number | null;
  ranking_position: number | null;
  sold_count: number | null;
  usd_price: number | null;
  currency: string | null;
  weekly_visits: number | null;
}

/**
 * Product history response. Snapshots (`history`) are written insert-on-change
 * for tracked products, so they are sparse; the visits series (`visits`) is the
 * dense daily demand curve kept in its own table.
 */
export interface HistoryResponse {
  history: HistoryPoint[];
  visits: VisitPoint[];
}

/** A client's product-tracking subscription. */
export interface TrackedProduct {
  id: number;
  client_id: string;
  url: string;
  country: string;
  catalog_id: string | null;
  ml_public_id: string | null;
  /** Product name from the latest snapshot; null until the first snapshot lands. */
  name: string | null;
  cadence_hours: number;
  next_run_at: string;
  active: boolean;
  last_run_at: string | null;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  country: string;
  ml_id: string;
  parent_id: number | null;
  has_bestsellers: boolean | null;
  bestsellers_checked_at: string | null;
}

/**
 * One option in the explorer's category filter. `kind` distinguishes a canonical
 * (cross-country) category from an unmapped per-country one; the products query
 * uses `global_category_id` or `category_id` accordingly.
 */
export interface CategoryFacet {
  kind: 'global' | 'category';
  id: number;
  name: string;
  country: string | null;
  product_count: number;
}

/** A canonical category in the admin curation page. */
export interface GlobalCategory {
  id: number;
  name: string;
  slug: string;
  category_count: number;
}

/** A permission key the BFF guard can enforce (e.g. `catalog:read`). */
export interface Permission {
  id: string;
  key: string;
  description: string | null;
}

/** A role with the permissions granted to it. */
export interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: Array<{ permission: Permission }>;
}

/** A per-country category the admin can link to a canonical one. */
export interface CategoryCandidate {
  id: number;
  name: string;
  country: string;
  ml_id: string;
  product_count: number;
  global_category_id: number | null;
  global_name: string | null;
}

/** A canonical subcategory (nested under a GlobalCategory) in the admin page. */
export interface GlobalSubcategory {
  id: number;
  name: string;
  slug: string;
  global_category_id: number;
  global_category_name: string | null;
  category_count: number;
}

/**
 * A per-country leaf category the admin can link to a canonical subcategory. The
 * `global_category_*` fields are the canonical category it inherits from its root
 * parent — the page filters candidates by it so leaves are grouped within their
 * own canonical category.
 */
export interface SubcategoryCandidate {
  id: number;
  name: string;
  country: string;
  ml_id: string;
  product_count: number;
  parent_name: string | null;
  global_category_id: number | null;
  global_category_name: string | null;
  global_subcategory_id: number | null;
  global_subcategory_name: string | null;
}

/**
 * Per-country market metrics for the dashboard map. Each product contributes its
 * most recent observation, so `count` is distinct products currently listed (not
 * all-time snapshot rows). Shares are 0–1; `avg_discount_pct` is 0–100.
 */
export interface CountryMetrics {
  country: string;
  count: number;
  seller_count: number;
  category_count: number;
  median_usd_price: number | null;
  avg_discount_pct: number | null;
  official_store_share: number | null;
  cbt_share: number | null;
  latest_snapshot: string | null;
}

export interface Stats {
  total_products: number;
  total_categories: number;
  total_sellers: number;
  latest_snapshot: string | null;
  by_country: CountryMetrics[];
  snapshot_dates: string[];
}

/** Which per-country metric the map choropleth / scrubber colors by. */
export type CountryMetric = 'count' | 'median_price' | 'discount' | 'official_share';

/** Per-country time series of one metric, aligned to a shared ascending date axis. */
export interface CountryTimeseries {
  dates: string[];
  by_country: Array<{ country: string; values: Array<number | null> }>;
}

/**
 * Cross-border price comparison for one canonical category across markets.
 * (Catalog IDs are per-site on MercadoLibre, so the shared identity that can be
 * compared across countries is the canonical category, not the product.)
 */
export interface CategoryPriceGap {
  category_id: number;
  name: string;
  country_count: number;
  min_usd: number;
  max_usd: number;
  cheapest_country: string;
  priciest_country: string;
  gap_pct: number;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  country?: string;
  category_id?: string;
  global_category_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  /** Canonical subcategory view (effective-subcategory query, honors overrides). */
  global_subcategory_id?: string;
  /** Admin curation: keep excluded products in the list, flagged `is_excluded`. */
  include_overrides?: boolean;
}

/** A per-product curation override (admin): an exclusion or a remap. */
export interface ProductOverrideInput {
  country: string;
  ml_public_id: string;
  source_category_id: number;
  /** Omit / null = exclude from the leaf; a canonical subcategory id = remap to it. */
  target_subcategory_id?: number | null;
}
