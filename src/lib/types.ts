// Data contract mirrored from the b2b-bff API. Keep in sync with the BFF/ml-service.
// Decimals arrive as numbers (or strings) over JSON; we normalize with Number().

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
  permissions: string[];
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
  shipping_type: string | null;
  is_cbt: boolean;
  usd_price: number | null;
  currency: string | null;
  category: ProductCategoryRef;
  seller: ProductSellerRef;
  /** How many snapshots we have for this listing (ml_public_id). */
  snapshot_count: number;
  /** Date of the most recent snapshot for this listing. */
  last_snapshot_date: string;
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
  ranking_position: number | null;
  sold_count: number | null;
  ml_public_id: string | null;
  catalog_id: string | null;
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

export interface Stats {
  total_products: number;
  total_categories: number;
  total_sellers: number;
  latest_snapshot: string | null;
  by_country: Array<{ country: string; count: number }>;
  snapshot_dates: string[];
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
}
