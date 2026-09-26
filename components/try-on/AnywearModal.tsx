"use client";

import React, { useEffect, useState } from "react";
import { X, ExternalLink, ArrowLeft, ArrowUpRight, Copy, Check, Move } from "lucide-react";
import type { Product } from "@/types";
import { VTON_CONFIG } from "@/lib/vton-config";

interface AnywearModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export function AnywearModal({ isOpen, onClose, product }: AnywearModalProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [copied, setCopied] = useState(false);

  // Detect device screen size for mobile instruction branching
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth < 768);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Keyboard navigation: Escape closes dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Resolve authoritative primary product image
  const rawImageUrl = (product.images && product.images[0]) || product.thumbnail || "";
  const defaultApi =
    process.env.NODE_ENV === "production"
      ? "https://odessi-backend.onrender.com"
      : "http://localhost:8080";
  const backendUrl = (process.env.NEXT_PUBLIC_API_URL || defaultApi).trim().replace(/\/+$/, "");

  const garmentImageUrl = rawImageUrl.startsWith("http")
    ? rawImageUrl
    : rawImageUrl.startsWith("/")
    ? `${backendUrl}${rawImageUrl}`
    : `${backendUrl}/${rawImageUrl}`;

  const handleDragStart = (e: React.DragEvent<HTMLImageElement>) => {
    e.dataTransfer.setData("text/plain", garmentImageUrl);
    e.dataTransfer.setData("text/uri-list", garmentImageUrl);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(garmentImageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleOpenAnywear = () => {
    console.log("[Anywear] try_on_anywear_opened", { productId: product.id, slug: product.slug });
    window.open(VTON_CONFIG.anywearUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="anywear-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md transition-opacity duration-200"
    >
      <div className="relative w-full max-w-2xl bg-[#0F0F0F] border border-[#262626] rounded-xl shadow-2xl overflow-hidden flex flex-col text-[#FAF9F6]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#262626] bg-[#141414]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-1 -ml-1 text-neutral-400 hover:text-white transition-colors rounded-sm flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold"
              aria-label="Back to Product"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="h-4 w-[1px] bg-neutral-700 mx-1 hidden sm:block" />
            <div>
              <h2
                id="anywear-modal-title"
                className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-white"
              >
                TRY WITH DECART ANYWEAR
              </h2>
              <p className="text-xs text-neutral-400 truncate max-w-xs sm:max-w-md">
                {product.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          {isMobile ? (
            /* Mobile Device Limitation View */
            <div className="space-y-6 text-center py-4">
              <div className="max-w-md mx-auto space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[#B89A5A]">
                  <Move size={20} />
                </div>
                <h3 className="text-base font-semibold text-white">
                  Device Compatibility Notice
                </h3>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Decart Anywear&apos;s desktop workflow may not be available on this device.
                </p>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  For the full real-time drag-and-drop try-on experience, please visit this page on a desktop browser using Google Chrome.
                </p>
              </div>

              {/* Product Thumbnail Confirmation */}
              <div className="inline-flex items-center gap-3 p-3 bg-neutral-900/60 border border-neutral-800 rounded-lg text-left max-w-sm mx-auto">
                {garmentImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={garmentImageUrl}
                    alt={product.name}
                    className="w-16 h-20 object-contain rounded bg-[#0A0A0A]"
                  />
                )}
                <div className="text-xs">
                  <p className="text-white font-medium line-clamp-1">{product.name}</p>
                  <p className="text-neutral-400 mt-0.5">₹{product.price.toLocaleString("en-IN")}</p>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center max-w-xs mx-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full px-5 py-3 bg-[var(--color-odessi-stone)] hover:bg-[var(--color-odessi-black)] text-white text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
                >
                  Back to Product
                </button>
              </div>
            </div>
          ) : (
            /* Desktop Chrome Instruction & Drag Workflow */
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Left Column: Draggable Product Card */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="relative group p-4 bg-neutral-900/90 border border-neutral-800 rounded-xl flex flex-col items-center shadow-lg transition-all hover:border-[#D4AF37]/50 w-full max-w-[280px]">
                  <span className="absolute top-2.5 left-2.5 bg-neutral-950/80 border border-neutral-800 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider text-[#D4AF37]">
                    Draggable
                  </span>

                  {garmentImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={garmentImageUrl}
                      alt={product.name}
                      draggable={true}
                      onDragStart={handleDragStart}
                      className="max-h-[240px] w-auto object-contain rounded-md cursor-grab active:cursor-grabbing hover:scale-102 transition-transform duration-200 select-none"
                    />
                  )}

                  <div className="mt-3 text-[11px] text-[#D4AF37] font-medium flex items-center gap-1.5">
                    <Move size={12} />
                    <span>Drag this image into Anywear</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                    <span>{copied ? "Link Copied" : "Copy Image Link"}</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Step-by-Step Instructions */}
              <div className="space-y-5 text-left">
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">
                    Try this Odessi piece on using Decart Anywear.
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Follow these steps to preview this garment on your live camera feed:
                  </p>
                </div>

                <ol className="space-y-3 text-xs">
                  <li className="flex items-start gap-3 p-3 bg-neutral-900/50 border border-neutral-800/80 rounded-md">
                    <span className="w-5 h-5 rounded-full bg-neutral-800 text-[#D4AF37] font-semibold text-[11px] flex items-center justify-center shrink-0">
                      1
                    </span>
                    <span className="text-neutral-200 pt-0.5">
                      Open Decart Anywear in Google Chrome.
                    </span>
                  </li>

                  <li className="flex items-start gap-3 p-3 bg-neutral-900/50 border border-neutral-800/80 rounded-md">
                    <span className="w-5 h-5 rounded-full bg-neutral-800 text-[#D4AF37] font-semibold text-[11px] flex items-center justify-center shrink-0">
                      2
                    </span>
                    <span className="text-neutral-200 pt-0.5">
                      Keep this product page open.
                    </span>
                  </li>

                  <li className="flex items-start gap-3 p-3 bg-neutral-900/50 border border-neutral-800/80 rounded-md">
                    <span className="w-5 h-5 rounded-full bg-neutral-800 text-[#D4AF37] font-semibold text-[11px] flex items-center justify-center shrink-0">
                      3
                    </span>
                    <span className="text-neutral-200 pt-0.5">
                      Drag the product image into the Anywear experience.
                    </span>
                  </li>

                  <li className="flex items-start gap-3 p-3 bg-neutral-900/50 border border-neutral-800/80 rounded-md">
                    <span className="w-5 h-5 rounded-full bg-neutral-800 text-[#D4AF37] font-semibold text-[11px] flex items-center justify-center shrink-0">
                      4
                    </span>
                    <span className="text-neutral-200 pt-0.5">
                      Follow Decart&apos;s on-screen instructions.
                    </span>
                  </li>
                </ol>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleOpenAnywear}
                    className="flex-1 px-5 py-3 bg-[#D4AF37] hover:bg-[#B89A5A] text-black font-semibold text-xs uppercase tracking-wider rounded-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>OPEN DECART ANYWEAR</span>
                    <ArrowUpRight size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-3 border border-neutral-700 hover:bg-neutral-800 text-neutral-300 font-semibold text-xs uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
                  >
                    CONTINUE SHOPPING
                  </button>
                </div>

                <div className="pt-1">
                  <a
                    href={VTON_CONFIG.anywearChromeExtensionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-[#B89A5A] hover:underline"
                  >
                    <span>Get the official Anywear Chrome Extension</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnywearModal;
