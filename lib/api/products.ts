/**
 * ODESSI.TFI — Product API
 *
 * Authoritative API client connecting customer storefront components directly
 * to the Spring Boot backend / PostgreSQL database.
 */

import type { PaginatedResponse, Product, ProductCategory, ProductVariant, ProductColor, ProductSize } from "@/types";
import { getMediaUrl } from "@/lib/product-utils";
import { apiGet, buildQueryString } from "./client";

// ── Backend response types (mirrors Spring Boot DTOs) ──────────

export interface BackendProductVariantResponse {
  id: number;
  sku: string;
  size: string;
  color: string;
  colorHex: string;
  price: number;
  stockQuantity: number;
  available: boolean;
  active: boolean;
  createdAt?: string;
}

export interface BackendCategoryResponse {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  active?: boolean;
}

interface BackendProductCollectionRef {
  id: number;
  name: string;
  slug: string;
  description?: string;
  heroImage?: string;
  active?: boolean;
  featured?: boolean;
}

export interface BackendProductResponse {
  id: number;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  category?: BackendCategoryResponse;
  collection?: BackendProductCollectionRef;
  material?: string;
  fit?: string;
  careInstructions?: string;
  featured: boolean;
  bestseller: boolean;
  newArrival: boolean;
  active: boolean;
  variants?: BackendProductVariantResponse[];
  images?: Array<{ id: number; imageUrl: string; altText?: string; isPrimary: boolean }>;
  imageUrls?: string[];
  createdAt?: string;
  updatedAt?: string;
  averageRating?: number;
  reviewCount?: number;
}

export interface BackendProductSummaryResponse {
  id: number;
  name: string;
  slug: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  categorySlug?: string;
  categoryName?: string;
  collectionSlug?: string;
  featured: boolean;
  bestseller: boolean;
  newArrival: boolean;
  active: boolean;
  hasAvailableVariants: boolean;
  images?: string[];
  primaryImageUrl?: string;
  createdAt?: string;
  averageRating?: number;
  reviewCount?: number;
}

// ── Mapping functions ──────────────────────────────────────────

function mapBackendVariantToFrontend(backendVariant: BackendProductVariantResponse): ProductVariant {
  return {
    id: String(backendVariant.id),
    sku: backendVariant.sku,
    size: backendVariant.size,
    color: {
      name: backendVariant.color,
      hex: backendVariant.colorHex || "#000000"
    },
    price: backendVariant.price,
    stockQuantity: backendVariant.stockQuantity,
    available: backendVariant.available,
  };
}

function extractResolvedImages(backendProduct: BackendProductResponse): string[] {
  const urls: string[] = [];

  if (backendProduct.images && Array.isArray(backendProduct.images) && backendProduct.images.length > 0) {
    backendProduct.images.forEach((img: any) => {
      const mType = img?.mediaType || "IMAGE";
      if ((mType === "IMAGE" || mType === "DEFAULT") && img?.imageUrl) {
        urls.push(getMediaUrl(img.imageUrl));
      }
    });
  } else if (backendProduct.imageUrls && Array.isArray(backendProduct.imageUrls) && backendProduct.imageUrls.length > 0) {
    backendProduct.imageUrls.forEach((url) => urls.push(getMediaUrl(url)));
  }

  // Fall back to all returned imageUrls if filtering by mediaType yielded zero 2D photos
  if (urls.length === 0 && backendProduct.images && backendProduct.images.length > 0) {
    backendProduct.images.forEach((img: any) => {
      if (img?.imageUrl) urls.push(getMediaUrl(img.imageUrl));
    });
  }

  if (urls.length === 0) {
    urls.push(getMediaUrl(undefined));
  }

  return urls;
}

