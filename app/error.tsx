"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, ShoppingBag } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Odessi App Error]:", error);
  }, [error]);

  return (
    <>
      <Navbar />
      <main className="min-h-[70vh] flex items-center justify-center bg-[#FAF9F6] px-4 py-16">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
            <AlertCircle size={28} />
          </div>
          <div>
            <h1 className="type-h2 text-[var(--color-odessi-black)] mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-[var(--color-odessi-stone)] leading-relaxed">
              We encountered an unexpected issue while loading this page. Please try refreshing or return to the shop.
            </p>
          </div>
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={reset}
              className="px-6 py-3 bg-[var(--color-odessi-black)] text-white hover:bg-[var(--color-odessi-stone)] rounded-sm text-xs uppercase tracking-wider font-semibold transition-colors flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Try Again</span>
            </button>
            <Link
              href="/shop"
              className="px-6 py-3 border border-[var(--color-odessi-black)] text-[var(--color-odessi-black)] hover:bg-[var(--color-odessi-smoke)] rounded-sm text-xs uppercase tracking-wider font-semibold transition-colors flex items-center gap-2"
            >
              <ShoppingBag size={14} />
              <span>Return to Shop</span>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
