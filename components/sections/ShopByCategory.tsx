import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { categories } from "@/data/categories";
import { siteConfig } from "@/config/site";

export default function ShopByCategory() {
  const { shopByCategory } = siteConfig;

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
          {categories.map((cat, i) => {
            // First category gets a taller treatment
            const isFeatured = i === 0;
            return (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className={`
                  group relative overflow-hidden bg-[var(--color-odessi-graphite)]
                  ${isFeatured ? "col-span-2 lg:col-span-1 row-span-2" : ""}
                `}
                aria-label={`Shop ${cat.name}`}
                style={{
                  aspectRatio: isFeatured ? "3/4" : "3/4",
                }}
              >
                {/* Image */}
                <Image
                  src={cat.coverImage}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.05] select-none"
                />

                {/* Dark overlay */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-all duration-400"
                />

                {/* Content */}
                <div className="absolute inset-x-0 bottom-0 p-5 lg:p-6">
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
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