function mapBackendProductToFrontend(backendProduct: BackendProductResponse): Product {
  const rawVariants = backendProduct?.variants || [];
  const variants = rawVariants.map(mapBackendVariantToFrontend);

  const uniqueSizes = [...new Set(variants.map(v => v.size))];
  const uniqueColors = variants.reduce((colors: ProductColor[], variant) => {
    if (!colors.find(c => c.name === variant.color.name)) {
      colors.push(variant.color);
    }
    return colors;
  }, []);

  const hasVariants = variants.length > 0;
  const finalSizes: ProductSize[] = hasVariants
    ? uniqueSizes.map(size => ({
        label: size,
        available: variants.some(v => v.size === size && v.available)
      }))
    : [];

  const resolvedImages = extractResolvedImages(backendProduct);
  const primaryThumbnail = resolvedImages[0];

  // Extract 3D Model asset if provided by backend product media
  let model3D: import("@/types").Product3DAsset | undefined = undefined;
  const rawMediaList = (backendProduct.images || []) as any[];
  const modelMedia = rawMediaList.find((img: any) => img.mediaType === "MODEL_3D");
  if (modelMedia) {
    const rawUrl = modelMedia.videoUrl || modelMedia.imageUrl;
    model3D = {
      has3DModel: Boolean(rawUrl),
      modelUrl: rawUrl ? getMediaUrl(rawUrl) : undefined,
      posterUrl: modelMedia.posterUrl ? getMediaUrl(modelMedia.posterUrl) : primaryThumbnail,
      modelFormat: rawUrl?.toLowerCase().endsWith(".gltf") ? "gltf" : "glb",
      active: true,
    };
  }

  // Extract 360 Spin sequence if provided by backend product media
  let images360: import("@/types").Product360Sequence | undefined = undefined;
  const spinMedia = rawMediaList
    .filter((img: any) => 
      img.mediaType === "SPIN_360" && 
      img.imageUrl && 
      !img.imageUrl.includes("unsplash.com")
    )
    .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  if (spinMedia.length >= 4) {
    images360 = {
      images: spinMedia.map((m: any) => getMediaUrl(m.imageUrl)),
      totalFrames: spinMedia.length,
    };
  }

  return {
    id: String(backendProduct.id),
    name: backendProduct.name,
    slug: backendProduct.slug,
    description: backendProduct.description,
    shortDescription: backendProduct.shortDescription,
    price: backendProduct.price,
    compareAtPrice: backendProduct.compareAtPrice,
    currency: backendProduct.currency || "INR",
    images: resolvedImages,
    thumbnail: primaryThumbnail,
    category: (backendProduct.category?.slug as ProductCategory) || "tees",
    collection: backendProduct.collection?.slug,
    sizes: finalSizes,
    colors: uniqueColors,
    variants,
    material: backendProduct.material,
    fit: backendProduct.fit,
    careInstructions: backendProduct.careInstructions ? backendProduct.careInstructions.split('\n') : [],
    featured: backendProduct.featured,
    bestseller: backendProduct.bestseller,
    newDrop: backendProduct.newArrival,
    available: backendProduct.active && hasVariants && variants.some(v => v.available),
    stockStatus: !hasVariants ? "out_of_stock" : (variants.some(v => v.available) ? "in_stock" : "out_of_stock"),
    rating: backendProduct.averageRating ?? undefined,
    reviewCount: backendProduct.reviewCount ?? 0,
    model3D,
    images360,
    createdAt: backendProduct.createdAt || new Date().toISOString(),
  };
}

export function mapBackendSummaryToFrontend(summary: BackendProductSummaryResponse): Product {
  const images = (summary.images || []).map(getMediaUrl);
  if (images.length === 0 && summary.primaryImageUrl) {
    images.push(getMediaUrl(summary.primaryImageUrl));
  }
  const resolvedImages = images.length > 0 ? images : ["/placeholder-product.svg"];

  return {
    id: String(summary.id),
    name: summary.name,
    slug: summary.slug,
    description: summary.shortDescription || summary.name,
    shortDescription: summary.shortDescription,
    price: summary.price,
    compareAtPrice: summary.compareAtPrice,
    currency: summary.currency || "INR",
    images: resolvedImages,
    thumbnail: resolvedImages[0],
    category: (summary.categorySlug as ProductCategory) || "tees",
    collection: summary.collectionSlug,
    sizes: [],
    colors: [],
    variants: [],
    featured: summary.featured,
    bestseller: summary.bestseller,
    newDrop: summary.newArrival,
    available: summary.active && summary.hasAvailableVariants,
    stockStatus: summary.hasAvailableVariants ? "in_stock" : "out_of_stock",
    rating: summary.averageRating ?? undefined,
    reviewCount: summary.reviewCount ?? 0,
    createdAt: summary.createdAt || new Date().toISOString(),
  };
}

// ── Params interface ──────────────────────────────────────────

export interface ProductListParams {
  category?: string;
  collection?: string;
  sizeFilter?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  available?: boolean;
  featured?: boolean;
  bestseller?: boolean;
  newArrival?: boolean;
  search?: string;
  sort?: "newest" | "featured" | "price_low" | "price_high" | "bestselling";
  page?: number;
  pageSize?: number;
}

