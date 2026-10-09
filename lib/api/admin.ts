import { apiGet, apiPost, apiPut, apiPatch, apiDelete, apiPostFormData, ApiError } from "./client";

export interface DashboardOrderSummary {
  id: number;
  orderNumber: string;
  userId: number | null;
  customerName: string;
  customerEmail: string | null;
  totalAmount: number;
  currency: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export interface LowStockVariantSummary {
  variantId: number;
  productName: string;
  sku: string;
  size: string;
  color: string;
  stockQuantity: number;
}

export interface AdminDashboardStats {
  totalOrders: number;
  totalRevenue: number;
  pendingPaymentCount: number;
  confirmedCount: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  recentOrders: DashboardOrderSummary[];
  lowStockProducts: LowStockVariantSummary[];
  recentCustomers: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    enabled: boolean;
    emailVerified: boolean;
    orderCount: number;
    createdAt: string;
  }[];
}


export interface AdminProductRequest {
  name: string;
  slug?: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number | null;
  currency?: string;
  categoryId?: number | null;
  collectionId?: number | null;
  material?: string;
  fit?: string;
  careInstructions?: string;
  featured: boolean;
  bestseller: boolean;
  newArrival: boolean;
  active: boolean;
  status?: string;
  variants?: any[];
}

export interface AdminVariantRequest {
  id?: number;
  sku: string;
  size: string;
  color: string;
  colorHex?: string;
  price: number;
  stockQuantity: number;
  active: boolean;
}

