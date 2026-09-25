"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getNewDrops } from "@/lib/api/products";
import { formatPrice, getMediaUrl } from "@/lib/product-utils";
import { siteConfig } from "@/config/site";
import type { Product } from "@/types";
import ShinyText from "@/components/react-bits/text/ShinyText";
import SplitText from "@/components/react-bits/text/SplitText";
import SpotlightCard from "@/components/react-bits/cards/SpotlightCard";
import { ImageTrail } from "@/components/editorial/ImageTrail";

export default function NewDrop() {
  const { newDrop } = siteConfig;
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    getNewDrops()
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setProduct(res.data[0]);
        }
      })
      .catch((err) => console.error("Failed to fetch new drops from backend", err));
  }, []);

  if (!product) return null;

  const availableSizes = product.sizes.filter((s) => s.available);
  const primaryImage = getMediaUrl(product.images?.[0] || product.thumbnail);
  const trailImages = (product.images || [primaryImage]).map(getMediaUrl);

  return (
    <section
      aria-labelledby="new-drop-heading"
      className="bg-[var(--color-odessi-charcoal)] overflow-hidden"
    >
      <ImageTrail images={trailImages} maxTrailItems={4} distanceThreshold={70}>
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px] lg:min-h-[680px]">

        {/* ── Left: Image with Spotlight ── */}
        <div className="relative aspect-[4/5] lg:aspect-auto overflow-hidden order-1 lg:order-1">
          <SpotlightCard
            spotlightColor="rgba(184, 154, 90, 0.16)"
            className="w-full h-full"
          >
            <Image
              src={primaryImage}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-top transition-transform duration-700 ease-out hover:scale-[1.03] select-none"
            />
            <div
              aria-hidden="true"
              className="absolute inset-y-0 right-0 w-24 hidden lg:block z-10"
              style={{
                background: "linear-gradient(to right, transparent, var(--color-odessi-charcoal))",
              }}
            />
          </SpotlightCard>
        </div>

        {/* ── Right: Product info ── */}
        <div className="order-2 lg:order-2 flex items-center">
          <div className="w-full px-8 py-12 lg:px-14 lg:py-0 max-w-lg lg:max-w-none">

            {/* Eyebrow + collection */}
            <div className="mb-2">
              <ShinyText
                text={newDrop.eyebrow}
                color="#8F8A80"
                shineColor="#FAF9F6"
                speed={3}
                className="type-caption text-[var(--color-odessi-stone)]"
              />
            </div>
            <p className="type-caption text-[var(--color-odessi-silver)] mb-6">
              {newDrop.collectionName}
            </p>

            {/* Rule */}
            <span className="divider bg-[var(--color-odessi-graphite)] block mb-6" aria-hidden="true" />

            {/* Product name */}
            <SplitText
              text={product.name}
              tag="h2"
              id="new-drop-heading"
              splitType="words"
              className="font-[var(--font-display)] italic text-white mb-4 text-3xl lg:text-5xl font-light"
            />

            {/* Description */}
            <p className="type-body text-[var(--color-odessi-silver)] mb-8 max-w-sm">
              {product.description}
            </p>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-8">
              <span className="type-price text-white text-lg">
                {formatPrice(product.price)}
              </span>
              {product.compareAtPrice && (
                <span className="type-body-sm text-[var(--color-odessi-stone)] line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </div>

            {/* Sizes */}
            {availableSizes.length > 0 && (
              <div className="mb-10">
                <p className="type-caption text-[var(--color-odessi-stone)] mb-3">Select Size</p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Available sizes">
                  {availableSizes.map((size) => (
                    <button
                      key={size.label}
                      aria-label={`Size ${size.label}`}
                      className="
                        w-10 h-10 type-caption text-[var(--color-odessi-silver)] border border-[var(--color-odessi-graphite)]
                        hover:border-white hover:text-white transition-colors duration-200
                        focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2
                      "
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href={newDrop.cta.href}
                className="btn-primary"
              >
                {newDrop.cta.label}
              </Link>
              <Link
                href={`/product/${product.slug}`}
                className="btn-ghost text-[var(--color-odessi-silver)] hover:text-white border border-[var(--color-odessi-graphite)] px-6 py-3 transition-colors"
              >
                VIEW DETAILS
              </Link>
            </div>
          </div>
        </div>
      </div>
      </ImageTrail>
    </section>
  );
}
