"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, Filter, ChevronDown } from "lucide-react";
import type { ProductFilters } from "@/types";
import { categories as staticCategories } from "@/data/categories";
import { collections as staticCollections } from "@/data/collections";
import { getCategories } from "@/lib/api/categories";
import { getCollections } from "@/lib/api/collections";
import { urlParamsToFilters, filtersToUrlParams } from "@/lib/product-utils";

interface FiltersProps {
  onFiltersChange?: (filters: ProductFilters) => void;
  className?: string;
}

export default function Filters({ onFiltersChange, className = "" }: FiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentFilters, setCurrentFilters] = useState<ProductFilters>({});
  const [isOpen, setIsOpen] = useState(false);
  const [availableCategories, setAvailableCategories] = useState(staticCategories);
  const [availableCollections, setAvailableCollections] = useState(staticCollections);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [catRes, colData] = await Promise.all([
          getCategories().catch(() => null),
          getCollections().catch(() => [] as import("@/types").Collection[]),
        ]);

        const catList: any[] = Array.isArray(catRes) ? catRes : (Array.isArray(catRes?.data) ? catRes.data : []);
        if (catList.length > 0) {
          setAvailableCategories(catList.map(c => ({
            id: String(c.id),
            name: c.name,
            slug: c.slug as any,
            description: c.description || "",
            coverImage: c.image || c.imageUrl || c.coverImage || ""
          })));
        }
        if (Array.isArray(colData) && colData.length > 0) {
          setAvailableCollections(colData.map(c => ({
            id: String(c.id),
            name: c.name,
            slug: c.slug,
            tagline: c.tagline || c.name,
            description: c.description || "",
            coverImage: c.coverImage || ""
          })));
        }
      } catch {
        // Fall back gracefully to static data
      }
    }
    loadOptions();
  }, []);

  // Initialize filters from URL
  useEffect(() => {
    const filtersFromUrl = urlParamsToFilters(searchParams);
    setCurrentFilters(filtersFromUrl);
    onFiltersChange?.(filtersFromUrl);
  }, [searchParams, onFiltersChange]);

  const updateFilters = (newFilters: ProductFilters) => {
    setCurrentFilters(newFilters);
    onFiltersChange?.(newFilters);

    // Update URL
    const params = filtersToUrlParams(newFilters);
    const newUrl = params.toString() ? `/shop?${params.toString()}` : '/shop';
    router.push(newUrl, { scroll: false });
  };

  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    const newFilters = { ...currentFilters };
    
    if (value === null || value === undefined || value === '') {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    
    updateFilters(newFilters);
  };

  const clearAllFilters = () => {
    updateFilters({});
  };

  const hasActiveFilters = Object.keys(currentFilters).length > 0;

  const availableSizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const availableColors = [
    { name: "Black", value: "black" },
    { name: "White", value: "white" },
    { name: "Grey", value: "grey" },
    { name: "Charcoal", value: "charcoal" },
  ];

  return (
    <div className={className}>
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 border border-[var(--color-odessi-smoke)] rounded-sm type-caption font-medium"
        >
          <Filter size={14} />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 px-2 py-1 text-xs bg-[var(--color-odessi-black)] text-white rounded-full">
              {Object.keys(currentFilters).length}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      <div className={`
        ${isOpen ? 'block' : 'hidden'} lg:block
        space-y-6
      `}>
        {/* Active Filters */}
        {hasActiveFilters && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="type-caption font-semibold text-[var(--color-odessi-black)]">
                Active Filters
              </h3>
              <button
                onClick={clearAllFilters}
                className="text-xs text-[var(--color-odessi-stone)] hover:text-[var(--color-odessi-black)] underline"
              >
                Clear All
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {currentFilters.category && (
                <FilterTag
                  label={`Category: ${currentFilters.category}`}
                  onRemove={() => handleFilterChange('category', null)}
                />
              )}
              {currentFilters.collection && (
                <FilterTag
                  label={`Collection: ${currentFilters.collection}`}
                  onRemove={() => handleFilterChange('collection', null)}
                />
              )}
              {currentFilters.size && (
                <FilterTag
                  label={`Size: ${currentFilters.size}`}
                  onRemove={() => handleFilterChange('size', null)}
                />
              )}
              {currentFilters.color && (
                <FilterTag
                  label={`Color: ${currentFilters.color}`}
                  onRemove={() => handleFilterChange('color', null)}
                />
              )}
              {(currentFilters.minPrice || currentFilters.maxPrice) && (
                <FilterTag
                  label={`Price: ₹${currentFilters.minPrice || 0} - ₹${currentFilters.maxPrice || '∞'}`}
                  onRemove={() => {
                    handleFilterChange('minPrice', null);
                    handleFilterChange('maxPrice', null);
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* Category Filter */}
        <FilterGroup title="Category">
          <div className="space-y-2">
            <FilterOption
              label="All Categories"
              isSelected={!currentFilters.category}
              onClick={() => handleFilterChange('category', null)}
            />
            {availableCategories.map((category) => (
              <FilterOption
                key={category.slug}
                label={category.name}
                isSelected={currentFilters.category === category.slug}
                onClick={() => handleFilterChange('category', category.slug)}
              />
            ))}
          </div>
        </FilterGroup>

        {/* Collection Filter */}
        <FilterGroup title="Collection">
          <div className="space-y-2">
            <FilterOption
              label="All Collections"
              isSelected={!currentFilters.collection}
              onClick={() => handleFilterChange('collection', null)}
            />
            {availableCollections.map((collection) => (
              <FilterOption
                key={collection.slug}
                label={collection.name}
                isSelected={currentFilters.collection === collection.slug}
                onClick={() => handleFilterChange('collection', collection.slug)}
              />
            ))}
          </div>
        </FilterGroup>

        {/* Size Filter */}
        <FilterGroup title="Size">
          <div className="grid grid-cols-3 gap-2">
            {availableSizes.map((size) => (
              <button
                key={size}
                onClick={() => 
                  handleFilterChange('size', currentFilters.size === size ? null : size)
                }
                className={`
                  px-3 py-2 text-sm text-center border rounded-sm transition-colors
                  ${currentFilters.size === size
                    ? 'border-[var(--color-odessi-black)] bg-[var(--color-odessi-black)] text-white'
                    : 'border-[var(--color-odessi-smoke)] hover:border-[var(--color-odessi-stone)]'
                  }
                `}
              >
                {size}
              </button>
            ))}
          </div>
        </FilterGroup>

        {/* Color Filter */}
        <FilterGroup title="Color">
          <div className="space-y-2">
            {availableColors.map((color) => (
              <FilterOption
                key={color.value}
                label={color.name}
                isSelected={currentFilters.color === color.value}
                onClick={() => handleFilterChange('color', color.value)}
              />
            ))}
          </div>
        </FilterGroup>

        {/* Price Range */}
        <FilterGroup title="Price Range">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="minPrice" className="block text-xs text-[var(--color-odessi-stone)] mb-1">
                  Min Price
                </label>
                <input
                  id="minPrice"
                  type="number"
                  placeholder="₹0"
                  value={currentFilters.minPrice || ''}
                  onChange={(e) => 
                    handleFilterChange('minPrice', e.target.value ? parseInt(e.target.value) : null)
                  }
                  className="w-full px-3 py-2 text-sm border border-[var(--color-odessi-smoke)] rounded-sm focus:outline-none focus:border-[var(--color-odessi-black)]"
                />
              </div>
              <div>
                <label htmlFor="maxPrice" className="block text-xs text-[var(--color-odessi-stone)] mb-1">
                  Max Price
                </label>
                <input
                  id="maxPrice"
                  type="number"
                  placeholder="₹10000"
                  value={currentFilters.maxPrice || ''}
                  onChange={(e) => 
                    handleFilterChange('maxPrice', e.target.value ? parseInt(e.target.value) : null)
                  }
                  className="w-full px-3 py-2 text-sm border border-[var(--color-odessi-smoke)] rounded-sm focus:outline-none focus:border-[var(--color-odessi-black)]"
                />
              </div>
            </div>
          </div>
        </FilterGroup>

        {/* Availability */}
        <FilterGroup title="Availability">
          <FilterOption
            label="In Stock Only"
            isSelected={currentFilters.available === true}
            onClick={() => 
              handleFilterChange('available', currentFilters.available === true ? null : true)
            }
          />
        </FilterGroup>
      </div>
    </div>
  );
}

// Helper Components
function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="type-caption font-semibold text-[var(--color-odessi-black)] mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function FilterOption({ 
  label, 
  isSelected, 
  onClick 
}: { 
  label: string; 
  isSelected: boolean; 
  onClick: () => void; 
}) {
  return (
    <button
      onClick={onClick}
      className={`
        block w-full text-left text-sm py-1 transition-colors
        ${isSelected 
          ? 'text-[var(--color-odessi-black)] font-medium' 
          : 'text-[var(--color-odessi-stone)] hover:text-[var(--color-odessi-black)]'
        }
      `}
    >
      {label}
    </button>
  );
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-[var(--color-odessi-smoke)] text-[var(--color-odessi-black)] rounded-full">
      {label}
      <button
        onClick={onRemove}
        className="hover:text-[var(--color-odessi-stone)]"
        aria-label={`Remove ${label} filter`}
      >
        <X size={12} />
      </button>
    </span>
  );
}