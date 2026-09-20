"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { categories as staticCategories } from "@/data/categories";
import { getCategories } from "@/lib/api/categories";

interface CategoryNavProps {
  className?: string;
}

export default function CategoryNav({ className = "" }: CategoryNavProps) {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");
  const [navCategories, setNavCategories] = useState<Array<{ id: string; name: string; slug: string | null; href: string }>>([
    { id: "all", name: "All", slug: null, href: "/shop" },
    ...staticCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      href: `/shop?category=${cat.slug}`
    }))
  ]);

  useEffect(() => {
    async function loadPublicCategories() {
      try {
        const res = await getCategories();
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          const apiCats = res.data.map(cat => ({
            id: String(cat.id),
            name: cat.name,
            slug: cat.slug,
            href: `/shop?category=${cat.slug}`
          }));
          setNavCategories([
            { id: "all", name: "All", slug: null, href: "/shop" },
            ...apiCats
          ]);
        }
      } catch {
        // Fall back to static categories gracefully
      }
    }
    loadPublicCategories();
  }, []);

  const allCategories = navCategories;

  return (
    <nav className={`${className}`} aria-label="Product categories">
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-8">
        {allCategories.map((category) => {
          const isActive = currentCategory === category.slug || (!currentCategory && category.slug === null);
          
          return (
            <Link
              key={category.id}
              href={category.href}
              className={`
                type-nav transition-colors duration-200 relative
                ${isActive 
                  ? 'text-[var(--color-odessi-black)] font-semibold' 
                  : 'text-[var(--color-odessi-stone)] hover:text-[var(--color-odessi-black)]'
                }
              `}
            >
              {category.name}
              {isActive && (
                <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-[var(--color-odessi-black)]" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Mobile Navigation - Horizontal Scroll */}
      <div className="md:hidden overflow-x-auto">
        <div className="flex items-center gap-6 pb-2 min-w-max px-1">
          {allCategories.map((category) => {
            const isActive = currentCategory === category.slug || (!currentCategory && category.slug === null);
            
            return (
              <Link
                key={category.id}
                href={category.href}
                className={`
                  whitespace-nowrap type-caption transition-colors duration-200 relative py-2
                  ${isActive 
                    ? 'text-[var(--color-odessi-black)] font-semibold' 
                    : 'text-[var(--color-odessi-stone)]'
                  }
                `}
              >
                {category.name}
                {isActive && (
                  <div className="absolute -bottom-0 left-0 right-0 h-0.5 bg-[var(--color-odessi-black)]" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}