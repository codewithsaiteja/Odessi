/**
 * ODESSI.TFI — Mock product data
 *
 * ⚠️  TEMPORARY: Replace with Spring Boot API calls when backend is ready.
 * Images use Unsplash editorial fashion photography as placeholders.
 * Replace with actual product photography from your cloud storage.
 */

import type { Product } from "@/types";

export const products: Product[] = [
  // ── BEST SELLERS ──────────────────────────────────────────
  {
    id: "prod-001",
    name: "Shadow Striker Tee",
    slug: "shadow-striker-tee",
    tagline: "For those who move in silence.",
    description:
      "Heavyweight 240 GSM pure cotton tee. Oversized silhouette with a bold chest graphic inspired by the anti-hero archetype. Washed charcoal with off-white detail print.",
    shortDescription: "Heavyweight 240 GSM pure cotton tee with bold chest graphic.",
    price: 899,
    compareAtPrice: 1299,
    currency: "INR",
    images: [
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=85",
      "https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=800&q=85",
    ],
    thumbnail: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&q=85",
    category: "tees",
    collection: "dark-verse",
    sizes: [
      { label: "XS", available: true },
      { label: "S", available: true },
      { label: "M", available: true },
      { label: "L", available: true },
      { label: "XL", available: true },
      { label: "XXL", available: false },
    ],
    colors: [
      { name: "Washed Black", hex: "#1a1a1a" },
      { name: "Graphite", hex: "#3a3a3a" },
    ],
    material: "100% Premium Cotton",
    fit: "Oversized",
    careInstructions: ["Machine wash cold", "Tumble dry low", "Do not bleach"],
    tags: ["graphic", "oversized", "bestseller", "anti-hero"],
    featured: true,
    bestseller: true,
    available: true,
    stockStatus: "in_stock",
    model3D: {
      has3DModel: true,
      posterUrl: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=85",
      modelFormat: "procedural",
      autoRotate: true,
    },
    images360: {
      images: [
        "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=85",
        "https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=800&q=85",
        "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=85",
        "https://images.unsplash.com/photo-1564859228273-274232fdb516?w=800&q=85",
      ],
      totalFrames: 4,
    },
    createdAt: "2026-01-10T00:00:00Z",
  },
  {
    id: "prod-002",
    name: "The Mythic Hoodie",
    slug: "mythic-hoodie",
    tagline: "Legends don't ask for permission.",
    description:
      "450 GSM French Terry premium hoodie. Kangaroo pocket, ribbed cuffs and hem. Large back print — a cinematic landscape in monochrome.",
    shortDescription: "450 GSM French Terry premium hoodie with large back print.",
    price: 1799,
    compareAtPrice: 2499,
    currency: "INR",
    images: [
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=85",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=85",
    ],
    thumbnail: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&q=85",
    category: "hoodies",
    collection: "dark-verse",
    sizes: [
      { label: "S", available: true },
      { label: "M", available: true },
      { label: "L", available: true },
      { label: "XL", available: true },
      { label: "XXL", available: true },
    ],
    colors: [
      { name: "Onyx", hex: "#0d0d0d" },
      { name: "Charcoal", hex: "#2c2c2c" },
      { name: "Off-White", hex: "#f5f3f0" },
    ],
    material: "100% French Terry Cotton",
    fit: "Regular",
    careInstructions: ["Machine wash cold", "Tumble dry low", "Do not iron print"],
    tags: ["hoodie", "premium", "bestseller", "back-print"],
    featured: true,
    bestseller: true,
    available: true,
    stockStatus: "in_stock",
    model3D: {
      has3DModel: true,
      posterUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=85",
      modelFormat: "procedural",
      autoRotate: true,
    },
    images360: {
      images: [
        "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=85",
        "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=85",
        "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=800&q=85",
      ],
      totalFrames: 3,
    },
    createdAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "prod-003",
    name: "Cinematic Oversized Tee",
    slug: "cinematic-oversized-tee",
    tagline: "Every frame is a statement.",
    description:
      "Boxy-fit 220 GSM tee with minimal typographic print. The Odessi wordmark across the chest in weathered block lettering.",
    shortDescription: "Boxy-fit 220 GSM tee with minimal typographic print.",
    price: 799,
    currency: "INR",
    images: [
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=85",
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&q=85",
    ],
    thumbnail: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&q=85",
    category: "tees",
    collection: "monochrome-edit",
    sizes: [
      { label: "XS", available: false },
      { label: "S", available: true },
      { label: "M", available: true },
      { label: "L", available: true },
      { label: "XL", available: true },
      { label: "XXL", available: true },
    ],
    colors: [
      { name: "Chalk White", hex: "#f0ede8" },
      { name: "Vintage Black", hex: "#161616" },
    ],
    material: "100% Cotton",
    fit: "Boxy",
    careInstructions: ["Machine wash cold", "Tumble dry low", "Do not bleach"],
    tags: ["minimal", "typography", "bestseller"],
    bestseller: true,
    available: true,
    stockStatus: "in_stock",
    createdAt: "2026-02-01T00:00:00Z",
  },
  {
    id: "prod-004",
    name: "Rogue Arc Heavyweight Tee",
    slug: "rogue-arc-heavyweight-tee",
    tagline: "Carry the arc. Own the story.",
    description:
      "Premium 260 GSM drop-shoulder tee. Illustration-based front graphic referencing the hero's journey — rendered in a dark editorial palette.",
    shortDescription: "Premium 260 GSM drop-shoulder tee with illustration graphic.",
    price: 999,
    compareAtPrice: 1399,
    currency: "INR",
    images: [
      "https://images.unsplash.com/photo-1564859228273-274232fdb516?w=800&q=85",
      "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&q=85",
    ],
    thumbnail: "https://images.unsplash.com/photo-1564859228273-274232fdb516?w=400&q=85",
    category: "tees",
    collection: "dark-verse",
    sizes: [
      { label: "S", available: true },
      { label: "M", available: true },
      { label: "L", available: true },
      { label: "XL", available: false },
    ],
    colors: [
      { name: "Storm Grey", hex: "#4a4a4a" },
      { name: "Midnight", hex: "#0f0f0f" },
    ],
    material: "100% Premium Cotton",
    fit: "Drop-shoulder",
    careInstructions: ["Machine wash cold", "Tumble dry low", "Do not iron print"],
    tags: ["illustration", "drop-shoulder", "hero"],
    featured: false,
    bestseller: true,
    available: true,
    stockStatus: "low_stock",
    createdAt: "2026-02-14T00:00:00Z",
  },

  // ── NEW DROPS ─────────────────────────────────────────────
  {
    id: "prod-005",
    name: "The Dark Verse Hoodie",
    slug: "dark-verse-hoodie",
    tagline: "Written in the margins of mythology.",
    description:
      "The centrepiece of our Dark Verse drop. Double-layered hood, raglan sleeves, contrast stitch detail. Inspired by the anti-hero archetype across Indian cinema.",
    shortDescription: "Double-layered hood with raglan sleeves and contrast stitching.",
    price: 2099,
    currency: "INR",
    images: [
      "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=800&q=85",
      "https://images.unsplash.com/photo-1551698618-1256-5d97d256?w=800&q=85",
    ],
    thumbnail: "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=400&q=85",
    category: "hoodies",
    collection: "dark-verse",
    sizes: [
      { label: "S", available: true },
      { label: "M", available: true },
      { label: "L", available: true },
      { label: "XL", available: true },
      { label: "XXL", available: true },
    ],
    colors: [
      { name: "Eclipse Black", hex: "#080808" },
      { name: "Gunmetal", hex: "#2a2a2a" },
    ],
    material: "100% French Terry Cotton",
    fit: "Regular",
    careInstructions: ["Machine wash cold", "Tumble dry low", "Do not iron print"],
    tags: ["new-drop", "hoodie", "featured", "dark-verse"],
    featured: true,
    newDrop: true,
    available: true,
    stockStatus: "in_stock",
    createdAt: "2026-07-01T00:00:00Z",
  },
  {
    id: "prod-006",
    name: "Karma Tee Vol. II",
    slug: "karma-tee-vol-2",
    tagline: "What you put out, comes back amplified.",
    description:
      "Second edition of our bestselling Karma Tee. Updated artwork, same heavyweight 240 GSM build. Front and back print.",
    shortDescription: "Second edition with updated artwork, front and back print.",
    price: 949,
    compareAtPrice: 1199,
    currency: "INR",
    images: [
      "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=800&q=85",
      "https://images.unsplash.com/photo-1574180566232-aaad1b5b8450?w=800&q=85",
    ],
    thumbnail: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=400&q=85",
    category: "tees",
    collection: "monochrome-edit",
    sizes: [
      { label: "XS", available: true },
      { label: "S", available: true },
      { label: "M", available: true },
      { label: "L", available: true },
      { label: "XL", available: true },
    ],
    colors: [
      { name: "Washed Ecru", hex: "#e8e0d5" },
      { name: "Charcoal Black", hex: "#1c1c1c" },
    ],
    material: "100% Premium Cotton",
    fit: "Regular",
    careInstructions: ["Machine wash cold", "Tumble dry low", "Do not bleach"],
    tags: ["new-drop", "front-back-print", "karma"],
    newDrop: true,
    available: true,
    stockStatus: "in_stock",
    createdAt: "2026-08-15T00:00:00Z",
  },

  // ── CUSTOM ────────────────────────────────────────────────
  {
    id: "prod-007",
    name: "Custom Hero Tee",
    slug: "custom-hero-tee",
    tagline: "Your hero. Your story. Your piece.",
    description:
      "Design your own Odessi piece. Choose your hero, pick your palette, select your fit. Each custom tee is printed on demand on our premium 240 GSM base.",
    shortDescription: "Design your own Odessi piece with custom print.",
    price: 1299,
    currency: "INR",
    images: [
      "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=85",
    ],
    thumbnail: "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&q=85",
    category: "custom",
    sizes: [
      { label: "XS", available: true },
      { label: "S", available: true },
      { label: "M", available: true },
      { label: "L", available: true },
      { label: "XL", available: true },
      { label: "XXL", available: true },
    ],
    colors: [
      { name: "Any — You Choose", hex: "#ffffff" },
    ],
    material: "100% Premium Cotton",
    fit: "Regular",
    careInstructions: ["Machine wash cold", "Tumble dry low", "Do not bleach"],
    tags: ["custom", "personalized", "print-on-demand"],
    customizable: true,
    available: true,
    stockStatus: "in_stock",
    createdAt: "2026-01-01T00:00:00Z",
  },
];

/* ── Helpers ── */

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(
  category: Product["category"]
): Product[] {
  return products.filter((p) => p.category === category);
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

export function formatPrice(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}