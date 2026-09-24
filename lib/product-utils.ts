/**
 * ODESSI.TFI — Product utilities
 * 
 * Helper functions for product filtering, sorting, search, and display
 */

import type { Product, ProductFilters, ProductSort, SearchQuery } from "@/types";
import { products } from "@/data/products";

/* ── Product retrieval ── */

export function getAllProducts(): Product[] {
  return products;
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

/* ── Filtering ── */

export function filterProducts(filters: ProductFilters, productList?: Product[]): Product[] {
  let filtered = productList ? [...productList] : [...products];

  if (filters.category) {
    filtered = filtered.filter((p) => p.category === filters.category);
  }

  if (filters.collection) {
    filtered = filtered.filter((p) => p.collection === filters.collection);
  }

  if (filters.size) {
    filtered = filtered.filter((p) => 
      p.sizes.some(size => size.label === filters.size && size.available)
    );
  }

  if (filters.color) {
    filtered = filtered.filter((p) =>
      p.colors.some(color => color.name.toLowerCase().includes(filters.color!.toLowerCase()))
    );
  }

  if (filters.minPrice !== undefined) {
    filtered = filtered.filter((p) => p.price >= filters.minPrice!);
  }

  if (filters.maxPrice !== undefined) {
    filtered = filtered.filter((p) => p.price <= filters.maxPrice!);
  }

  if (filters.available !== undefined) {
    filtered = filtered.filter((p) => p.available === filters.available);
  }

  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter((p) =>
      p.tags && filters.tags!.some(tag => p.tags!.includes(tag))
    );
  }

  return filtered;
}

/* ── Sorting ── */

export function sortProducts(products: Product[], sort: ProductSort): Product[] {
  const sorted = [...products];

  switch (sort.field) {
    case "featured":
      return sorted.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return 0;
      });

    case "newest":
      return sorted.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    case "price_low":
      return sorted.sort((a, b) => a.price - b.price);

    case "price_high":
      return sorted.sort((a, b) => b.price - a.price);

    case "bestselling":
      return sorted.sort((a, b) => {
        if (a.bestseller && !b.bestseller) return -1;
        if (!a.bestseller && b.bestseller) return 1;
        return 0;
      });

    default:
      return sorted;
  }
}

/* ── Search ── */

