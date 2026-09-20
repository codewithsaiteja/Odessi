/**
 * ODESSI.TFI — Categories API
 *
 * Maps to: GET /api/categories
 */

import type { ApiResponse, Category } from "@/types";
import { apiGet } from "./client";

export async function getCategories(): Promise<ApiResponse<Category[]>> {
  return apiGet<ApiResponse<Category[]>>("/api/categories");
}

export async function getCategoryBySlug(
  slug: string
): Promise<ApiResponse<Category>> {
  return apiGet<ApiResponse<Category>>(`/api/categories/${encodeURIComponent(slug)}`);
}
