"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, ShoppingBag } from "lucide-react";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Odessi Product Error]:", error);
  }, [error]);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        <AnnouncementBar />
      </div>
      <Navbar />
      <main className="pt-[calc(var(--announcement-height)+var(--navbar-height))] min-h-[70vh] flex items-center justify-center bg-[#FAF9F6] px-4 py-16">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-amber-50 border border-amber-200/80 flex items-center justify-center text-[#B89A5A]">
            <AlertCircle size={28} />
          </div>
          <div>
            <h1 className="type-h2 text-[var(--color-odessi-black)] mb-2">
              Unable to Load Product
            </h1>
            <p className="text-sm text-[var(--color-odessi-stone)] leading-relaxed">
              We encountered an issue preparing this piece. Please retry or browse our curated catalog.
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
              <span>Browse Catalog</span>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
