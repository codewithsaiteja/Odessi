/**
 * ODESSI.TFI — Collections API
 *
 * Maps to: GET /api/collections (Spring Boot backend)
 * Maps to: GET /api/collections/{slug}
 */

import type { Collection } from "@/types";
import { apiGet } from "./client";
import { getMediaUrl } from "@/lib/product-utils";

// Backend DTO shape
export interface BackendCollectionResponse {
  id: number;
  name: string;
  slug: string;
  description?: string;
  heroImage?: string;
  active: boolean;
  featured: boolean;
  productCount?: number;
  createdAt?: string;
}

// Map backend response to frontend Collection type
export function mapCollectionResponse(c: BackendCollectionResponse): Collection {
  const coverImage = c.heroImage
    ? getMediaUrl(c.heroImage)
    : "https://images.unsplash.com/photo-1536922246289-88c42f957773?w=1200&q=85";

  return {
    id: String(c.id),
    name: c.name,
    slug: c.slug,
    tagline: c.description ? c.description.substring(0, 80) + (c.description.length > 80 ? '...' : '') : c.name,
    description: c.description || "",
    coverImage,
    featured: c.featured,
  };
}

/** Fetch all active collections from PostgreSQL via Spring Boot */
export async function getCollections(): Promise<Collection[]> {
  try {
    const res = await apiGet<{ success: boolean; data: BackendCollectionResponse[] }>("/api/collections");
    const list = res?.data || (Array.isArray(res) ? res : []);
    return list.map(mapCollectionResponse);
  } catch (err) {
    console.warn("[collections] Backend unavailable, returning empty list:", err);
    return [];
  }
}

/** Fetch featured collections from PostgreSQL via Spring Boot */
export async function getFeaturedCollections(): Promise<Collection[]> {
  const all = await getCollections();
  return all.filter(c => c.featured);
}

/** Fetch a single collection by slug from PostgreSQL via Spring Boot */
export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
  try {
    const res = await apiGet<{ success: boolean; data: BackendCollectionResponse }>(
      `/api/collections/${encodeURIComponent(slug)}`
    );
    const data = res?.data || res;
    if (!data || !data.slug) return null;
    return mapCollectionResponse(data as BackendCollectionResponse);
  } catch (err) {
    console.warn(`[collections] Backend unavailable for slug '${slug}':`, err);
    return null;
  }
}
