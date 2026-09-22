"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import IconInstagram from "@/components/ui/IconInstagram";
import { getPublishedSocialPosts, SocialPost } from "@/lib/api/social";
import { formatPrice, getMediaUrl } from "@/lib/product-utils";
import { ArrowUpRight } from "lucide-react";
import { siteConfig } from "@/config/site";

export default function InstagramGrid() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { instagram } = siteConfig;

  useEffect(() => {
    let isMounted = true;
    async function loadSocialPosts() {
      try {
        const data = await getPublishedSocialPosts();
        if (isMounted && Array.isArray(data)) {
          setPosts(data.slice(0, 6)); // Display top 6 published posts
        }
      } catch (err) {
        console.error("Failed to load published social posts:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadSocialPosts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Gracefully omit section on storefront if no published posts exist
  if (!isLoading && posts.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="instagram-heading"
      className="py-20 lg:py-28 bg-[#F7F5F0] border-t border-[var(--color-odessi-smoke)] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Header */}
        <div className="flex flex-col items-center text-center mb-12 lg:mb-16">
          <p className="text-[11px] uppercase tracking-[0.25em] font-semibold text-[var(--color-odessi-stone)] mb-3">
            Editorial Lookbook & Community
          </p>
          <div className="w-8 h-px bg-[var(--color-odessi-black)] mb-6" aria-hidden="true" />
          <h2
            id="instagram-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[var(--color-odessi-black)] tracking-tight leading-none mb-4"
          >
            FOLLOW THE ODESSI WORLD
          </h2>
          <Link
            href={instagram.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-mono tracking-widest text-[var(--color-odessi-stone)] hover:text-[var(--color-odessi-black)] transition-colors uppercase"
          >
            <IconInstagram size={13} strokeWidth={1.5} />
            <span>{instagram.handle}</span>
          </Link>
        </div>

        {/* Editorial Image Grid */}
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3"
          role="list"
          aria-label="Curated Instagram Lookbook from @odessi.tfi"
        >
          {posts.map((post, i) => {
            const resolvedImg = getMediaUrl(post.mediaUrl);
            const hasProduct = Boolean(post.productSlug);

            return (
              <div
                key={post.id}
                role="listitem"
                className="group relative block aspect-[4/5] sm:aspect-square overflow-hidden bg-[#ECE8DF] rounded-xs"
              >
                <Image
                  src={resolvedImg}
                  alt={post.title || post.caption || `Odessi Lookbook Post ${i + 1}`}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 select-none"
                />

                {/* Subtle Luxury Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* Top Corner Instagram Badge */}
                {post.instagramUrl && (
                  <Link
                    href={post.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View on Instagram"
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/40 backdrop-blur-xs text-white/90 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                  >
                    <IconInstagram size={13} strokeWidth={1.5} />
                  </Link>
                )}

                {/* Bottom Interactive Product Tag (Requirement 3 & 13) */}
                {hasProduct ? (
                  <Link
                    href={`/product/${post.productSlug}`}
                    className="absolute inset-x-0 bottom-0 p-3 text-white z-10 flex flex-col justify-end translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300"
                  >
                    <div className="bg-black/60 backdrop-blur-md p-2.5 rounded-xs border border-white/10">
                      <p className="text-[11px] font-semibold text-stone-100 truncate tracking-wide">
                        {post.productName}
                      </p>
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/10">
                        <span className="text-[10px] font-mono text-amber-300 font-bold">
                          {post.productPrice ? formatPrice(post.productPrice) : ""}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold tracking-widest text-white/80 uppercase">
                          Discover <ArrowUpRight size={11} />
                        </span>
                      </div>
                    </div>
                  </Link>
                ) : post.caption ? (
                  <div className="absolute inset-x-0 bottom-0 p-3 text-white/90 text-[10px] line-clamp-2 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    {post.caption}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Follow CTA */}
        <div className="flex justify-center mt-12 sm:mt-16">
          <Link
            href={instagram.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-3.5 bg-[var(--color-odessi-black)] hover:bg-[var(--color-odessi-stone)] text-white text-[11px] font-semibold uppercase tracking-[0.2em] rounded-xs transition-all duration-300 shadow-xs"
          >
            <IconInstagram size={14} strokeWidth={2} />
            <span>FOLLOW {instagram.handle}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
