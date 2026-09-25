"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import type { CartItem, Product, ProductColor } from "@/types";
import * as cartLib from "./cart";
import { useAuth } from "./auth/AuthContext";
import { apiGet, apiPost, apiPatch, apiDelete } from "./api/client";
import { EVENTS } from "./events";
import { getMediaUrl } from "@/lib/product-utils";

import { products as mockProducts } from "@/data/products";

interface CartContextType {
  cart: CartItem[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  addToCart: (product: Product, size: string, color: ProductColor, quantity?: number) => Promise<boolean>;
  removeFromCart: (productId: string, size: string, colorName: string) => void;
  updateQuantity: (productId: string, size: string, colorName: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string, size?: string, colorName?: string) => boolean;
  isLoading: boolean;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface BackendCartItemResponse {
  id: number;
  variantId: number;
  productId: number;
  productName: string;
  productSlug: string;
  size: string;
  color: string;
  colorHex: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  primaryImageUrl?: string;
  imageUrl?: string;
}

interface BackendCartResponse {
  id: number;
  userId: number;
  items: BackendCartItemResponse[];
  subtotal: number;
  shippingEstimate: number;
  total: number;
  itemCount: number;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Helper to map backend CartResponse to frontend CartItem[]
  const mapServerCart = useCallback((serverCart: BackendCartResponse | null) => {
    if (!serverCart || !serverCart.items) return [];
    
    return serverCart.items.map((item: BackendCartItemResponse) => {
      // 1. Prefer authoritative backend primary image URL
      let displayImage = item.primaryImageUrl || item.imageUrl;

      // 2. Fallback to mock product catalogue if legacy/unseeded item
      if (!displayImage) {
        const mockProd = mockProducts.find((p) => p.slug === item.productSlug);
        displayImage = mockProd?.thumbnail || mockProd?.images?.[0] || "/placeholder-product.svg";
      }

      const normalizedImageUrl = getMediaUrl(displayImage);

      return {
        product: {
          id: String(item.productId),
          name: item.productName,
          slug: item.productSlug,
          price: item.unitPrice,
          thumbnail: normalizedImageUrl,
          images: [normalizedImageUrl],
          category: "hoodies",
          currency: "INR",
          description: "",
          sizes: [],
          colors: [],
          available: true,
          createdAt: "",
        },
        selectedSize: item.size,
        selectedColor: { name: item.color, hex: item.colorHex || "#000" },
        quantity: item.quantity,
        // We add this dynamically to identify the item for DELETE/PATCH requests
        cartItemId: item.id 
      } as CartItem;
    });
  }, []);

  const fetchServerCart = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const data = await apiGet<BackendCartResponse>("/api/cart");
      setCart(mapServerCart(data));
    } catch (err) {
      console.error("Failed to fetch server cart", err);
      setCart([]);
    } finally {
      setIsLoading(false);
    }
  }, [mapServerCart, user]);

  // Initialization & Auth reaction
  useEffect(() => {
    if (authLoading) return; // Wait until auth state is known

    if (user) {
      // User is authenticated, fetch server cart
      fetchServerCart();
    } else {
      // Guest mode
      setCart([]);
    }
    
    setIsInitialized(true);
  }, [user, authLoading, fetchServerCart]);

  // Global event listeners
  useEffect(() => {
    const handleCartMerged = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setCart(mapServerCart(customEvent.detail));
      } else {
        // Fallback to fetch if merge returned null
        fetchServerCart();
      }
    };

    const handleAuthLogout = () => {
      // User logged out, clear server cart state from memory and revert to empty guest cart
      setCart([]);
    };

    window.addEventListener(EVENTS.CART_MERGED, handleCartMerged);
    window.addEventListener(EVENTS.AUTH_LOGOUT, handleAuthLogout);

    return () => {
      window.removeEventListener(EVENTS.CART_MERGED, handleCartMerged);
      window.removeEventListener(EVENTS.AUTH_LOGOUT, handleAuthLogout);
    };
  }, [user, fetchServerCart, mapServerCart]);

  const addToCart = async (
    product: Product,
    size: string,
    color: ProductColor,
    quantity: number = 1
  ): Promise<boolean> => {
    if (!user) {
      throw new Error("Authentication required to add to cart");
    }
    
    try {
      setIsLoading(true);
      const variantId = cartLib.getVariantId(product, size, color.name);
      
      if (!variantId) {
        console.error("Variant not found for server addition");
        setToastMessage("That size and color combination is currently unavailable.");
        return false;
      }

      // Convert string ID back to number for backend API
      const data = await apiPost<BackendCartResponse>("/api/cart/items", { 
        variantId: parseInt(variantId, 10), 
        quantity 
      });
      setCart(mapServerCart(data));
      return true;
    } catch (err) {
      console.error("Failed to add to server cart", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (productId: string, size: string, colorName: string) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const item = cart.find(i => 
        i.product.id === productId && 
        i.selectedSize === size && 
        i.selectedColor.name === colorName
      );
      
      const cartItemId = (item as CartItem & { cartItemId?: number })?.cartItemId;
      
      if (cartItemId) {
        const data = await apiDelete<BackendCartResponse>(`/api/cart/items/${cartItemId}`);
        setCart(mapServerCart(data));
      }
    } catch (err) {
      console.error("Failed to remove from server cart", err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (
    productId: string,
    size: string,
    colorName: string,
    quantity: number
  ) => {
    if (!user) return;
    
    if (quantity <= 0) {
      return removeFromCart(productId, size, colorName);
    }

    try {
      setIsLoading(true);
      const item = cart.find(i => 
        i.product.id === productId && 
        i.selectedSize === size && 
        i.selectedColor.name === colorName
      );
      
      const cartItemId = (item as CartItem & { cartItemId?: number })?.cartItemId;
      
      if (cartItemId) {
        const data = await apiPatch<BackendCartResponse>(`/api/cart/items/${cartItemId}`, { quantity });
        setCart(mapServerCart(data));
      }
    } catch (err) {
      console.error("Failed to update server cart quantity", err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = () => {
    if (!user) {
      setCart([]);
    }
  };

  const isInCart = (productId: string, size?: string, colorName?: string): boolean => {
    return cartLib.isProductInCart(cart, productId, size, colorName);
  };

  const itemCount = cartLib.getCartItemCount(cart);
  const subtotal = cartLib.getCartSubtotal(cart);
  const shipping = cartLib.calculateShipping(subtotal);
  const total = cartLib.getCartTotal(cart, shipping);

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount,
        subtotal,
        shipping,
        total,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isInCart,
        isLoading: isLoading || !isInitialized,
        refreshCart: fetchServerCart,
      }}
    >
      {children}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-[#0A0A0A] text-white border border-[#D4AF37] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-medium"
        >
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-neutral-400 hover:text-white ml-2 text-sm font-bold"
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    // Return default values during SSR/build time
    if (typeof window === "undefined") {
      return {
        cart: [],
        itemCount: 0,
        subtotal: 0,
        shipping: 0,
        total: 0,
        addToCart: async () => false,
        removeFromCart: () => {},
        updateQuantity: () => {},
        clearCart: () => {},
        isInCart: () => false,
        isLoading: false,
        refreshCart: async () => {},
      };
    }
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}