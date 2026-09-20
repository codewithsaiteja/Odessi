"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import ProductCard from "@/components/product/ProductCard";
import { getBestSellers } from "@/lib/api/products";
import { siteConfig } from "@/config/site";
import type { Product } from "@/types";

export default function BestSellers() {
  const [products, setProducts] = useState<Product[]>([]);
  const { bestSellers } = siteConfig;

  useEffect(() => {
    getBestSellers()
      .then((res) => setProducts(res.data || []))
      .catch((err) => console.error("Failed to fetch best sellers from backend", err));
  }, []);

  if (products.length === 0) return null;

  return (
    <section
      aria-labelledby="best-sellers-heading"
      className="section-py bg-[var(--color-odessi-offwhite)]"
    >
      <div className="container-odessi">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 lg:mb-16">
          <SectionHeading
            eyebrow={bestSellers.eyebrow}
            headline={bestSellers.headline}
            id="best-sellers-heading"
          />
          <Link
            href="/shop"
            className="btn-ghost text-[var(--color-odessi-black)] group flex items-center gap-2 self-start md:self-auto shrink-0"
          >
            <span>VIEW ALL</span>
            <ArrowRight
              size={14}
              strokeWidth={2}
              className="group-hover:translate-x-1 transition-transform duration-200"
            />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6 lg:gap-x-8">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
