"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, X, ShoppingBag, ArrowRight } from "lucide-react";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth/AuthContext";
import { formatPrice } from "@/lib/cart";
import { FreeShippingMeter } from "@/components/cart/FreeShippingMeter";
import BackButton from "@/components/navigation/BackButton";

export default function CartPage() {
  const { cart, itemCount, subtotal, shipping, total, updateQuantity, removeFromCart } = useCart();
  const { user, isLoading: authLoading } = useAuth();

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
            <h1 className="type-h1 text-[var(--color-odessi-black)] mb-2">
              CART
            </h1>
            <p className="text-[var(--color-odessi-stone)]">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </p>
          </div>

          {!authLoading && !user ? (
            <div className="text-center py-16">
              <ShoppingBag size={64} strokeWidth={1} className="mx-auto mb-6 text-[var(--color-odessi-stone)]" />
              <h2 className="type-h2 text-[var(--color-odessi-black)] mb-2">
                Your cart is waiting.
              </h2>
              <p className="type-body text-[var(--color-odessi-stone)] mb-8">
                Sign in to access your cart and continue shopping.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/login?redirect=/cart"
                  className="w-full sm:w-auto min-w-[200px] px-8 py-3 bg-[var(--color-odessi-black)] text-white type-nav font-semibold rounded-sm hover:bg-[var(--color-odessi-stone)] transition-colors"
                >
                  SIGN IN
                </Link>
                <Link
                  href="/register?redirect=/cart"
                  className="w-full sm:w-auto min-w-[200px] px-8 py-3 border border-[var(--color-odessi-black)] text-[var(--color-odessi-black)] type-nav font-semibold rounded-sm hover:bg-[var(--color-odessi-smoke)] transition-colors"
                >
                  CREATE ACCOUNT
                </Link>
              </div>
            </div>
          ) : cart.length === 0 ? (
            /* Empty Cart State */
            <div className="text-center py-16">
              <ShoppingBag size={64} strokeWidth={1} className="mx-auto mb-6 text-[var(--color-odessi-stone)]" />
              <h2 className="type-h2 text-[var(--color-odessi-black)] mb-2">
                Your cart is empty
              </h2>
              <p className="type-body text-[var(--color-odessi-stone)] mb-8">
                Looks like you haven't added anything to your cart yet.
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-8 py-3 bg-[var(--color-odessi-black)] text-white type-nav font-semibold rounded-sm hover:bg-[var(--color-odessi-stone)] transition-colors"
              >
                SHOP NOW
                <ArrowRight size={16} strokeWidth={1.5} />
              </Link>
            </div>
          ) : (
            /* Cart Content */
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <div className="space-y-6">
                  {cart.map((item) => (
                    <div
                      key={`${item.cartItemId || item.product.id}-${item.selectedSize}-${item.selectedColor.name}`}
                      className="flex gap-4 pb-6 border-b border-[var(--color-odessi-smoke)]"
                    >
                      {/* Product Image */}
                      <Link
                        href={`/product/${item.product.slug}`}
                        className="relative w-32 h-40 flex-shrink-0 bg-[var(--color-odessi-smoke)] rounded-sm overflow-hidden group"
                      >
                        <Image
                          src={item.imageUrl || item.primaryImageUrl || item.product.thumbnail || item.product.images[0] || "/placeholder-product.svg"}
                          alt={item.product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="128px"
                        />
                      </Link>

                      {/* Product Info */}
                      <div className="flex-1 flex flex-col">
                        <div className="flex justify-between gap-4 mb-2">
                          <div>
                            <Link
                              href={`/product/${item.product.slug}`}
                              className="type-body font-semibold text-[var(--color-odessi-black)] hover:text-[var(--color-odessi-stone)] transition-colors block mb-1"
                            >
                              {item.product.name}
                            </Link>
                            
                            <p className="text-sm text-[var(--color-odessi-stone)] uppercase tracking-wide mb-2">
                              {item.product.category.replace("-", " ")}
                            </p>

                            <div className="text-sm text-[var(--color-odessi-stone)] space-y-1">
                              <p>Size: <span className="font-medium text-[var(--color-odessi-black)]">{item.selectedSize}</span></p>
                              <div className="flex items-center gap-2">
                                <span>Color:</span>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-4 h-4 rounded-full border border-[var(--color-odessi-smoke)]"
                                    style={{ backgroundColor: item.selectedColor.hex }}
                                  />
                                  <span className="font-medium text-[var(--color-odessi-black)]">
                                    {item.selectedColor.name}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Remove Button - Desktop */}
                          <button
                            onClick={() =>
                              removeFromCart(
                                item.product.id,
                                item.selectedSize,
                                item.selectedColor.name
                              )
                            }
                            className="hidden md:block p-2 -mt-2 -mr-2 hover:opacity-60 transition-opacity"
                            aria-label="Remove from cart"
                          >
                            <X size={20} strokeWidth={1.5} />
                          </button>
                        </div>

                        <div className="mt-auto flex items-center justify-between">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-3 border border-[var(--color-odessi-smoke)] rounded-sm">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.selectedSize,
                                  item.selectedColor.name,
                                  item.quantity - 1
                                )
                              }
                              className="p-2 hover:bg-[var(--color-odessi-smoke)] transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={16} strokeWidth={1.5} />
                            </button>

                            <span className="text-sm font-medium w-12 text-center">
                              {item.quantity}
                            </span>

                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.selectedSize,
                                  item.selectedColor.name,
                                  item.quantity + 1
                                )
                              }
                              className="p-2 hover:bg-[var(--color-odessi-smoke)] transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus size={16} strokeWidth={1.5} />
                            </button>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <p className="type-body font-semibold text-[var(--color-odessi-black)]">
                              {formatPrice(item.product.price * item.quantity)}
                            </p>
                            {item.quantity > 1 && (
                              <p className="text-sm text-[var(--color-odessi-stone)]">
                                {formatPrice(item.product.price)} each
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Remove Button - Mobile */}
                        <button
                          onClick={() =>
                            removeFromCart(
                              item.product.id,
                              item.selectedSize,
                              item.selectedColor.name
                            )
                          }
                          className="md:hidden text-sm text-[var(--color-odessi-stone)] hover:text-[var(--color-odessi-black)] underline mt-3 text-left"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="sticky top-[calc(var(--announcement-height)+var(--navbar-height)+2rem)] bg-[var(--color-odessi-smoke)] rounded-sm p-6 space-y-4">
                  <h2 className="type-h3 text-[var(--color-odessi-black)] mb-4">
                    Order Summary
                  </h2>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--color-odessi-stone)]">Subtotal ({itemCount} items)</span>
                      <span className="font-medium text-[var(--color-odessi-black)]">
                        {formatPrice(subtotal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--color-odessi-stone)]">Shipping</span>
                      <span className="font-medium text-[var(--color-odessi-black)]">
                        {shipping === 0 ? "FREE" : formatPrice(shipping)}
                      </span>
                    </div>

                    <FreeShippingMeter subtotal={subtotal} threshold={999} />

                    <div className="flex items-center justify-between pt-4 border-t border-white">
                      <span className="type-body font-semibold text-[var(--color-odessi-black)]">
                        Total
                      </span>
                      <span className="type-h3 text-[var(--color-odessi-black)]">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 space-y-3">
                    <Link
                      href="/checkout"
                      className="block w-full py-3 px-6 bg-[var(--color-odessi-black)] text-white text-center type-nav font-semibold rounded-sm hover:bg-[var(--color-odessi-stone)] transition-colors"
                    >
                      PROCEED TO CHECKOUT
                    </Link>

                    <Link
                      href="/shop"
                      className="block w-full py-3 px-6 border border-[var(--color-odessi-black)] text-[var(--color-odessi-black)] text-center type-nav font-semibold rounded-sm hover:bg-white transition-colors"
                    >
                      CONTINUE SHOPPING
                    </Link>
                  </div>

                  <div className="pt-4 border-t border-white text-xs text-[var(--color-odessi-stone)] space-y-2">
                    <p>✓ Secure checkout</p>
                    <p>✓ Easy returns within 14 days</p>
                    <p>✓ Tracked shipping</p>
                  </div>
                </div>
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