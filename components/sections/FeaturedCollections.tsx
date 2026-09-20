"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { getFeaturedCollections } from "@/lib/api/collections";
import { siteConfig } from "@/config/site";
import type { Collection } from "@/types";

export default function FeaturedCollections() {
  const { featuredCollection } = siteConfig;
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    getFeaturedCollections()
      .then(setCollections)
      .catch((err) => console.error("[FeaturedCollections] Failed to load collections:", err));
  }, []);

  if (collections.length === 0) return null;

  return (
    <section
      id="featured-collection"
      aria-labelledby="featured-collections-heading"
      className="section-py bg-[var(--color-odessi-warmwhite)]"
    >
      <div className="container-odessi">
        <SectionHeading
          eyebrow={featuredCollection.eyebrow}
          headline={featuredCollection.headline}
          subHeadline={featuredCollection.subHeadline}
          className="mb-14 lg:mb-18"
          id="featured-collections-heading"
        />

        {/* Asymmetric editorial grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-5">

          {/* Large feature — col 1-7 */}
          {collections[0] && (
            <CollectionCard
              collection={collections[0]}
              className="lg:col-span-7 aspect-[4/5] lg:aspect-auto lg:min-h-[620px]"
              textSize="large"
            />
          )}

          {/* Right column — stacked */}
          <div className="lg:col-span-5 flex flex-col gap-4 lg:gap-5">
            {collections[1] && (
              <CollectionCard
                collection={collections[1]}
                className="flex-1 aspect-[4/3] lg:aspect-auto"
                textSize="small"
              />
            )}
            {collections[2] && (
              <CollectionCard
                collection={collections[2]}
                className="flex-1 aspect-[4/3] lg:aspect-auto"
                textSize="small"
              />
            )}
          </div>
        </div>

        {/* All collections link */}
        <div className="mt-10 flex justify-end">
          <Link
            href="/collections"
            className="btn-ghost text-[var(--color-odessi-black)] group flex items-center gap-2"
          >
            <span>VIEW ALL COLLECTIONS</span>
            <ArrowRight
              size={14}
              strokeWidth={2}
              className="group-hover:translate-x-1 transition-transform duration-200"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── CollectionCard sub-component ── */

interface CollectionCardProps {
  collection: Collection;
  className?: string;
  textSize?: "large" | "small";
}

function CollectionCard({ collection, className = "", textSize = "small" }: CollectionCardProps) {
  return (
    <Link
      href={`/collections/${collection.slug}`}
      className={`relative overflow-hidden group block bg-[var(--color-odessi-graphite)] ${className}`}
      aria-label={`Explore ${collection.name} collection`}
    >
      {/* Image */}
      <Image
        src={collection.coverImage}
        alt={collection.name}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 60vw"
        className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04] select-none"
      />

      {/* Overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"
      />

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 p-6 lg:p-8">
        <h3
          className={`text-white font-[var(--font-display)] italic mb-2 ${
            textSize === "large"
              ? "text-3xl lg:text-4xl font-light"
              : "text-xl lg:text-2xl font-light"
          }`}
        >
          {collection.name}
        </h3>
        <p className="type-body-sm text-[var(--color-odessi-mist)] mb-4 line-clamp-2">
          {collection.tagline}
        </p>
        <span className="inline-flex items-center gap-2 type-caption text-white group-hover:gap-3 transition-all duration-300">
          EXPLORE
          <ArrowRight size={12} strokeWidth={2} />
        </span>
      </div>
    </Link>
  );
}
