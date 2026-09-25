"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  Address,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  CreateAddressData,
  UpdateAddressData,
} from "@/lib/api/addresses";
import { checkoutOrder, verifyPayment } from "@/lib/api";
import { validateCoupon } from "@/lib/api/coupons";
import AddressSelector from "@/components/checkout/AddressSelector";
import OrderSummary from "@/components/checkout/OrderSummary";
import Link from "next/link";
import BackButton from "@/components/navigation/BackButton";

interface RazorpayHandlerResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayFailureResponse {
  error?: {
    description?: string;
  };
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, callback: (response: RazorpayFailureResponse) => void) => void;
    };
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const isAuthenticated = !!user;
  const { cart, subtotal, refreshCart } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Coupon state
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  const shippingAmount = subtotal >= 999 || cart.length === 0 ? 0 : 99;
  const totalAmount = Math.max(0, subtotal - discountAmount + shippingAmount);

  const handleApplyCoupon = async (code: string) => {
    const res = await validateCoupon(code, subtotal);
    if (!res.valid) {
      throw new Error(res.message);
    }
    setAppliedCouponCode(res.code);
    setDiscountAmount(res.calculatedDiscount);
  };

  const handleRemoveCoupon = () => {
    setAppliedCouponCode(null);
    setDiscountAmount(0);
  };

  const loadAddresses = useCallback(async () => {
    try {
      setLoadingAddresses(true);
      const list = await getAddresses();
      setAddresses(list);

      setSelectedAddressId((currentSelected) => {
        if (currentSelected && list.some((a) => a.id === currentSelected)) {
          return currentSelected;
        }
        const defaultAddr = list.find((a) => a.isDefault) || list[0];
        return defaultAddr ? defaultAddr.id : null;
      });
    } catch (err: unknown) {
      console.error("Failed to load addresses", err);
    } finally {
      setLoadingAddresses(false);
    }
  }, []);

  // Fetch saved addresses on mount, and handle auth redirect
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.replace("/login?redirect=/checkout");
      return;
    }

    loadAddresses();
  }, [isAuthenticated, authLoading, loadAddresses, router]);

  const handleAddNewAddress = async (data: CreateAddressData): Promise<Address> => {
    const newAddr = await createAddress(data);
    await loadAddresses();
    setSelectedAddressId(newAddr.id);
    return newAddr;
  };

  const handleUpdateAddress = async (id: number, data: UpdateAddressData): Promise<Address> => {
    const updated = await updateAddress(id, data);
    await loadAddresses();
    return updated;
  };

  const handleSetDefaultAddress = async (id: number): Promise<Address> => {
    const updated = await setDefaultAddress(id);
    await loadAddresses();
    return updated;
  };

  const handleDeleteAddress = async (id: number): Promise<void> => {
    await deleteAddress(id);
    const updatedList = await getAddresses();
    setAddresses(updatedList);
    setSelectedAddressId((currentSelected) => {
      if (currentSelected === id) {
        const nextDefault = updatedList.find((a) => a.isDefault) || updatedList[0];
        return nextDefault ? nextDefault.id : null;
      }
      return currentSelected;
    });
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleProceedToPayment = async () => {
    if (!selectedAddressId) {
      setError("Please select or add a shipping address before proceeding.");
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Load Razorpay Script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
      }

      // Step 1: Create order & reserve inventory on server
      const checkoutRes = await checkoutOrder({
        addressId: selectedAddressId,
        couponCode: appliedCouponCode || undefined,
      });

      // Step 2: Configure & launch Razorpay Checkout Popup
      const options = {
        key: checkoutRes.razorpayKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: checkoutRes.amount * 100, // in paise
        currency: checkoutRes.currency || "INR",
        name: "ODESSI.TFI",
        description: `Order #${checkoutRes.order.orderNumber}`,
        order_id: checkoutRes.razorpayOrderId,
        prefill: {
          name: user ? `${user.firstName} ${user.lastName}`.trim() : "",
          email: user?.email || "",
        },
        handler: async function (response: RazorpayHandlerResponse) {
          try {
            const confirmedOrder = await verifyPayment({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });

            // Update local cart state
            await refreshCart();

            // Navigate to Order Success Page
            router.push(`/checkout/success?orderNumber=${confirmedOrder.orderNumber}`);
          } catch (verifyErr: unknown) {
            const errMsg =
              verifyErr instanceof Error
                ? verifyErr.message
                : "Payment verification failed. Please contact customer support.";
            setError(errMsg);
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
        theme: {
          color: "#fbbf24",
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on("payment.failed", function (failResponse: RazorpayFailureResponse) {
        console.error("Razorpay Payment Failed", failResponse);
        setError(failResponse?.error?.description || "Payment failed or was declined.");
        setIsProcessing(false);
      });

      razorpayInstance.open();
    } catch (err: unknown) {
      console.error("Checkout error:", err);
      const message =
        err instanceof Error ? err.message : "Failed to initiate checkout. Please try again.";
      setError(message);
      setIsProcessing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-odessi-smoke)]">
        <div className="animate-spin h-8 w-8 border-2 border-[var(--color-odessi-black)] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-odessi-smoke)]">
        <div className="animate-spin h-8 w-8 border-2 border-[var(--color-odessi-black)] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--color-odessi-warmwhite)] flex flex-col items-center justify-center text-[var(--color-odessi-black)] p-4">
        <div className="max-w-md text-center p-8">
          <h1 className="type-h2 mb-4">Your Cart is Empty</h1>
          <p className="type-body text-[var(--color-odessi-stone)] mb-8">
            Add items to your cart before proceeding to checkout.
          </p>
          <Link
            href="/shop"
            className="inline-block px-8 py-3 bg-[var(--color-odessi-black)] text-white type-nav font-semibold rounded-sm hover:bg-[var(--color-odessi-stone)] transition-colors"
          >
            Explore Collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-odessi-warmwhite)] text-[var(--color-odessi-black)] pt-28 pb-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <BackButton fallback="/cart" label="Back to Cart" className="mb-4" />
          <h1 className="type-h2 mb-2">Checkout</h1>
          <p className="type-body text-[var(--color-odessi-stone)]">
            Review shipping details and complete your purchase securely.
          </p>
        </div>

        {error && (
          <div className="bg-red-950/80 border border-red-700 text-red-200 text-sm p-4 rounded-xl mb-8 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-xs text-neutral-400 hover:text-white">
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column — Address Selector */}
          <div className="lg:col-span-7">
            {loadingAddresses ? (
              <div className="border border-[var(--color-odessi-smoke)] rounded-sm p-8 text-center text-[var(--color-odessi-stone)]">
                Loading address information...
              </div>
            ) : (
              <AddressSelector
                addresses={addresses}
                selectedAddressId={selectedAddressId}
                onSelectAddress={(id) => setSelectedAddressId(id)}
                onAddNewAddress={handleAddNewAddress}
                onUpdateAddress={handleUpdateAddress}
                onDeleteAddress={handleDeleteAddress}
                onSetDefaultAddress={handleSetDefaultAddress}
              />
            )}
          </div>

          {/* Right Column — Order Summary & Payment Button */}
          <div className="lg:col-span-5">
            <OrderSummary
              items={cart}
              subtotal={subtotal}
              shippingAmount={shippingAmount}
              discountAmount={discountAmount}
              appliedCouponCode={appliedCouponCode}
              totalAmount={totalAmount}
              onApplyCoupon={handleApplyCoupon}
              onRemoveCoupon={handleRemoveCoupon}
              onProceedToPayment={handleProceedToPayment}
              isProcessing={isProcessing}
              disabled={!selectedAddressId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