export interface InventoryAdjustmentRequest {
  variantId: number;
  quantityChange: number;
  reason: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

// ── Admin Dashboard ──────────────────────────────────────────────
/**
 * Fetch dashboard KPIs for the given time range.
 *
 * @param range one of: TODAY | 7_DAYS | 30_DAYS | 90_DAYS | ALL
 *              Unknown values are treated as ALL by the backend.
 */
export async function getAdminDashboardStats(range: string = "ALL"): Promise<AdminDashboardStats> {
  return apiGet<AdminDashboardStats>(`/api/admin/dashboard/stats?range=${encodeURIComponent(range)}`);
}


// ── Admin Products ───────────────────────────────────────────────
export async function getAdminProducts(
  page = 0,
  size = 20,
  search?: string,
  status?: string
): Promise<PageResponse<any>> {
  const query = new URLSearchParams({ page: String(page), size: String(size) });
  if (search) query.append("search", search);
  if (status && status !== "ALL") query.append("status", status);
  return apiGet<PageResponse<any>>(`/api/admin/products?${query.toString()}`);
}

export async function getAdminProductById(id: number): Promise<any> {
  return apiGet<any>(`/api/admin/products/${id}`);
}

export async function createAdminProduct(data: AdminProductRequest): Promise<any> {
  return apiPost<any>("/api/admin/products", data);
}

export async function updateAdminProduct(id: number, data: AdminProductRequest): Promise<any> {
  return apiPut<any>(`/api/admin/products/${id}`, data);
}

export async function toggleAdminProductActive(id: number): Promise<any> {
  return apiPatch<any>(`/api/admin/products/${id}/status`);
}

export async function toggleAdminProductFeatured(id: number): Promise<any> {
  return apiPatch<any>(`/api/admin/products/${id}/featured`);
}

export async function duplicateAdminProduct(id: number): Promise<any> {
  return apiPost<any>(`/api/admin/products/${id}/duplicate`);
}

export async function deleteAdminProduct(id: number): Promise<{ message: string; archived?: boolean }> {
  return apiDelete<{ message: string; archived?: boolean }>(`/api/admin/products/${id}`);
}

export async function bulkAdminProductAction(
  dataOrIds: { productIds: number[]; action: string; collectionId?: number } | number[],
  actionStr?: string
): Promise<any[]> {
  const payload = Array.isArray(dataOrIds)
    ? { productIds: dataOrIds, action: actionStr || "PUBLISH" }
    : dataOrIds;
  return apiPost<any[]>("/api/admin/products/bulk", payload);
}

export async function getAdminProductActivity(id: number): Promise<any[]> {
  try {
    return await apiGet<any[]>(`/api/admin/products/${id}/activity`);
  } catch {
    return [];
  }
}

export async function addAdminVariant(productId: number, data: AdminVariantRequest): Promise<any> {
  return apiPost<any>(`/api/admin/products/${productId}/variants`, data);
}

export async function updateAdminVariant(productId: number, variantId: number, data: AdminVariantRequest): Promise<any> {
  return apiPut<any>(`/api/admin/products/${productId}/variants/${variantId}`, data);
}

export async function deleteAdminVariant(productId: number, variantId: number): Promise<any> {
  return apiDelete<any>(`/api/admin/products/${productId}/variants/${variantId}`);
}

// ── Admin Inventory ──────────────────────────────────────────────
export async function getAdminInventory(page = 0, size = 20): Promise<PageResponse<any>> {
  try {
    return await apiGet<PageResponse<any>>(`/api/admin/inventory?page=${page}&size=${size}`);
  } catch (err: unknown) {
    if (err instanceof ApiError && (err.errorCode === "NETWORK_ERROR" || err.status === 0)) {
      return { content: [], totalPages: 1, totalElements: 0, number: page, size };
    }
    throw err;
  }
}

export async function adjustAdminInventory(data: InventoryAdjustmentRequest): Promise<any> {
  return apiPost<any>("/api/admin/inventory/adjust", data);
}

export async function getAdminInventoryLogs(page = 0, size = 20, variantId?: number): Promise<PageResponse<any>> {
  try {
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (variantId) query.append("variantId", String(variantId));
    return await apiGet<PageResponse<any>>(`/api/admin/inventory/logs?${query.toString()}`);
  } catch (err: unknown) {
    if (err instanceof ApiError && (err.errorCode === "NETWORK_ERROR" || err.status === 0)) {
      return { content: [], totalPages: 1, totalElements: 0, number: page, size };
    }
    throw err;
  }
}

// ── Admin Orders ─────────────────────────────────────────────────
export async function getAdminOrders(page = 0, size = 20, status?: string): Promise<PageResponse<any>> {
  try {
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) query.append("status", status);
    return await apiGet<PageResponse<any>>(`/api/admin/orders?${query.toString()}`);
  } catch (err: unknown) {
    if (err instanceof ApiError && (err.errorCode === "NETWORK_ERROR" || err.status === 0)) {
      return { content: [], totalPages: 1, totalElements: 0, number: page, size };
    }
    throw err;
  }
}

export async function getAdminOrderById(id: number): Promise<any> {
  return apiGet<any>(`/api/admin/orders/${id}`);
}

export async function updateAdminOrderStatus(id: number, status: string): Promise<any> {
  return apiPatch<any>(`/api/admin/orders/${id}/status`, { status });
}

// ── Admin Users ──────────────────────────────────────────────────
export async function getAdminUsers(page = 0, size = 20): Promise<PageResponse<any>> {
  try {
    return await apiGet<PageResponse<any>>(`/api/admin/users?page=${page}&size=${size}`);
  } catch (err: unknown) {
    if (err instanceof ApiError && (err.errorCode === "NETWORK_ERROR" || err.status === 0)) {
      return { content: [], totalPages: 1, totalElements: 0, number: page, size };
    }
    throw err;
  }
}

export async function getAdminUserById(id: number): Promise<any> {
  return apiGet<any>(`/api/admin/users/${id}`);
}

export async function toggleAdminUserEnabled(id: number): Promise<any> {
  return apiPatch<any>(`/api/admin/users/${id}/toggle-enabled`);
}

// ── Admin Categories & Collections ──────────────────────────────
export async function getAdminCategories(): Promise<any[]> {
  return apiGet<any[]>("/api/admin/categories");
}

export async function createAdminCategory(data: any): Promise<any> {
  return apiPost<any>("/api/admin/categories", data);
}

