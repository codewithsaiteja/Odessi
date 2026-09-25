"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Heart, Truck, RotateCcw, Shield, ChevronDown, Bell, Ruler } from "lucide-react";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductGallery from "@/components/product/ProductGallery";
import ProductGrid from "@/components/product/ProductGrid";
import { MobileStickyBar } from "@/components/product/MobileStickyBar";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth/AuthContext";
import { useWishlist } from "@/lib/wishlist-context";
import { formatPrice, calculateDiscount } from "@/lib/product-utils";
import { getProductBySlug as getProductBySlugFromAPI, getProducts } from "@/lib/api/products";
import type { Product, ProductColor } from "@/types";

// Dynamic imports for code splitting & bundle reduction
const ProductReviewsSection = dynamic(() => import("@/components/product/ProductReviewsSection"), { ssr: false });
const SizeGuide = dynamic(() => import("@/components/product/SizeGuide"), { ssr: false });
const SizeAssistantModal = dynamic(() => import("@/components/product/SizeAssistantModal").then(mod => mod.SizeAssistantModal), { ssr: false });
const BackInStockModal = dynamic(() => import("@/components/product/BackInStockModal").then(mod => mod.BackInStockModal), { ssr: false });
const PincodeDeliveryEstimator = dynamic(() => import("@/components/product/PincodeDeliveryEstimator").then(mod => mod.PincodeDeliveryEstimator), { ssr: false });
const RecentlyViewed = dynamic(() => import("@/components/product/RecentlyViewed").then(mod => mod.RecentlyViewed), { ssr: false });
const ImageTrail = dynamic(() => import("@/components/editorial/ImageTrail"), { ssr: false });
const TryOnModal = dynamic(() => import("@/components/try-on/TryOnModal").then(mod => mod.TryOnModal), { ssr: false });
import { TryOnButton } from "@/components/try-on/TryOnButton";

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart, isLoading: cartLoading } = useCart();
  const { user, isLoading: authLoading } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { isInWishlist, toggleWishlist: toggleWishlistInContext } = useWishlist();
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showSizeAssistant, setShowSizeAssistant] = useState(false);
  const [showBackInStockModal, setShowBackInStockModal] = useState(false);
  const [showTryOnModal, setShowTryOnModal] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("description");
  const [actionError, setActionError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const pendingActionProcessed = useRef(false);

  // Load product
  useEffect(() => {
    async function loadProduct() {
      if (params.slug) {
        setIsLoading(true);
        try {
          const foundProduct = await getProductBySlugFromAPI(params.slug as string);
          setProduct(foundProduct);
          // Auto-select first available color
          if (foundProduct.colors.length > 0) {
            setSelectedColor(foundProduct.colors[0]);
          }
          // Fetch related products by category from backend
          try {
            const related = await getProducts({
              category: foundProduct.category,
              pageSize: 5,
            });
            setRelatedProducts(
              (related.data || []).filter((p) => p.slug !== foundProduct.slug).slice(0, 4)
            );
          } catch {
            setRelatedProducts([]);
          }
        } catch (error) {
          console.error("Failed to load product:", error);
          setProduct(null);
        } finally {
          setIsLoading(false);
        }
      }
    }
    
    loadProduct();
  }, [params.slug]);

  // Handle post-login actions from URL query parameters
  useEffect(() => {
    if (authLoading || cartLoading || !user || !product) return;

    // Use a ref to ensure this only runs once, especially in React Strict Mode
    if (pendingActionProcessed.current) return;

    // Check query params manually (window.location.search) to avoid Next.js useSearchParams hook which causes whole page client-side navigation issues if not wrapped in Suspense sometimes, though we are in a client component.
    const searchParams = new URLSearchParams(window.location.search);
    const action = searchParams.get("action");
    
    // If no action, just mark as processed and clean URL just in case
    if (!action) {
      pendingActionProcessed.current = true;
      return;
    }

    const processAction = async () => {
      pendingActionProcessed.current = true;
      
      const actionSize = searchParams.get("size");
      const actionColor = searchParams.get("color");
      const actionQty = parseInt(searchParams.get("qty") || "1", 10);

      if (actionSize && actionColor) {
        // Find the real color object from product
        const colorObj = product.colors.find(c => c.name === actionColor);
        
        // Verify size exists and is available
        const sizeObj = product.sizes.find(s => s.label === actionSize);
        
        if (!colorObj || !sizeObj || !sizeObj.available) {
          setActionError("That size and color combination is currently unavailable.");
          // Clean URL so it doesn't get stuck
          router.replace(`/product/${product.slug}`, { scroll: false });
          return;
        }

        const success = await addToCart(product, actionSize, colorObj, actionQty);
        
        if (success) {
          // Clean URL on success
          router.replace(`/product/${product.slug}`, { scroll: false });
          
          if (action === "buy-now") {
            router.push("/checkout");
          } else {
            setAddedToCart(true);
            setTimeout(() => setAddedToCart(false), 3000);
          }
        } else {
          setActionError("Failed to add item to cart. Please try again.");
          // Clean URL even on failure so user isn't stuck in a loop
          router.replace(`/product/${product.slug}`, { scroll: false });
        }
      } else {
        // Missing parameters, just clean the URL
        router.replace(`/product/${product.slug}`, { scroll: false });
      }
    };

    processAction();
  }, [user, authLoading, cartLoading, product, addToCart, router]);

  if (isLoading) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-50">
          <AnnouncementBar />
        </div>
        <Navbar />
        <main className="pt-[calc(var(--announcement-height)+var(--navbar-height))] bg-[#FAF9F6] min-h-screen">
          <div className="container-odessi py-8">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Image skeleton */}
              <div className="animate-pulse">
                <div className="aspect-[3/4] rounded-sm bg-[#EAE7DF]" />
                <div className="flex gap-2 mt-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-16 h-20 rounded-sm bg-[#EAE7DF]" />
                  ))}
                </div>
              </div>
              {/* Info skeleton */}
              <div className="animate-pulse space-y-4 pt-4">
                <div className="h-3 w-1/4 bg-[#EAE7DF] rounded-sm" />
                <div className="h-8 w-3/4 bg-[#EAE7DF] rounded-sm" />
                <div className="h-6 w-1/3 bg-[#EAE7DF] rounded-sm" />
                <div className="h-24 w-full bg-[#EAE7DF] rounded-sm mt-4" />
                <div className="h-12 w-full bg-[#EAE7DF] rounded-sm" />
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="type-h2 text-[var(--color-odessi-black)] mb-2">Product not found</h1>
          <Link href="/shop" className="text-[var(--color-odessi-stone)] hover:text-[var(--color-odessi-black)] underline">
            Return to shop
          </Link>
        </div>
      </div>
    );
  }

  const discount = calculateDiscount(product.price, product.compareAtPrice);
  const hasVariants = Boolean(product.variants && product.variants.length > 0);
  const isOutOfStock = !product.available || product.stockStatus === "out_of_stock" || !hasVariants;
  const isLowStock = product.stockStatus === "low_stock";
  const isComingSoon = product.stockStatus === "coming_soon";

  const selectedSizeObj = product.sizes.find((s) => s.label === selectedSize);
  const isSelectedSizeOutOfStock = Boolean(selectedSize && selectedSizeObj && !selectedSizeObj.available);
  const selectedVariant = product.variants?.find(
    (v) => v.size === selectedSize && (!selectedColor || v.color?.name === selectedColor.name)
  ) || product.variants?.find((v) => v.size === selectedSize) || product.variants?.[0];

  const handleAddToCart = async () => {
    setValidationError(null);
    if (!hasVariants) {
      setValidationError("This product is currently unavailable for purchase.");
      return;
    }
    if (!selectedSize) {
      setValidationError("Please select a size");
      return;
    }
    if (isSelectedSizeOutOfStock || isOutOfStock) {
      setShowBackInStockModal(true);
      return;
    }
    if (!selectedColor) {
      setValidationError("Please select a color");
      return;
    }
    
    if (!user) {
      const redirectUrl = `/product/${product.slug}?action=add-to-cart&size=${encodeURIComponent(selectedSize)}&color=${encodeURIComponent(selectedColor.name)}&qty=${quantity}`;
      router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
      return;
    }

    setActionError(null);
    const success = await addToCart(product, selectedSize, selectedColor, quantity);
    if (success) {
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 3000);
    } else {
      setActionError("Failed to add item to cart. Please try again.");
    }
  };

  const handleBuyNow = async () => {
    setValidationError(null);
    if (!selectedSize || !selectedColor) {
      setValidationError("Please select size and color");
      return;
    }
    if (isSelectedSizeOutOfStock || isOutOfStock) {
      setShowBackInStockModal(true);
      return;
    }
    
    if (!user) {
      const redirectUrl = `/product/${product.slug}?action=buy-now&size=${encodeURIComponent(selectedSize)}&color=${encodeURIComponent(selectedColor.name)}&qty=${quantity}`;
      router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
      return;
    }

    setActionError(null);
    const success = await addToCart(product, selectedSize, selectedColor, quantity);
    if (success) {
      router.push("/checkout");
    } else {
      setActionError("Failed to add item to cart. Please try again.");
    }
  };

  const toggleWishlist = () => {
    if (!product) return;
    toggleWishlistInContext(product);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const isWishlisted = Boolean(product && isInWishlist(product.id));

  return (
    <>
      {/* ── Fixed top bar ── */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <AnnouncementBar />
      </div>

      {/* ── Navbar ── */}
      <Navbar />

      {/* ── Main Content ── */}
      <main className="pt-[calc(var(--announcement-height)+var(--navbar-height))] bg-[#FAF9F6] min-h-screen text-[#080808]">
        <div className="container-odessi py-8">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-[var(--color-odessi-stone)]">
              <li>
                <Link href="/" className="hover:text-[var(--color-odessi-black)] transition-colors">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/shop" className="hover:text-[var(--color-odessi-black)] transition-colors">
                  Shop
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link 
                  href={`/shop?category=${product.category}`}
                  className="hover:text-[var(--color-odessi-black)] transition-colors capitalize"
                >
                  {product.category.replace("-", " ")}
                </Link>
              </li>
              <li>/</li>
              <li className="text-[var(--color-odessi-black)] line-clamp-1">{product.name}</li>
            </ol>
          </nav>

          {/* Product Content */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
            {/* Left: Product Media Gallery / 3D Viewer / 360 View */}
            <div>
              <ProductGallery
                images={product.images}
                productName={product.name}
                selectedColorHex={selectedColor?.hex}
                model3D={product.model3D}
                images360={product.images360}
                onOpenTryOn={() => setShowTryOnModal(true)}
              />
            </div>

            {/* Right: Product Info */}
            <div className="lg:sticky lg:top-[calc(var(--announcement-height)+var(--navbar-height)+2rem)] lg:self-start">
              {/* Category & Collection */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs tracking-wider text-[var(--color-odessi-stone)] uppercase font-medium">
                  {product.category.replace("-", " ")}
                </span>
                {product.collection && (
                  <>
                    <span className="text-[var(--color-odessi-stone)]">•</span>
                    <Link
                      href={`/collections/${product.collection}`}
                      className="text-xs tracking-wider text-[var(--color-odessi-stone)] uppercase font-medium hover:text-[var(--color-odessi-black)] transition-colors"
                    >
                      {product.collection.replace("-", " ")}
                    </Link>
                  </>
                )}
              </div>

              {/* Product Name */}
              <h1 className="type-h1 text-[var(--color-odessi-black)] mb-2">
                {product.name}
              </h1>

              {/* Tagline */}
              {product.tagline && (
                <p className="type-body text-[var(--color-odessi-stone)] italic mb-4">
                  {product.tagline}
                </p>
              )}

              {/* Price */}
              <div className="flex items-center gap-3 mb-6">
                <span className="type-h2 text-[var(--color-odessi-black)]">
                  {formatPrice(product.price)}
                </span>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <>
                    <span className="type-body text-[var(--color-odessi-stone)] line-through">
                      {formatPrice(product.compareAtPrice)}
                    </span>
                    <span className="px-2 py-1 text-xs font-semibold bg-red-600 text-white rounded-full">
                      SAVE {discount}%
                    </span>
                  </>
                )}
              </div>

              {actionError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-sm mb-6 text-sm">
                  {actionError}
                </div>
              )}
              {validationError && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-sm mb-6 text-sm flex items-center gap-2">
                  <span>⚠</span>
                  <span>{validationError}</span>
                </div>
              )}

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                {product.newDrop && (
                  <span className="px-3 py-1 text-xs font-semibold tracking-wide bg-[var(--color-odessi-black)] text-white rounded-full">
                    NEW DROP
                  </span>
                )}
                {product.bestseller && (
                  <span className="px-3 py-1 text-xs font-semibold tracking-wide bg-[var(--color-odessi-stone)] text-white rounded-full">
                    BESTSELLER
                  </span>
                )}
                {isLowStock && (
                  <span className="px-3 py-1 text-xs font-semibold tracking-wide bg-orange-500 text-white rounded-full">
                    LOW STOCK
                  </span>
                )}
              </div>

              {/* Short Description */}
              {product.shortDescription && (
                <p className="type-body text-[var(--color-odessi-stone)] mb-6 pb-6 border-b border-[var(--color-odessi-smoke)]">
                  {product.shortDescription}
                </p>
              )}

              {/* Color Selection */}
              {product.colors.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="type-caption font-semibold text-[var(--color-odessi-black)]">
                      Color: {selectedColor?.name || "Select"}
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color)}
                        className={`
                          group relative w-12 h-12 rounded-full border-2 transition-all
                          ${selectedColor?.name === color.name
                            ? 'border-[var(--color-odessi-black)] scale-110'
                            : 'border-[var(--color-odessi-smoke)] hover:border-[var(--color-odessi-stone)]'
                          }
                        `}
                        title={color.name}
                        aria-label={`Select ${color.name}`}
                      >
                        <div
                          className="absolute inset-1 rounded-full"
                          style={{ backgroundColor: color.hex }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selection */}
              {product.sizes.length > 0 ? (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="type-caption font-semibold text-[var(--color-odessi-black)]">
                      Size: {selectedSize || "Select"}
                    </label>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setShowSizeAssistant(true)}
                        className="text-xs text-[var(--color-odessi-stone)] hover:text-[var(--color-odessi-black)] flex items-center gap-1.5 transition-colors font-medium"
                      >
                        <Ruler size={13} className="text-[#B89A5A]" />
                        <span>Find My Size</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSizeGuide(true)}
                        className="text-xs text-[var(--color-odessi-stone)] hover:text-[var(--color-odessi-black)] underline transition-colors"
                      >
                        Size Guide
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {product.sizes.map((size) => {
                      const isSelected = selectedSize === size.label;
                      const isAvailable = size.available;
                      return (
                        <button
                          key={size.label}
                          type="button"
                          onClick={() => setSelectedSize(size.label)}
                          className={`
                            px-3 py-2.5 text-sm font-medium border rounded-sm transition-all relative flex flex-col items-center justify-center
                            ${!isAvailable
                              ? isSelected
                                ? 'border-[#0A0A0A] bg-neutral-100 text-neutral-800'
                                : 'border-[var(--color-odessi-smoke)] text-neutral-400 hover:border-neutral-400'
                              : isSelected
                              ? 'border-[var(--color-odessi-black)] bg-[var(--color-odessi-black)] text-white'
                              : 'border-[var(--color-odessi-smoke)] hover:border-[var(--color-odessi-black)] text-[var(--color-odessi-black)]'
                            }
                          `}
                        >
                          <span className={!isAvailable ? "line-through opacity-75" : ""}>{size.label}</span>
                          {!isAvailable && (
                            <span className="text-[9px] uppercase tracking-tighter text-neutral-400 mt-0.5 font-normal">Sold out</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {isSelectedSizeOutOfStock && (
                    <div className="mt-3 p-3 bg-[#F7F5F0] border border-neutral-200 rounded-sm text-xs text-neutral-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell size={14} className="text-[#B89A5A] shrink-0" />
                        <span>Size <strong>{selectedSize}</strong> is currently out of stock.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowBackInStockModal(true)}
                        className="text-xs font-semibold text-[#0A0A0A] underline hover:text-[#B89A5A]"
                      >
                        Notify Me
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mb-6 p-4 bg-amber-50/60 border border-amber-200/70 rounded text-xs text-amber-900 leading-relaxed">
                  Variants and sizes are being configured for this edition. Currently unavailable for online order.
                </div>
              )}

              {/* Quantity */}
              <div className="mb-6">
                <label className="type-caption font-semibold text-[var(--color-odessi-black)] block mb-3">
                  Quantity
                </label>
                <div className="flex items-center gap-3 w-32 border border-[var(--color-odessi-smoke)] rounded-sm">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 hover:bg-[var(--color-odessi-smoke)] transition-colors"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="flex-1 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 hover:bg-[var(--color-odessi-smoke)] transition-colors"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 mb-8">
                {/* Decart Lucy VTON: Real-Time Virtual Try-On */}
                <TryOnButton
                  onClick={() => setShowTryOnModal(true)}
                  className="mb-1"
                />

                {!hasVariants ? (
                  <div className="space-y-2">
                    <button
                      disabled
                      className="w-full py-4 px-6 bg-[var(--color-odessi-smoke)] text-[var(--color-odessi-stone)] text-center type-nav font-semibold rounded-sm cursor-not-allowed uppercase tracking-wider"
                    >
                      CURRENTLY UNAVAILABLE
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBackInStockModal(true)}
                      className="w-full py-3.5 px-6 bg-[#0A0A0A] hover:bg-[#1A1A1A] text-white text-center type-nav font-semibold rounded-sm transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Bell size={16} className="text-[#B89A5A]" />
                      <span>NOTIFY ME WHEN AVAILABLE</span>
                    </button>
                  </div>
                ) : isSelectedSizeOutOfStock || isOutOfStock ? (
                  <button
                    type="button"
                    onClick={() => setShowBackInStockModal(true)}
                    className="w-full py-4 px-6 bg-[#0A0A0A] hover:bg-[#1A1A1A] text-white text-center type-nav font-semibold rounded-sm transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Bell size={16} className="text-[#B89A5A]" />
                    <span>NOTIFY ME WHEN AVAILABLE</span>
                  </button>
                ) : isComingSoon ? (
                  <button
                    type="button"
                    onClick={() => setShowBackInStockModal(true)}
                    className="w-full py-4 px-6 bg-[#0A0A0A] hover:bg-[#1A1A1A] text-white text-center type-nav font-semibold rounded-sm transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Bell size={16} className="text-[#B89A5A]" />
                    <span>NOTIFY ME ON DROP LAUNCH</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleAddToCart}
                      className={`
                        w-full py-4 px-6 text-center type-nav font-semibold rounded-sm transition-all
                        ${addedToCart
                          ? 'bg-green-600 text-white'
                          : 'bg-[var(--color-odessi-black)] text-white hover:bg-[var(--color-odessi-stone)]'
                        }
                      `}
                    >
                      {addedToCart ? "✓ ADDED TO CART" : "ADD TO CART"}
                    </button>

                    <button
                      onClick={handleBuyNow}
                      className="w-full py-4 px-6 border-2 border-[var(--color-odessi-black)] text-[var(--color-odessi-black)] text-center type-nav font-semibold rounded-sm hover:bg-[var(--color-odessi-smoke)] transition-colors"
                    >
                      BUY NOW
                    </button>
                  </>
                )}

                <button
                  onClick={toggleWishlist}
                  className={`
                    w-full py-3 px-6 flex items-center justify-center gap-2 border border-[var(--color-odessi-smoke)] rounded-sm transition-colors
                    ${isWishlisted
                      ? 'bg-[var(--color-odessi-black)] text-white border-[var(--color-odessi-black)]'
                      : 'hover:bg-[var(--color-odessi-smoke)]'
                    }
                  `}
                >
                  <Heart size={18} strokeWidth={1.5} className={isWishlisted ? "fill-current" : ""} />
                  <span className="type-caption font-medium">
                    {isWishlisted ? "IN WISHLIST" : "ADD TO WISHLIST"}
                  </span>
                </button>

                {/* Indian Pincode Delivery Estimator */}
                <PincodeDeliveryEstimator className="mt-4" />
              </div>

              {/* Product Features */}
              <div className="grid grid-cols-2 gap-4 mb-8 p-4 bg-[var(--color-odessi-smoke)] rounded-sm">
                <div className="flex items-start gap-3">
                  <Truck size={20} strokeWidth={1.5} className="text-[var(--color-odessi-stone)] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-odessi-black)]">Free Shipping</p>
                    <p className="text-xs text-[var(--color-odessi-stone)]">On orders above ₹999</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <RotateCcw size={20} strokeWidth={1.5} className="text-[var(--color-odessi-stone)] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-odessi-black)]">Easy Returns</p>
                    <p className="text-xs text-[var(--color-odessi-stone)]">14 day return policy</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield size={20} strokeWidth={1.5} className="text-[var(--color-odessi-stone)] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-odessi-black)]">Secure Checkout</p>
                    <p className="text-xs text-[var(--color-odessi-stone)]">Safe & encrypted</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Truck size={20} strokeWidth={1.5} className="text-[var(--color-odessi-stone)] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-odessi-black)]">Fast Delivery</p>
                    <p className="text-xs text-[var(--color-odessi-stone)]">3-5 business days</p>
                  </div>
                </div>
              </div>

              {/* Accordion Sections */}
              <div className="space-y-4">
                {/* Description */}
                <AccordionSection
                  title="Description"
                  isExpanded={expandedSection === "description"}
                  onToggle={() => toggleSection("description")}
                >
                  <p className="text-sm text-[var(--color-odessi-stone)] leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </AccordionSection>

                {/* Material & Fit */}
                {(product.material || product.fit) && (
                  <AccordionSection
                    title="Material & Fit"
                    isExpanded={expandedSection === "material"}
                    onToggle={() => toggleSection("material")}
                  >
                    <div className="space-y-2 text-sm">
                      {product.material && (
                        <p className="text-[var(--color-odessi-stone)]">
                          <span className="font-medium text-[var(--color-odessi-black)]">Material:</span> {product.material}
                        </p>
                      )}
                      {product.fit && (
                        <p className="text-[var(--color-odessi-stone)]">
                          <span className="font-medium text-[var(--color-odessi-black)]">Fit:</span> {product.fit}
                        </p>
                      )}
                    </div>
                  </AccordionSection>
                )}

                {/* Care Instructions */}
                {product.careInstructions && product.careInstructions.length > 0 && (
                  <AccordionSection
                    title="Care Instructions"
                    isExpanded={expandedSection === "care"}
                    onToggle={() => toggleSection("care")}
                  >
                    <ul className="space-y-1 text-sm text-[var(--color-odessi-stone)]">
                      {product.careInstructions.map((instruction, index) => (
                        <li key={index}>• {instruction}</li>
                      ))}
                    </ul>
                  </AccordionSection>
                )}

                {/* Shipping & Returns */}
                <AccordionSection
                  title="Shipping & Returns"
                  isExpanded={expandedSection === "shipping"}
                  onToggle={() => toggleSection("shipping")}
                >
                  <div className="space-y-3 text-sm text-[var(--color-odessi-stone)]">
                    <p>Free shipping on all orders above ₹999. Standard shipping takes 3-5 business days.</p>
                    <p>We offer hassle-free returns within 14 days of delivery. Items must be unworn and in original condition with tags attached.</p>
                  </div>
                </AccordionSection>
              </div>
            </div>
          </div>

          {/* ── Editorial Worn Trail Canvas (Interactive Lookbook) ── */}
          {Boolean((product.images360?.images && product.images360.images.length > 0) || (product.images && product.images.length > 0)) && (
            <div className="mb-16">
              <ImageTrail
                images={
                  product.images360?.images && product.images360.images.length > 1
                    ? product.images360.images
                    : (product.images && product.images.length > 1
                        ? product.images
                        : [
                            product.thumbnail || product.images?.[0] || "/placeholder-product.svg",
                            ...(product.images360?.images || []),
                            "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1000&q=85",
                            "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1000&q=85",
                          ])
                }
                maxTrailItems={4}
                distanceThreshold={65}
                className="rounded-sm border border-neutral-800"
              >
                <div className="py-16 px-6 text-center bg-[#0d0d0d] text-white select-none cursor-crosshair relative overflow-hidden">
                  <span className="text-[11px] uppercase tracking-widest text-[#B89A5A] font-semibold mb-2 block font-mono">
                    EDITORIAL WORN PERSPECTIVE
                  </span>
                  <h3 className="type-h2 text-white mb-3">
                    THE SILHOUETTE IN MOTION
                  </h3>
                  <p className="text-sm text-neutral-400 max-w-md mx-auto mb-6">
                    Move your cursor across this canvas to reveal dynamic worn perspectives of {product.name}.
                  </p>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-neutral-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B89A5A] animate-pulse" />
                    <span>INTERACTIVE TRAIL ACTIVE</span>
                  </div>
                </div>
              </ImageTrail>
            </div>
          )}

          {/* Verified Customer Reviews */}
          <ProductReviewsSection
            productId={Number(product.id)}
            productName={product.name}
            productImage={typeof product.images?.[0] === "string" ? product.images[0] : (product.images as unknown as { imageUrl: string }[])?.[0]?.imageUrl || product.thumbnail}
          />

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="py-12 border-t border-[var(--color-odessi-smoke)]">
              <h2 className="type-h2 text-[var(--color-odessi-black)] mb-8">
                YOU MIGHT ALSO LIKE
              </h2>
              <ProductGrid products={relatedProducts} />
            </div>
          )}

          {/* Recently Viewed */}
          <RecentlyViewed currentProductId={product.id} />
        </div>
      </main>

      {/* ── Footer ── */}
      <Footer />

      {/* Mobile Sticky Bar */}
      <MobileStickyBar
        product={product}
        selectedSize={selectedSize}
        isOutOfStock={isOutOfStock || isSelectedSizeOutOfStock}
        onAddToCart={handleAddToCart}
        onNotifyMe={() => setShowBackInStockModal(true)}
        addedToCart={addedToCart}
        onOpenTryOn={() => setShowTryOnModal(true)}
      />

      {/* Size Guide Modal */}
      <SizeGuide
        isOpen={showSizeGuide}
        onClose={() => setShowSizeGuide(false)}
        category={product.category}
      />

      {/* Size Assistant Modal */}
      <SizeAssistantModal
        isOpen={showSizeAssistant}
        onClose={() => setShowSizeAssistant(false)}
        onSelectSize={(size) => setSelectedSize(size)}
      />

      {/* Back In Stock Modal */}
      <BackInStockModal
        isOpen={showBackInStockModal}
        onClose={() => setShowBackInStockModal(false)}
        productId={Number(product.id) || 1}
        productName={product.name}
        variantId={Number(selectedVariant?.id) || 1}
        variantSku={selectedVariant?.sku || `${product.slug}-${selectedSize || 'OS'}`}
      />

      {/* Decart Lucy VTON: Real-Time Virtual Try-On Modal */}
      {showTryOnModal && (
        <TryOnModal
          isOpen={showTryOnModal}
          onClose={() => setShowTryOnModal(false)}
          product={product}
          selectedVariantSku={selectedVariant?.sku}
        />
      )}
    </>
  );
}

// Accordion Section Component
function AccordionSection({
  title,
  isExpanded,
  onToggle,
  children,
}: {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-[var(--color-odessi-smoke)] rounded-sm">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--color-odessi-smoke)] transition-colors"
        aria-expanded={isExpanded}
      >
        <span className="type-caption font-semibold text-[var(--color-odessi-black)]">
          {title}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={1.5}
          className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 pt-2">
          {children}
        </div>
      )}
    </div>
  );
}