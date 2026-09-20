"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import type { ProductSort } from "@/types";

const sortOptions: { label: string; value: ProductSort["field"] }[] = [
  { label: "Featured", value: "featured" },
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price_low" },
  { label: "Price: High to Low", value: "price_high" },
  { label: "Best Selling", value: "bestselling" },
];

interface SortProps {
  onSortChange?: (sort: ProductSort) => void;
  className?: string;
}

export default function Sort({ onSortChange, className = "" }: SortProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentSort, setCurrentSort] = useState<ProductSort>({ field: "featured" });
  const [isOpen, setIsOpen] = useState(false);

  // Initialize sort from URL
  useEffect(() => {
    const sortParam = searchParams.get("sort");
    if (sortParam && sortOptions.some(option => option.value === sortParam)) {
      const newSort = { field: sortParam as ProductSort["field"] };
      setCurrentSort(newSort);
      onSortChange?.(newSort);
    }
  }, [searchParams, onSortChange]);

  const handleSortChange = (sortField: ProductSort["field"]) => {
    const newSort = { field: sortField };
    setCurrentSort(newSort);
    onSortChange?.(newSort);
    setIsOpen(false);

    // Update URL
    const params = new URLSearchParams(searchParams);
    if (sortField === "featured") {
      params.delete("sort");
    } else {
      params.set("sort", sortField);
    }
    
    const newUrl = params.toString() ? `/shop?${params.toString()}` : '/shop';
    router.push(newUrl, { scroll: false });
  };

  const currentSortLabel = sortOptions.find(option => option.value === currentSort.field)?.label || "Featured";

  return (
    <div className={`relative ${className}`}>
      {/* Sort Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 px-4 py-2 border border-[var(--color-odessi-smoke)] rounded-sm type-caption font-medium hover:border-[var(--color-odessi-stone)] transition-colors min-w-[140px]"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="truncate">Sort: {currentSortLabel}</span>
        <ChevronDown 
          size={14} 
          className={`transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} 
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[var(--color-odessi-smoke)] rounded-sm shadow-lg z-20">
            <ul role="listbox" className="py-1">
              {sortOptions.map((option) => (
                <li key={option.value} role="option">
                  <button
                    onClick={() => handleSortChange(option.value)}
                    className={`
                      w-full px-4 py-2 text-left text-sm transition-colors
                      ${currentSort.field === option.value
                        ? 'bg-[var(--color-odessi-smoke)] text-[var(--color-odessi-black)] font-medium'
                        : 'text-[var(--color-odessi-stone)] hover:text-[var(--color-odessi-black)] hover:bg-[var(--color-odessi-smoke)]'
                      }
                    `}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}