import { apiFetch, BFF_URL, qs } from './client';
import type {
  AuthUser,
  Category,
  CatalogProduct,
  CategoryCandidate,
  CategoryFacet,
  GlobalCategory,
  GlobalSubcategory,
  HistoryPoint,
  Paginated,
  Permission,
  Product,
  ProductListParams,
  ProductOverrideInput,
  Role,
  Stats,
  SubcategoryCandidate,
} from '../types';

const PROVIDER = 'ml';

// Prisma Decimal columns serialize as strings over JSON (e.g. "239", "4.8").
// Coerce them to numbers so the UI can do math/formatting safely.
function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function normalizeProduct(p: Product): Product {
  return {
    ...p,
    price: num(p.price) ?? 0,
    original_price: num(p.original_price),
    discount_pct: num(p.discount_pct),
    rating: num(p.rating),
    usd_price: num(p.usd_price),
  };
}

function normalizeHistory(h: HistoryPoint): HistoryPoint {
  return {
    ...h,
    price: num(h.price) ?? 0,
    original_price: num(h.original_price),
    usd_price: num(h.usd_price),
  };
}

// --- Auth -------------------------------------------------------------------

export const getMe = () => apiFetch<AuthUser>('/auth/me');

export const login = (email: string, password: string) =>
  apiFetch<AuthUser>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const register = (email: string, password: string, name?: string) =>
  apiFetch<AuthUser>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });

export const logout = () => apiFetch<void>('/auth/logout', { method: 'POST' });

/** Full-page navigation target that starts the Google OAuth dance on the BFF. */
export const googleLoginUrl = () => `${BFF_URL}/auth/google`;

// --- Data -------------------------------------------------------------------

export const getStats = () => apiFetch<Stats>(`/v1/${PROVIDER}/stats`);

export const getProducts = async (params: ProductListParams = {}) => {
  const { include_overrides, ...rest } = params;
  const res = await apiFetch<Paginated<Product>>(
    `/v1/${PROVIDER}/products${qs({
      ...rest,
      include_overrides: include_overrides ? 'true' : undefined,
    })}`,
  );
  return { ...res, data: res.data.map(normalizeProduct) };
};

export const getProductCatalog = (search: string) =>
  apiFetch<CatalogProduct[]>(`/v1/${PROVIDER}/products/catalog${qs({ search })}`);

export const getProductHistory = async (params: {
  ml_public_id?: string;
  catalog_id?: string;
}) => {
  const res = await apiFetch<HistoryPoint[]>(
    `/v1/${PROVIDER}/products/history${qs({ ...params })}`,
  );
  return res.map(normalizeHistory);
};

export const getCategories = (params: { country?: string; parent_only?: boolean } = {}) =>
  apiFetch<Category[]>(
    `/v1/${PROVIDER}/categories${qs({
      country: params.country,
      parent_only: params.parent_only ? 'true' : undefined,
    })}`,
  );

/** Category facets that have products (canonical + unmapped) for the filter. */
export const getProductCategories = (country?: string) =>
  apiFetch<CategoryFacet[]>(`/v1/${PROVIDER}/products/categories${qs({ country })}`);

// --- Canonical category curation (admin: admin:manage) ----------------------

export const listGlobalCategories = () =>
  apiFetch<GlobalCategory[]>(`/v1/${PROVIDER}/global-categories`);

export const getCategoryCandidates = (country?: string) =>
  apiFetch<CategoryCandidate[]>(
    `/v1/${PROVIDER}/global-categories/candidates${qs({ country })}`,
  );

export const createGlobalCategory = (name: string) =>
  apiFetch<GlobalCategory>(`/v1/${PROVIDER}/global-categories`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });

export const renameGlobalCategory = (id: number, name: string) =>
  apiFetch(`/v1/${PROVIDER}/global-categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });

export const deleteGlobalCategory = (id: number) =>
  apiFetch<void>(`/v1/${PROVIDER}/global-categories/${id}`, { method: 'DELETE' });

export const assignCategories = (id: number, categoryIds: number[]) =>
  apiFetch(`/v1/${PROVIDER}/global-categories/${id}/assign`, {
    method: 'POST',
    body: JSON.stringify({ categoryIds }),
  });

export const unassignCategories = (categoryIds: number[]) =>
  apiFetch(`/v1/${PROVIDER}/global-categories/unassign`, {
    method: 'POST',
    body: JSON.stringify({ categoryIds }),
  });

// --- Canonical subcategory curation (admin: admin:manage) -------------------

export const listGlobalSubcategories = (globalCategoryId?: number) =>
  apiFetch<GlobalSubcategory[]>(
    `/v1/${PROVIDER}/global-subcategories${qs({ global_category_id: globalCategoryId })}`,
  );

export const getSubcategoryCandidates = (country?: string) =>
  apiFetch<SubcategoryCandidate[]>(
    `/v1/${PROVIDER}/global-subcategories/candidates${qs({ country })}`,
  );

export const createGlobalSubcategory = (name: string, globalCategoryId: number) =>
  apiFetch<GlobalSubcategory>(`/v1/${PROVIDER}/global-subcategories`, {
    method: 'POST',
    body: JSON.stringify({ name, globalCategoryId }),
  });

export const renameGlobalSubcategory = (id: number, name: string) =>
  apiFetch(`/v1/${PROVIDER}/global-subcategories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });

export const deleteGlobalSubcategory = (id: number) =>
  apiFetch<void>(`/v1/${PROVIDER}/global-subcategories/${id}`, { method: 'DELETE' });

export const assignSubcategories = (id: number, categoryIds: number[]) =>
  apiFetch(`/v1/${PROVIDER}/global-subcategories/${id}/assign`, {
    method: 'POST',
    body: JSON.stringify({ categoryIds }),
  });

export const unassignSubcategories = (categoryIds: number[]) =>
  apiFetch(`/v1/${PROVIDER}/global-subcategories/unassign`, {
    method: 'POST',
    body: JSON.stringify({ categoryIds }),
  });

// --- Per-product curation overrides (admin: admin:manage) -------------------

/** Excludes a mis-listed product from the leaf category it was scraped under. */
export const addProductOverride = (input: ProductOverrideInput) =>
  apiFetch(`/v1/${PROVIDER}/product-overrides`, {
    method: 'POST',
    body: JSON.stringify(input),
  });

/** Removes the exclusion (re-includes the product in its leaf). */
export const removeProductOverride = (input: ProductOverrideInput) =>
  apiFetch(`/v1/${PROVIDER}/product-overrides/remove`, {
    method: 'POST',
    body: JSON.stringify(input),
  });

// --- Roles & permissions (admin: admin:manage; BFF-native /admin/*) ---------

export const listRoles = () => apiFetch<Role[]>('/admin/roles');

export const createRole = (name: string, description?: string) =>
  apiFetch<Role>('/admin/roles', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  });

export const listPermissions = () => apiFetch<Permission[]>('/admin/permissions');

export const createPermission = (key: string, description?: string) =>
  apiFetch<Permission>('/admin/permissions', {
    method: 'POST',
    body: JSON.stringify({ key, description }),
  });

export const setRolePermissions = (roleId: string, permissionKeys: string[]) =>
  apiFetch(`/admin/roles/${roleId}/permissions`, {
    method: 'POST',
    body: JSON.stringify({ permissionKeys }),
  });
