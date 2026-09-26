"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getCollections } from "@/lib/api/collections";
import type { Collection } from "@/types";
import { ChevronRight } from "lucide-react";

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCollections()
      .then((data) => {
        setCollections(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load collections:", err);
        setLoading(false);
      });
  }, []);

  return (
    <>
      {/* ── Fixed top bar ── */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <AnnouncementBar />
      </div>

      {/* ── Navbar ── */}
      <Navbar />

      {/* ── Main Content ── */}
      <main className="pt-[calc(var(--announcement-height)+var(--navbar-height))] bg-[#FAF9F6] min-h-screen">
        <div className="container-odessi">
          {/* Breadcrumb */}
          <nav className="py-4 text-sm" aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 sm:gap-2 text-[var(--color-odessi-stone)]">
              <li className="flex items-center">
                <Link href="/" className="hover:text-[var(--color-odessi-black)] transition-colors whitespace-nowrap">
                  Home
                </Link>
              </li>
              <li aria-hidden="true" className="flex items-center select-none text-[var(--color-odessi-stone)]/50">
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              </li>
              <li aria-current="page" className="text-[var(--color-odessi-black)] font-medium">Collections</li>
            </ol>
          </nav>

          {/* Page Header */}
          <div className="py-12 max-w-3xl">
            <h1 className="type-h1 text-[var(--color-odessi-black)] mb-4">
              COLLECTIONS
            </h1>
            <p className="type-body text-[var(--color-odessi-stone)]">
              Each collection tells a story. From anti-hero narratives to cinematic minimalism,
              explore the worlds we've built through premium clothing.
            </p>
          </div>

          {/* Collections Grid */}
          <div className="pb-16">
            {loading ? (
              <div className="grid md:grid-cols-2 gap-8">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse aspect-[4/5] rounded-sm bg-[#EAE7DF]" />
                ))}
              </div>
            ) : collections.length === 0 ? (
              <div className="py-20 text-center">
                <p className="type-body text-[var(--color-odessi-stone)] mb-6">
                  No collections available right now.
                </p>
                <Link
                  href="/shop"
                  className="inline-block px-8 py-3 bg-[var(--color-odessi-black)] text-white text-xs font-semibold uppercase tracking-wider rounded-sm hover:bg-[var(--color-odessi-stone)] transition-colors"
                >
                  EXPLORE ALL PRODUCTS
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8">
                {collections.map((collection, index) => (
                  <Link
                    key={collection.id}
                    href={`/collections/${collection.slug}`}
                    className="group block relative aspect-[4/5] overflow-hidden rounded-sm bg-[var(--color-odessi-smoke)]"
                  >
                    {/* Collection Image */}
                    <Image
                      src={collection.coverImage}
                      alt={collection.name}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority={index < 2}
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
                      {collection.featured && (
                        <span className="inline-block w-fit px-2 py-1 text-xs font-semibold tracking-wide bg-white text-[var(--color-odessi-black)] rounded-full mb-3">
                          FEATURED
                        </span>
                      )}

                      <h2 className="type-h2 mb-2 transform transition-transform duration-300 group-hover:translate-y-[-4px]">
                        {collection.name}
                      </h2>

                      {collection.tagline && (
                        <p className="type-body italic mb-3 opacity-90">
                          {collection.tagline}
                        </p>
                      )}

                      {collection.season && (
                        <p className="text-sm opacity-75">
                          {collection.season}
                        </p>
                      )}

                      <div className="mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="type-caption font-semibold">EXPLORE COLLECTION</span>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          className="transform transition-transform group-hover:translate-x-1"
                        >
                          <path
                            d="M4 10H16M16 10L11 5M16 10L11 15"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <Footer />
    </>
  );
}