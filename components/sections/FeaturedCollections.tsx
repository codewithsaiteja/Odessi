"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import GlareHover from "@/components/react-bits/cards/GlareHover";
import { getFeaturedCollections } from "@/lib/api/collections";
import { siteConfig } from "@/config/site";
import {
  getHomepageContent,
  HomepageSection,
  FeaturedCollectionCardItem,
  DEFAULT_FEATURED_COLLECTION_CARDS,
} from "@/lib/api/content";
import { getMediaUrl } from "@/lib/product-utils";

interface DisplayCard {
  id: string;
  name: string;
  tagline: string;
  url: string;
  coverImage: string;
  ctaLabel: string;
}

export default function FeaturedCollections() {
  const { featuredCollection: defaultFeatured } = siteConfig;
  const [sectionData, setSectionData] = useState<HomepageSection | null>(null);
  const [cards, setCards] = useState<DisplayCard[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    Promise.allSettled([getHomepageContent(), getFeaturedCollections()]).then(
      ([contentResult, collectionsResult]) => {
        let cmsSection: HomepageSection | null = null;
        if (contentResult.status === "fulfilled" && Array.isArray(contentResult.value)) {
          cmsSection = contentResult.value.find((s) => s.sectionKey === "FEATURED_COLLECTIONS") || null;
        }

        setSectionData(cmsSection);

        // Parse CMS cards if available
        let loadedCards: DisplayCard[] = [];
        if (cmsSection && cmsSection.customPayload) {
          try {
            const parsed = JSON.parse(cmsSection.customPayload);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const activeCards: FeaturedCollectionCardItem[] = parsed
                .filter((c: FeaturedCollectionCardItem) => c.active !== false)
                .sort((a: FeaturedCollectionCardItem, b: FeaturedCollectionCardItem) => (a.displayOrder || 0) - (b.displayOrder || 0));

              loadedCards = activeCards.map((c) => ({
                id: c.id,
                name: c.title,
                tagline: c.description,
                url: c.collectionUrl || `/collections/${c.id}`,
                coverImage: getMediaUrl(c.image),
                ctaLabel: c.ctaLabel || "EXPLORE",
              }));
            }
          } catch (e) {
            console.warn("[FeaturedCollections] Error parsing customPayload:", e);
          }
        }

        // Fallback to collections API if CMS cards are empty
        if (loadedCards.length === 0) {
          if (collectionsResult.status === "fulfilled" && collectionsResult.value.length > 0) {
            loadedCards = collectionsResult.value.map((c) => ({
              id: c.id,
              name: c.name,
              tagline: c.tagline,
              url: `/collections/${c.slug}`,
              coverImage: getMediaUrl(c.coverImage),
              ctaLabel: "EXPLORE",
            }));
          } else {
            // Fallback to defaults
            loadedCards = DEFAULT_FEATURED_COLLECTION_CARDS.map((c) => ({
              id: c.id,
              name: c.title,
              tagline: c.description,
              url: c.collectionUrl,
              coverImage: getMediaUrl(c.image),
              ctaLabel: c.ctaLabel || "EXPLORE",
            }));
          }
        }

        setCards(loadedCards);
        setIsLoaded(true);
      }
    );
  }, []);

  if (!isLoaded) return null;
  if (sectionData && !sectionData.active) return null;
  if (cards.length === 0) return null;

  const eyebrow = sectionData?.eyebrow || defaultFeatured.eyebrow;
  const headline = sectionData?.headline || sectionData?.title || defaultFeatured.headline;
  const subHeadline = sectionData?.subHeadline || sectionData?.body || defaultFeatured.subHeadline;
  const viewAllUrl = sectionData?.primaryCtaUrl || "/collections";
  const viewAllLabel = sectionData?.primaryCtaLabel || "VIEW ALL COLLECTIONS";

  return (
    <section
      id="featured-collection"
      aria-labelledby="featured-collections-heading"
      className="section-py bg-[var(--color-odessi-warmwhite)]"
    >
      <div className="container-odessi">
        <SectionHeading
          eyebrow={eyebrow}
          headline={headline}
          subHeadline={subHeadline}
          className="mb-14 lg:mb-18"
          id="featured-collections-heading"
        />

        {/* Asymmetric editorial grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-5">
          {/* Large feature — col 1-7 */}
          {cards[0] && (
            <CollectionCard
              card={cards[0]}
              className="lg:col-span-7 aspect-[4/5] lg:aspect-auto lg:min-h-[620px]"
              textSize="large"
            />
          )}

          {/* Right column — stacked */}
          <div className="lg:col-span-5 flex flex-col gap-4 lg:gap-5">
            {cards[1] && (
              <CollectionCard
                card={cards[1]}
                className="flex-1 aspect-[4/3] lg:aspect-auto"
                textSize="small"
              />
            )}
            {cards[2] && (
              <CollectionCard
                card={cards[2]}
                className="flex-1 aspect-[4/3] lg:aspect-auto"
                textSize="small"
              />
            )}
          </div>
        </div>

        {/* All collections link */}
        <div className="mt-10 flex justify-end">
          <Link
            href={viewAllUrl}
            className="btn-ghost text-[var(--color-odessi-black)] group flex items-center gap-2"
          >
            <span>{viewAllLabel}</span>
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
  card: DisplayCard;
  className?: string;
  textSize?: "large" | "small";
}

function CollectionCard({ card, className = "", textSize = "small" }: CollectionCardProps) {
  return (
    <GlareHover
      glareColor="#b89a5a"
      glareOpacity={0.16}
      glareSize={220}
      transitionDuration={750}
      className={`relative overflow-hidden group block bg-[var(--color-odessi-graphite)] ${className}`}
    >
      <Link
        href={card.url}
        className="block w-full h-full relative"
        aria-label={`Explore ${card.name} collection`}
      >
        {/* Image */}
        <Image
          src={card.coverImage}
          alt={card.name}
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
        <div className="absolute inset-x-0 bottom-0 p-6 lg:p-8 z-10">
          <h3
            className={`text-white font-[var(--font-display)] italic mb-2 ${
              textSize === "large"
                ? "text-3xl lg:text-4xl font-light"
                : "text-xl lg:text-2xl font-light"
            }`}
          >
            {card.name}
          </h3>
          <p className="type-body-sm text-[var(--color-odessi-mist)] mb-4 line-clamp-2">
            {card.tagline}
          </p>
          <span className="inline-flex items-center gap-2 type-caption text-white group-hover:gap-3 transition-all duration-300">
            {card.ctaLabel}
            <ArrowRight size={12} strokeWidth={2} />
          </span>
        </div>
      </Link>
    </GlareHover>
  );
}
