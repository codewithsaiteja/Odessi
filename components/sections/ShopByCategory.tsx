import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import SpotlightCard from "@/components/react-bits/cards/SpotlightCard";
import { categories as defaultCategories } from "@/data/categories";
import { siteConfig } from "@/config/site";
import { getCategories } from "@/lib/api/categories";
import { getMediaUrl } from "@/lib/product-utils";
import type { Category } from "@/types";

/**
 * Resolve the display image for a category card.
 *
 * Priority:
 *  1. Backend `image` or `imageUrl` field (canonical /api/media/categories/... path)
 *  2. Static fallback `coverImage` from local data (Unsplash / seeded)
 *  3. Neutral placeholder SVG
 */
function resolveCoverImage(cat: Category): string {
  const mediaRef = cat.image || cat.imageUrl || cat.coverImage;
  if (mediaRef) {
    return getMediaUrl(mediaRef);
  }
  return "/placeholder-product.svg";
}

export default async function ShopByCategory() {
  const { shopByCategory } = siteConfig;

  let displayCategories: Category[] = defaultCategories;

  try {
    const res = await getCategories();
    // Normalize response: res may be unwrapped directly by client.ts handleResponse (Array)
    // or wrapped in an ApiResponse object ({ success: true, data: [...] })
    const backendCategories: any[] = Array.isArray(res)
      ? res
      : Array.isArray((res as any)?.data)
      ? (res as any).data
      : [];

    if (backendCategories.length > 0) {
      // Map by slug — always preserve canonical category order (tees, hoodies, new-drops, custom)
      displayCategories = defaultCategories.map((defaultCat) => {
        const backendCat = backendCategories.find(
          (b) => b.slug && b.slug.toLowerCase() === defaultCat.slug.toLowerCase()
        );

        if (!backendCat) {
          return defaultCat;
        }

        const backendImage = backendCat.image || backendCat.imageUrl;

        return {
          ...defaultCat,
          ...backendCat,
          id: String(backendCat.id || defaultCat.id),
          name: backendCat.name || defaultCat.name,
          slug: defaultCat.slug,
          description: backendCat.description || defaultCat.description,
          // CRITICAL: Backend image has highest priority over static Unsplash fallback
          image: backendImage || defaultCat.image || null,
          imageUrl: backendImage || defaultCat.imageUrl || null,
          coverImage: backendImage || defaultCat.coverImage || "/placeholder-product.svg",
          productCount: backendCat.productCount ?? defaultCat.productCount,
        } as Category;
      });
    }
  } catch (err) {
    console.error("[ShopByCategory] Failed to fetch backend categories, using defaults:", err);
    displayCategories = defaultCategories;
  }

  return (
    <section
      aria-labelledby="shop-category-heading"
      className="section-py bg-[var(--color-odessi-warmwhite)]"
    >
      <div className="container-odessi">
        <SectionHeading
          eyebrow={shopByCategory.eyebrow}
          headline={shopByCategory.headline}
          className="mb-12 lg:mb-16"
          id="shop-category-heading"
        />

        {/* Masonry-inspired category grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {displayCategories.map((cat, i) => {
            // First category gets a taller treatment
            const isFeatured = i === 0;
            const src = resolveCoverImage(cat);

            return (
              <Link
                key={cat.id || cat.slug}
                href={`/shop?category=${cat.slug}`}
                className={`
                  group relative overflow-hidden bg-[var(--color-odessi-graphite)]
                  ${isFeatured ? "col-span-2 lg:col-span-1 row-span-2" : ""}
                `}
                aria-label={`Shop ${cat.name}`}
                style={{
                  aspectRatio: "3/4",
                }}
              >
                <SpotlightCard
                  spotlightColor="rgba(255, 255, 255, 0.15)"
                  className="w-full h-full relative"
                >
                  {/* Category image */}
                  <Image
                    src={src}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.05] select-none"
                    unoptimized={src.includes("/api/media/")}
                  />

                  {/* Dark overlay */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-all duration-400"
                  />

                  {/* Content */}
                  <div className="absolute inset-x-0 bottom-0 p-5 lg:p-6 z-10">
                    {cat.productCount && (
                      <p className="type-caption text-[var(--color-odessi-silver)] mb-1">
                        {cat.productCount} pieces
                      </p>
                    )}
                    <h3 className="type-h3 text-white mb-3">
                      {cat.name.toUpperCase()}
                    </h3>
                    <span
                      className="inline-flex items-center gap-2 type-caption text-[var(--color-odessi-mist)]
                      group-hover:text-white group-hover:gap-3 transition-all duration-300"
                    >
                      SHOP
                      <ArrowRight size={11} strokeWidth={2} />
                    </span>
                  </div>
                </SpotlightCard>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