export async function updateAdminCategory(id: number, data: any): Promise<any> {
  return apiPut<any>(`/api/admin/categories/${id}`, data);
}

export async function toggleAdminCategoryActive(id: number): Promise<any> {
  return apiPatch<any>(`/api/admin/categories/${id}/status`);
}

/**
 * Upload or replace the image for a category.
 * Sends a multipart/form-data POST with field name "file".
 * Returns the updated CategoryResponse with the new imageUrl.
 */
export async function uploadAdminCategoryImage(
  categoryId: number,
  file: File
): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);
  return apiPostFormData<any>(`/api/admin/categories/${categoryId}/image`, formData);
}

/**
 * Remove the image from a category and delete the file from storage.
 * Returns the updated CategoryResponse with image set to null.
 */
export async function deleteAdminCategoryImage(categoryId: number): Promise<any> {
  return apiDelete<any>(`/api/admin/categories/${categoryId}/image`);
}


export async function getAdminCollections(): Promise<any[]> {
  return apiGet<any[]>("/api/admin/collections");
}

export async function createAdminCollection(data: any): Promise<any> {
  return apiPost<any>("/api/admin/collections", data);
}

export async function updateAdminCollection(id: number, data: any): Promise<any> {
  return apiPut<any>(`/api/admin/collections/${id}`, data);
}

export async function toggleAdminCollectionActive(id: number): Promise<any> {
  return apiPatch<any>(`/api/admin/collections/${id}/status`);
}

/**
 * Upload an unlinked collection cover image.
 * Sends a multipart/form-data POST with field "file".
 * Returns { url: string }.
 */
export async function uploadAdminCollectionImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return apiPostFormData<{ url: string }>("/api/admin/collections/upload", formData);
}

/**
 * Upload or replace the cover image for an existing collection.
 * Sends a multipart/form-data POST with field "file".
 * Returns updated CollectionResponse.
 */
export async function uploadAdminCollectionImageForId(
  collectionId: number,
  file: File
): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);
  return apiPostFormData<any>(`/api/admin/collections/${collectionId}/image`, formData);
}

/**
 * Remove the cover image from a collection.
 * Returns updated CollectionResponse with heroImage set to null.
 */
export async function deleteAdminCollectionImage(collectionId: number): Promise<any> {
  return apiDelete<any>(`/api/admin/collections/${collectionId}/image`);
}

// ── Admin Audit Logs ─────────────────────────────────────────────
export async function getAdminAuditLogs(page = 0, size = 20): Promise<PageResponse<any>> {
  try {
    return await apiGet<PageResponse<any>>(`/api/admin/audit-logs?page=${page}&size=${size}`);
  } catch (err: unknown) {
    if (err instanceof ApiError && (err.errorCode === "NETWORK_ERROR" || err.status === 0)) {
      return { content: [], totalPages: 1, totalElements: 0, number: page, size };
    }
    throw err;
  }
}

// ── Admin Product Media ──────────────────────────────────────────
export async function uploadAdminProductImage(
  productId: number,
  file: File,
  altText?: string,
  isPrimary?: boolean
): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);
  if (altText) formData.append("altText", altText);
  if (isPrimary !== undefined) formData.append("isPrimary", String(isPrimary));

  return apiPostFormData<any>(`/api/admin/products/${productId}/images`, formData);
}

export async function deleteAdminProductImage(
  productId: number,
  imageId: number
): Promise<void> {
  return apiDelete(`/api/admin/products/${productId}/images/${imageId}`);
}

export async function setAdminPrimaryProductImage(
  productId: number,
  imageId: number
): Promise<any> {
  return apiPut<any>(`/api/admin/products/${productId}/images/${imageId}/primary`);
}

export async function reorderAdminProductImages(
  productId: number,
  imageIds: number[]
): Promise<any> {
  return apiPut<any>(`/api/admin/products/${productId}/images/reorder`, imageIds);
}