export function searchProducts(query: SearchQuery): Product[] {
  let results = [...products];

  // Text search
  if (query.q.trim()) {
    const searchTerm = query.q.toLowerCase().trim();
    results = results.filter((p) =>
      p.name.toLowerCase().includes(searchTerm) ||
      p.description.toLowerCase().includes(searchTerm) ||
      p.tagline?.toLowerCase().includes(searchTerm) ||
      p.category.toLowerCase().includes(searchTerm) ||
      p.collection?.toLowerCase().includes(searchTerm) ||
      p.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  // Apply filters
  if (query.filters) {
    results = filterProducts(query.filters);
  }

  // Apply sorting
  if (query.sort) {
    results = sortProducts(results, query.sort);
  }

  return results;
}

/* ── URL parameter helpers ── */

export function filtersToUrlParams(filters: ProductFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.category) params.set("category", filters.category);
  if (filters.collection) params.set("collection", filters.collection);
  if (filters.size) params.set("size", filters.size);
  if (filters.color) params.set("color", filters.color);
  if (filters.minPrice !== undefined) params.set("minPrice", filters.minPrice.toString());
  if (filters.maxPrice !== undefined) params.set("maxPrice", filters.maxPrice.toString());
  if (filters.available !== undefined) params.set("available", filters.available.toString());
  if (filters.tags && filters.tags.length > 0) {
    params.set("tags", filters.tags.join(","));
  }

  return params;
}

export function urlParamsToFilters(searchParams: URLSearchParams): ProductFilters {
  const filters: ProductFilters = {};

  const category = searchParams.get("category");
  if (category && ["tees", "hoodies", "new-drops", "custom", "accessories"].includes(category)) {
    filters.category = category as import("@/types").ProductCategory;
  }

  const collection = searchParams.get("collection");
  if (collection) filters.collection = collection;

  const size = searchParams.get("size");
  if (size) filters.size = size;

  const color = searchParams.get("color");
  if (color) filters.color = color;

  const minPrice = searchParams.get("minPrice");
  if (minPrice) filters.minPrice = parseInt(minPrice, 10);

  const maxPrice = searchParams.get("maxPrice");
  if (maxPrice) filters.maxPrice = parseInt(maxPrice, 10);

  const available = searchParams.get("available");
  if (available) filters.available = available === "true";

  const tags = searchParams.get("tags");
  if (tags) filters.tags = tags.split(",").filter(Boolean);

  return filters;
}

/* ── Display helpers ── */

export function formatPrice(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function calculateDiscount(price: number, compareAtPrice?: number): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export function getStockStatus(product: Product): "in_stock" | "low_stock" | "out_of_stock" | "coming_soon" {
  if (product.stockStatus) return product.stockStatus;
  if (!product.available) return "out_of_stock";
  
  // For now, assume in stock if available
  return "in_stock";
}

export function getAvailableSizes(product: Product): string[] {
  return product.sizes.filter(size => size.available).map(size => size.label);
}

export function getAvailableColors(product: Product): string[] {
  return product.colors.map(color => color.name);
}

/* ── Product collections ── */

export function getProductsByCategory(category: string): Product[] {
  return products.filter((p) => p.category === category);
}

export function getProductsByCollection(collection: string): Product[] {
  return products.filter((p) => p.collection === collection);
}

export function getFeaturedProducts(): Product[] {
  return products.filter((p) => p.featured);
}

export function getBestSellers(): Product[] {
  return products.filter((p) => p.bestseller);
}

export function getNewDrops(): Product[] {
  return products.filter((p) => p.newDrop);
}

export function getCustomProducts(): Product[] {
  return products.filter((p) => p.customizable);
}

/* ── Related products ── */

export function getRelatedProducts(product: Product, limit: number = 4): Product[] {
  return products
    .filter((p) => 
      p.id !== product.id && 
      (p.category === product.category || p.collection === product.collection)
    )
    .slice(0, limit);
}

/* ── Media URL resolution helper ── */

export function getMediaUrl(urlInput?: any): string {
  const fallback = "/placeholder-product.svg";
  if (urlInput === null || urlInput === undefined) return fallback;

  let urlStr = "";
  if (typeof urlInput === "string") {
    urlStr = urlInput;
  } else if (typeof urlInput === "number") {
    console.warn(`[getMediaUrl] Received numeric ID '${urlInput}' instead of a valid image URL string or object.`);
    return fallback;
  } else if (typeof urlInput === "object") {
    urlStr = urlInput.imageUrl || urlInput.url || urlInput.previewUrl || urlInput.src || "";
  }

  if (!urlStr || typeof urlStr !== "string") return fallback;
  const trimmed = urlStr.trim();
  if (!trimmed) return fallback;

  // Disallow raw numeric or placeholder IDs like "9" or "p1"
  if (/^\d+$/.test(trimmed) || /^p\d+$/i.test(trimmed)) {
    console.warn(`[getMediaUrl] Received raw numeric or placeholder ID '${trimmed}' instead of an image URL.`);
    return fallback;
  }

  // Blob URLs from client-side file inputs (used during local preview before upload)
  if (trimmed.startsWith("blob:")) {
    return trimmed;
  }

  const defaultApiUrl =
    process.env.NODE_ENV === "production"
      ? "https://odessi-backend.onrender.com"
      : "http://localhost:8080";
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || defaultApiUrl).replace(/\/+$/, "");

  // Match Azure Blob Storage URLs (which remain strictly private and must be routed
  // through the authenticated Spring Boot gateway at /api/media/{category}/{filename})
  // Handles: https://odessimedia2026.blob.core.windows.net/media/products%2Fprod-123.jpg
  //      and: https://odessimedia2026.blob.core.windows.net/media/products/prod-123.jpg
  const azureMatch = trimmed.match(/^https?:\/\/[^/]+\.blob\.core\.windows\.net\/media\/(.+)$/i);
  if (azureMatch) {
    try {
      const rawPath = decodeURIComponent(azureMatch[1]).replace(/\\/g, "/").replace(/^\/+/, "");
      return `${baseUrl}/api/media/${rawPath}`;
    } catch {
      const rawPath = azureMatch[1].replace(/%2F/gi, "/").replace(/^\/+/, "");
      return `${baseUrl}/api/media/${rawPath}`;
    }
  }

  // Canonical Spring Boot media gateway paths
  if (trimmed.startsWith("/api/media/")) {
    return `${baseUrl}${trimmed}`;
  }
  if (trimmed.startsWith("api/media/")) {
    return `${baseUrl}/${trimmed}`;
  }

  // Legacy /uploads/ paths served by Spring Boot
  if (trimmed.startsWith("/uploads/")) {
    return `${baseUrl}${trimmed}`;
  }
  if (trimmed.startsWith("uploads/")) {
    return `${baseUrl}/${trimmed}`;
  }

  // Absolute URLs that already point to the backend media endpoint
  if (trimmed.includes("/api/media/")) {
    return trimmed;
  }

  // External CDN images (e.g. Unsplash) passed through unchanged
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // Static site assets (e.g. /placeholder-product.svg, /logo.png)
  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  return fallback;
}