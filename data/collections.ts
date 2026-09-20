/**
 * ODESSI.TFI — Mock collection data
 *
 * ⚠️  TEMPORARY: Replace with Spring Boot API calls when backend is ready.
 */

import type { Collection } from "@/types";

export const collections: Collection[] = [
  {
    id: "col-001",
    name: "Dark Verse",
    slug: "dark-verse",
    tagline: "Written in shadows. Worn in light.",
    description:
      "Our defining collection. Dark Verse draws from the mythology of anti-heroes — characters who carry the weight of consequence. Heavyweight pieces in deep monochromes.",
    coverImage:
      "https://images.unsplash.com/photo-1536922246289-88c42f957773?w=1200&q=85",
    featured: true,
    season: "SS 2026",
    releaseDate: "2026-07-01T00:00:00Z",
  },
  {
    id: "col-002",
    name: "Monochrome Edit",
    slug: "monochrome-edit",
    tagline: "The absence of colour is never the absence of statement.",
    description:
      "Clean. Restrained. Precise. The Monochrome Edit strips everything back to form and print. Pure cotton canvases for bold typographic and graphic work.",
    coverImage:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=85",
    featured: true,
    season: "AW 2026",
    releaseDate: "2026-09-01T00:00:00Z",
  },
  {
    id: "col-003",
    name: "Rogue Arc",
    slug: "rogue-arc",
    tagline: "The arc bends. The hero breaks. The story remains.",
    description:
      "Illustration-led pieces tracing the hero's journey through Indian cinema and mythology. Each piece tells a chapter.",
    coverImage:
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=85",
    featured: true,
    season: "Resort 2026",
    releaseDate: "2026-05-15T00:00:00Z",
  },
  {
    id: "col-004",
    name: "Custom Studio",
    slug: "custom-studio",
    tagline: "Your narrative. Our craft.",
    description:
      "Fully personalized pieces. Bring your hero, your story, your vision. We bring the premium build and print quality.",
    coverImage:
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1200&q=85",
    featured: false,
    releaseDate: "2026-01-01T00:00:00Z",
  },
];

/* ── Helpers ── */

export function getCollectionBySlug(slug: string): Collection | undefined {
  return collections.find((c) => c.slug === slug);
}

export function getFeaturedCollections(): Collection[] {
  return collections.filter((c) => c.featured);
}
