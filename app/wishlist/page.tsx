"use client";

import Link from "next/link";
import { Heart, X, ShoppingBag } from "lucide-react";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/product/ProductCard";
import { useWishlist } from "@/lib/wishlist-context";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import BackButton from "@/components/navigation/BackButton";

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, itemCount } = useWishlist();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const handleQuickAdd = (product: any) => {
    // Add first available size and color
    const availableSize = product.sizes.find((s: any) => s.available)?.label;
    const firstColor = product.colors[0];
    
    if (availableSize && firstColor) {
      if (!user) {
        const redirectUrl = `/product/${product.slug}?action=add-to-cart&size=${encodeURIComponent(availableSize)}&color=${encodeURIComponent(firstColor.name)}&qty=1`;
        router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
        return;
      }
      addToCart(product, availableSize, firstColor, 1);
    }
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
      <main className="pt-[calc(var(--announcement-height)+var(--navbar-height))] min-h-screen">
        <div className="container-odessi py-12">
          {/* Header */}
          <div className="mb-8">
            <BackButton fallback="/shop" label="Continue Shopping" className="mb-4" />
            <div className="flex items-center gap-3 mb-2">
              <Heart size={32} strokeWidth={1.5} className="text-[var(--color-odessi-black)]" />
              <h1 className="type-h1 text-[var(--color-odessi-black)]">
                WISHLIST
              </h1>
            </div>
            <p className="text-[var(--color-odessi-stone)]">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </p>
          </div>

          {wishlist.length === 0 ? (
            /* Empty Wishlist State */
            <div className="text-center py-16">
              <Heart size={64} strokeWidth={1} className="mx-auto mb-6 text-[var(--color-odessi-stone)]" />
              <h2 className="type-h2 text-[var(--color-odessi-black)] mb-2">
                Your wishlist is empty
              </h2>
              <p className="type-body text-[var(--color-odessi-stone)] mb-8">
                Save your favorite products to your wishlist and shop them later.
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-8 py-3 bg-[var(--color-odessi-black)] text-white type-nav font-semibold rounded-sm hover:bg-[var(--color-odessi-stone)] transition-colors"
              >
                <ShoppingBag size={16} strokeWidth={1.5} />
                START SHOPPING
              </Link>
            </div>
          ) : (
            /* Wishlist Content */
            <div>
              {/* Product Grid */}
              <div className="
                grid gap-x-4 gap-y-8
                grid-cols-2 
                sm:grid-cols-2 
                md:grid-cols-3 
                lg:grid-cols-4
              ">
                {wishlist.map((item) => (
                  <div key={item.product.id} className="relative group">
                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromWishlist(item.product.id)}
                      className="
                        absolute top-2 right-2 z-10 p-2 bg-white rounded-full shadow-md
                        opacity-0 group-hover:opacity-100 transition-opacity duration-200
                        hover:bg-red-50 hover:text-red-600
                      "
                      aria-label="Remove from wishlist"
                    >
                      <X size={14} strokeWidth={1.5} />
                    </button>

                    <ProductCard
                      product={item.product}
                      onWishlistToggle={() => removeFromWishlist(item.product.id)}
                      onQuickAdd={handleQuickAdd}
                      isWishlisted={true}
                    />
                  </div>
                ))}
              </div>

              {/* Added Date Info */}
              <div className="mt-8 pt-8 border-t border-[var(--color-odessi-smoke)]">
                <p className="text-sm text-[var(--color-odessi-stone)]">
                  💡 Tip: Products in your wishlist are saved locally. Sign in to sync your wishlist across devices.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <Footer />
    </>
  );
}