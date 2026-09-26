/* ============================================================
   ODESSI.TFI — Core TypeScript types
   These will map 1:1 to the Spring Boot API response shapes.
   ============================================================ */

/* ── Product ── */

export interface ProductColor {
  name: string;
  hex: string;
  images?: string[]; // variant-specific images
}

export interface ProductSize {
  label: string; // "XS" | "S" | "M" | "L" | "XL" | "XXL"
  available: boolean;
}

export interface ProductVariant {
  id: string; // converted from backend Long to string
  size: string;
  color: ProductColor;
  sku: string;
  price: number;
  stockQuantity: number;
  available: boolean;
  image?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number; // original price before discount
  currency: string;
  images: string[];
  thumbnail: string;
  category: ProductCategory;
  categoryName?: string;
  collection?: string; // collection slug
  collectionName?: string;
  sizes: ProductSize[];
  colors: ProductColor[];
  variants?: ProductVariant[];
  material?: string;
  fit?: string;
  careInstructions?: string[];
  tags?: string[];
  featured?: boolean;
  bestseller?: boolean;
  newDrop?: boolean;
  isDrop?: boolean;
  dropTitle?: string;
  dropDescription?: string;
  launchAt?: string;
  customizable?: boolean;
  available: boolean;
  stockStatus?: "in_stock" | "low_stock" | "out_of_stock" | "coming_soon";
  rating?: number;
  reviewCount?: number;
  model3D?: Product3DAsset;
  images360?: Product360Sequence;
  createdAt: string; // ISO date string
}


/* ── 3D & 360 Media Types ── */

export interface Product3DAsset {
  modelUrl?: string; // URL/path to GLB/GLTF file
  posterUrl?: string; // Static poster fallback URL
  has3DModel: boolean;
  modelFormat?: "glb" | "gltf" | "procedural";
  autoRotate?: boolean;
  scale?: number;
  active?: boolean;
}

export interface Product360Sequence {
  images: string[]; // List of real product photo angles
  totalFrames: number;
}

/* ── Collection ── */

export interface Collection {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  coverImage: string;
  products?: string[]; // product ids
  featured?: boolean;
  season?: string; // e.g. "Summer 2026"
  releaseDate?: string;
}

/* ── Category ── */

export type ProductCategory =
  | "tees"
  | "hoodies"
  | "new-drops"
  | "custom"
  | "accessories";

export interface Category {
  id: string;
  name: string;
  slug: ProductCategory;
  description: string;
  coverImage: string;
  /** Canonical API media path returned by the backend, e.g. /api/media/categories/cat-123.jpg */
  image?: string | null;
  /** Alias for canonical API media reference */
  imageUrl?: string | null;
  productCount?: number;
}

/* ── Filtering and Search ── */

export interface ProductFilters {
  category?: ProductCategory;
  collection?: string;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  available?: boolean;
  tags?: string[];
}

export interface ProductSort {
  field: "featured" | "newest" | "price_low" | "price_high" | "bestselling";
  direction?: "asc" | "desc";
}

export interface SearchQuery {
  q: string;
  filters?: ProductFilters;
  sort?: ProductSort;
  page?: number;
  limit?: number;
}

/* ── Cart ── */

export interface CartItem {
  product: Product;
  selectedSize: string;
  selectedColor: ProductColor;
  quantity: number;
  cartItemId?: number;
  imageUrl?: string;
  primaryImageUrl?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
}

/* ── Wishlist ── */

export interface WishlistItem {
  product: Product;
  addedAt: string;
}

/* ── User ── */

export interface Address {
  id: string;
  label: string; // "Home" | "Work" | etc.
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  addresses: Address[];
  createdAt: string;
}

/* ── Order ── */

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "PENDING"
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "PAYMENT_FAILED";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface OrderItem {
  product: Product;
  size: string;
  color: ProductColor;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  shippingAddress: Address;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  shippingCost: number;
  discount?: number;
  total: number;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

/* ── Review ── */

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  avatar?: string;
  rating: number; // 1–5
  title?: string;
  body: string;
  verified: boolean;
  createdAt: string;
}

/* ── Navigation ── */

export interface NavLink {
  label: string;
  href: string;
  children?: NavLink[];
}

/* ── API responses (will map to Spring Boot) ── */

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
