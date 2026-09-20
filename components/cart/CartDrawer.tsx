"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth/AuthContext";
import { formatPrice } from "@/lib/cart";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cart, itemCount, subtotal, shipping, total, updateQuantity, removeFromCart } = useCart();
  const { user, isLoading: authLoading } = useAuth();

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300
          ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`
          fixed top-0 right-0 bottom-0 w-full max-w-md bg-[var(--color-odessi-warmwhite)] 
          flex flex-col z-50 transition-transform duration-300 ease-out shadow-2xl
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-odessi-smoke)]">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} strokeWidth={1.5} />
            <h2 className="type-h3 text-[var(--color-odessi-black)]">
              Cart ({itemCount})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 hover:opacity-60 transition-opacity"
            aria-label="Close cart"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {!authLoading && !user ? (
            <div className="text-center py-12">
              <ShoppingBag size={48} strokeWidth={1} className="mx-auto mb-6 text-[var(--color-odessi-stone)]" />
              <h3 className="type-h3 text-[var(--color-odessi-black)] mb-2">
                Your cart is waiting.
              </h3>
              <p className="type-body text-[var(--color-odessi-stone)] mb-8">
                Sign in to access your cart and continue shopping.
              </p>
              <div className="space-y-3">
                <Link
                  href="/login?redirect=/cart"
                  onClick={onClose}
                  className="block w-full py-3 px-6 bg-[var(--color-odessi-black)] text-white text-center type-nav font-semibold rounded-sm hover:bg-[var(--color-odessi-stone)] transition-colors"
                >
                  SIGN IN
                </Link>
                <Link
                  href="/register?redirect=/cart"
                  onClick={onClose}
                  className="block w-full py-3 px-6 border border-[var(--color-odessi-black)] text-[var(--color-odessi-black)] text-center type-nav font-semibold rounded-sm hover:bg-[var(--color-odessi-smoke)] transition-colors"
                >
                  CREATE ACCOUNT
                </Link>
              </div>
            </div>
          ) : cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag size={48} strokeWidth={1} className="mx-auto mb-4 text-[var(--color-odessi-stone)]" />
              <p className="type-body text-[var(--color-odessi-stone)] mb-2">
                Your cart is empty
              </p>
              <p className="text-sm text-[var(--color-odessi-stone)]">
                Add products to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item, index) => (
                <div
                  key={`${item.product.id}-${item.selectedSize}-${item.selectedColor.name}`}
                  className="flex gap-4 pb-4 border-b border-[var(--color-odessi-smoke)]"
                >
                  {/* Product Image */}
                  <Link
                    href={`/product/${item.product.slug}`}
                    onClick={onClose}
                    className="relative w-24 h-32 flex-shrink-0 bg-[var(--color-odessi-smoke)] rounded-sm overflow-hidden"
                  >
                    <Image
                      src={item.product.thumbnail || item.product.images[0]}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </Link>

                  {/* Product Info */}
                  <div className="flex-1 flex flex-col">
                    <Link
                      href={`/product/${item.product.slug}`}
                      onClick={onClose}
                      className="type-body font-semibold text-[var(--color-odessi-black)] hover:text-[var(--color-odessi-stone)] transition-colors mb-1 line-clamp-2"
                    >
                      {item.product.name}
                    </Link>

                    <div className="text-sm text-[var(--color-odessi-stone)] mb-2">
                      <p>Size: {item.selectedSize}</p>
                      <p>Color: {item.selectedColor.name}</p>
                    </div>

                    <div className="mt-auto flex items-center justify-between">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 border border-[var(--color-odessi-smoke)] rounded-sm">
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
                          <Minus size={14} strokeWidth={1.5} />
                        </button>

                        <span className="text-sm font-medium w-8 text-center">
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
                          <Plus size={14} strokeWidth={1.5} />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="type-body font-semibold text-[var(--color-odessi-black)]">
                          {formatPrice(item.product.price * item.quantity)}
                        </p>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() =>
                        removeFromCart(
                          item.product.id,
                          item.selectedSize,
                          item.selectedColor.name
                        )
                      }
                      className="text-xs text-[var(--color-odessi-stone)] hover:text-[var(--color-odessi-black)] underline mt-2 text-left"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-[var(--color-odessi-smoke)] px-6 py-6 space-y-4">
            {/* Subtotal */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-odessi-stone)]">Subtotal</span>
              <span className="font-medium text-[var(--color-odessi-black)]">
                {formatPrice(subtotal)}
              </span>
            </div>

            {/* Shipping */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-odessi-stone)]">Shipping</span>
              <span className="font-medium text-[var(--color-odessi-black)]">
                {shipping === 0 ? "FREE" : formatPrice(shipping)}
              </span>
            </div>

            {/* Free Shipping Message */}
            {shipping > 0 && (
              <p className="text-xs text-[var(--color-odessi-stone)]">
                Add {formatPrice(999 - subtotal)} more for free shipping
              </p>
            )}

            {/* Total */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--color-odessi-smoke)]">
              <span className="type-body font-semibold text-[var(--color-odessi-black)]">
                Total
              </span>
              <span className="type-h3 text-[var(--color-odessi-black)]">
                {formatPrice(total)}
              </span>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <Link
                href="/checkout"
                onClick={onClose}
                className="block w-full py-3 px-6 bg-[var(--color-odessi-black)] text-white text-center type-nav font-semibold rounded-sm hover:bg-[var(--color-odessi-stone)] transition-colors"
              >
                CHECKOUT
              </Link>

              <Link
                href="/cart"
                onClick={onClose}
                className="block w-full py-3 px-6 border border-[var(--color-odessi-black)] text-[var(--color-odessi-black)] text-center type-nav font-semibold rounded-sm hover:bg-[var(--color-odessi-smoke)] transition-colors"
              >
                VIEW CART
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}