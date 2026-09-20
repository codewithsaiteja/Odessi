/**
 * ODESSI.TFI — Mock category data
 *
 * ⚠️  TEMPORARY: Replace with Spring Boot API calls when backend is ready.
 */

import type { Category } from "@/types";

export const categories: Category[] = [
  {
    id: "cat-001",
    name: "Tees",
    slug: "tees",
    description:
      "Premium heavyweight tees. Graphic, typographic and minimal — all built on quality cotton that holds its shape.",
    coverImage:
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=900&q=85",
    productCount: 12,
  },
  {
    id: "cat-002",
    name: "Hoodies",
    slug: "hoodies",
    description:
      "French Terry and fleece hoodies. Structured silhouettes, heavy weight, cinematic energy.",
    coverImage:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=900&q=85",
    productCount: 6,
  },
  {
    id: "cat-003",
    name: "New Drops",
    slug: "new-drops",
    description:
      "Latest releases. Limited quantities. Move fast.",
    coverImage:
      "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=900&q=85",
    productCount: 4,
  },
  {
    id: "cat-004",
    name: "Custom",
    slug: "custom",
    description:
      "Your hero. Your story. Fully personalized print on our premium base pieces.",
    coverImage:
      "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=900&q=85",
    productCount: 1,
  },
];

/* ── Helpers ── */

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