// ── Authoritative API Functions ─────────────────────────────────

/**
 * Fetch paginated product list from PostgreSQL database via Spring Boot.
 * GET /api/products
 */
export async function getProducts(
  params: ProductListParams = {}
): Promise<PaginatedResponse<Product>> {
  const queryParams: Record<string, string | number | boolean | null | undefined> = {
    category:   params.category,
    collection: params.collection,
    size:       params.sizeFilter,
    color:      params.color,
    minPrice:   params.minPrice,
    maxPrice:   params.maxPrice,
    available:  params.available,
    featured:   params.featured,
    bestseller: params.bestseller,
    newArrival: params.newArrival,
    search:     params.search,
    sort:       params.sort ?? "newest",
    page:       params.page ?? 0,
    pageSize:   params.pageSize ?? 20,
  };

  const qs = buildQueryString(queryParams);
  try {
    const paged = await apiGet<any>(`/api/products${qs}`);

    const rawList = paged?.data || paged?.content || (Array.isArray(paged) ? paged : []);
    const content = rawList.map((item: any) => {
      if (item.variants !== undefined || item.description !== undefined) {
        return mapBackendProductToFrontend(item);
      }
      return mapBackendSummaryToFrontend(item);
    });

    return {
      data: content,
      total: paged?.total ?? paged?.totalElements ?? content.length,
      page: paged?.page ?? 0,
      pageSize: paged?.pageSize ?? paged?.size ?? content.length,
      totalPages: paged?.totalPages ?? 1,
    };
  } catch (error) {
    console.warn("Backend product fetch unavailable, falling back to static catalog:", error);
    const { products: localCatalog } = await import("@/data/products");
    let filtered = [...localCatalog];

    if (params.featured) filtered = filtered.filter((p) => p.featured);
    if (params.bestseller) filtered = filtered.filter((p) => p.bestseller);
    if (params.newArrival) filtered = filtered.filter((p) => p.newDrop);
    if (params.category) filtered = filtered.filter((p) => p.category === params.category);
    if (params.collection) filtered = filtered.filter((p) => p.collection === params.collection);
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }

    return {
      data: filtered,
      total: filtered.length,
      page: params.page ?? 0,
      pageSize: params.pageSize ?? (filtered.length || 1),
      totalPages: 1,
    };
  }
}

/**
 * Fetch a single product by its slug from PostgreSQL database via Spring Boot.
 * GET /api/products/{slug}
 */
export async function getProductBySlug(slug: string): Promise<Product> {
  try {
    const backendProduct = await apiGet<BackendProductResponse>(`/api/products/${encodeURIComponent(slug)}`);
    return mapBackendProductToFrontend(backendProduct);
  } catch (error) {
    console.warn(`Backend fetch failed for slug '${slug}', falling back to local data:`, error);
    const { getProductBySlug: getLocalProduct } = await import("@/data/products");
    const localProduct = getLocalProduct(slug);
    if (localProduct) {
      return localProduct;
    }
    throw error;
  }
}

/** Fetch featured products from PostgreSQL database. */
export async function getFeaturedProducts(): Promise<PaginatedResponse<Product>> {
  return getProducts({ featured: true, sort: "featured", pageSize: 12 });
}

/** Fetch bestsellers from PostgreSQL database. */
export async function getBestSellers(): Promise<PaginatedResponse<Product>> {
  return getProducts({ bestseller: true, sort: "bestselling", pageSize: 12 });
}

/** Fetch new drops from PostgreSQL database. */
export async function getNewDrops(): Promise<PaginatedResponse<Product>> {
  return getProducts({ newArrival: true, sort: "newest", pageSize: 12 });
}

/** Fetch products by category slug from PostgreSQL database. */
export async function getProductsByCategory(
  categorySlug: ProductCategory | string,
  page = 0,
  pageSize = 20
): Promise<PaginatedResponse<Product>> {
  return getProducts({ category: categorySlug, page, pageSize });
}

/** Fetch products by collection slug from PostgreSQL database. */
export async function getProductsByCollection(
  collectionSlug: string,
  page = 0,
  pageSize = 20
): Promise<PaginatedResponse<Product>> {
  return getProducts({ collection: collectionSlug, page, pageSize });
}
