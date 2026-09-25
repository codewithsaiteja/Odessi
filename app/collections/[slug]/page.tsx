"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductGrid from "@/components/product/ProductGrid";
import Sort from "@/components/shop/Sort";
import { getCollectionBySlug } from "@/lib/api/collections";
import { getProductsByCollection } from "@/lib/api/products";
import type { Collection, Product, ProductSort } from "@/types";
import BackButton from "@/components/navigation/BackButton";

function CollectionContent() {
  const params = useParams();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistedProducts, setWishlistedProducts] = useState<string[]>([]);

  useEffect(() => {
    if (params.slug) {
      const slugStr = params.slug as string;
      
      setLoading(true);
      
      // Load collection metadata and products in parallel
      Promise.all([
        getCollectionBySlug(slugStr),
        getProductsByCollection(slugStr),
      ])
        .then(([foundCollection, productsRes]) => {
          setCollection(foundCollection);
          setProducts(productsRes.data || []);
        })
        .catch((err) => console.error("Failed to load collection", err))
        .finally(() => setLoading(false));
    }
  }, [params.slug]);

  if (!collection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="type-h2 text-[var(--color-odessi-black)] mb-2">Collection not found</h1>
          <Link href="/collections" className="text-[var(--color-odessi-stone)] hover:text-[var(--color-odessi-black)] underline">
            View all collections
          </Link>
        </div>
      </div>
    );
  }

  const handleWishlistToggle = (productId: string) => {
    setWishlistedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleQuickAdd = (_product: any) => {
    // Quick-add handled on product detail page
  };

  return (
    <>
      {/* ── Fixed top bar ── */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <AnnouncementBar />
      </div>

      {/* ── Navbar ── */}
      <Navbar />

      {/* ── Main Content ── */}
      <main className="pt-[calc(var(--announcement-height)+var(--navbar-height))]">
        {/* Collection Hero */}
        <div className="relative h-[60vh] min-h-[400px] bg-[var(--color-odessi-smoke)]">
          <Image
            src={collection.coverImage}
            alt={collection.name}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/70" />

          {/* Content */}
          <div className="absolute inset-0 flex items-end">
            <div className="container-odessi pb-12">
              <div className="max-w-2xl text-white">
                {collection.featured && (
                  <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wide bg-white text-[var(--color-odessi-black)] rounded-full mb-4">
                    FEATURED COLLECTION
                  </span>
                )}

                <h1 className="type-display text-5xl md:text-6xl mb-4">
                  {collection.name}
                </h1>

                {collection.tagline && (
                  <p className="type-h3 italic mb-4 opacity-90">
                    {collection.tagline}
                  </p>
                )}

                {collection.season && (
                  <p className="type-body opacity-75">
                    {collection.season}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Collection Description & Products */}
        <div className="container-odessi py-12">
          <BackButton fallback="/collections" label="Back to Collections" className="mb-4" />
          {/* Breadcrumb */}
          <nav className="mb-8 text-sm" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-[var(--color-odessi-stone)]">
              <li>
                <Link href="/" className="hover:text-[var(--color-odessi-black)] transition-colors">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/collections" className="hover:text-[var(--color-odessi-black)] transition-colors">
                  Collections
                </Link>
              </li>
              <li>/</li>
              <li className="text-[var(--color-odessi-black)]">{collection.name}</li>
            </ol>
          </nav>

          {/* Description */}
          {collection.description && (
            <div className="max-w-3xl mb-12 pb-8 border-b border-[var(--color-odessi-smoke)]">
              <p className="type-body text-[var(--color-odessi-stone)] leading-relaxed">
                {collection.description}
              </p>
            </div>
          )}

          {/* Controls Bar */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--color-odessi-smoke)]">
            <div className="text-sm text-[var(--color-odessi-stone)]">
              {products.length} {products.length === 1 ? "product" : "products"}
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="py-16 text-center text-sm font-mono text-[var(--color-odessi-stone)]">
              Loading collection products from database...
            </div>
          ) : products.length > 0 ? (
            <ProductGrid
              products={products}
              onWishlistToggle={handleWishlistToggle}
              onQuickAdd={handleQuickAdd}
              wishlistedProducts={wishlistedProducts}
              emptyStateMessage="No products in this collection yet."
            />
          ) : (
            <div className="text-center py-16">
              <p className="type-body text-[var(--color-odessi-stone)] mb-4">
                No products in this collection yet.
              </p>
              <Link
                href="/shop"
                className="inline-block px-8 py-3 bg-[var(--color-odessi-black)] text-white type-nav font-semibold rounded-sm hover:bg-[var(--color-odessi-stone)] transition-colors"
              >
                EXPLORE ALL PRODUCTS
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <Footer />
    </>
  );
}

export default function CollectionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-odessi-black)] mx-auto mb-4"></div>
          <p className="text-[var(--color-odessi-stone)]">Loading collection...</p>
        </div>
      </div>
    }>
      <CollectionContent />
    </Suspense>
  );
}