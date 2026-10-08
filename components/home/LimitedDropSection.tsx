"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types";
import { Timer, Sparkles, ArrowRight, Lock } from "lucide-react";

interface LimitedDropSectionProps {
  dropProduct?: Product | null;
}

export function LimitedDropSection({ dropProduct }: LimitedDropSectionProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [isReleased, setIsReleased] = useState(false);

  useEffect(() => {
    if (!dropProduct?.launchAt) return;

    const launchTime = new Date(dropProduct.launchAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = launchTime - now;

      if (diff <= 0) {
        setIsReleased(true);
        setTimeLeft(null);
      } else {
        setIsReleased(false);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [dropProduct]);

  if (!dropProduct || !dropProduct.isDrop) {
    return (
      <section className="my-16 py-16 px-6 sm:px-12 bg-[#080808] text-white border border-white/[0.08] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.03] via-transparent to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center space-y-5 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#171717] border border-[#b89a5a]/30 text-[#b89a5a] text-[10px] font-mono font-medium uppercase tracking-[0.2em]">
            <Sparkles className="w-3.5 h-3.5" />
            Limited Drops
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-normal uppercase tracking-tight text-[#f3f0e8]">
            NEXT DROP IN PREPARATION
          </h2>
          <p className="text-xs sm:text-sm text-[#9c978e] max-w-md mx-auto leading-relaxed">
            Our atelier is curating the next limited release. Subscribe for private access windows and member allocations.
          </p>
          <div className="pt-2">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 border border-white/20 text-[#f3f0e8] hover:border-[#b89a5a] hover:text-[#b89a5a] text-[11px] font-mono font-semibold uppercase tracking-[0.2em] transition-all duration-300"
            >
              EXPLORE CURRENT CAPSULES <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const primaryImage =
    typeof dropProduct.thumbnail === "string" && dropProduct.thumbnail
      ? dropProduct.thumbnail
      : typeof dropProduct.images?.[0] === "string"
      ? dropProduct.images[0]
      : (dropProduct.images as any)?.[0]?.imageUrl || "/placeholder.jpg";

  return (
    <section className="my-16 py-14 px-6 sm:px-12 bg-[#080808] text-white border border-white/[0.08] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.03] via-transparent to-transparent pointer-events-none" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14 items-center max-w-6xl mx-auto relative z-10">
        {/* Left: Details & Countdown */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#171717] border border-[#b89a5a]/30 text-[#b89a5a] text-[10px] font-mono font-medium uppercase tracking-[0.2em]">
            <Timer className="w-3.5 h-3.5 animate-pulse" />
            {isReleased ? "LIVE DROP NOW" : "UPCOMING LIMITED DROP"}
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-normal uppercase tracking-tight text-[#f3f0e8]">
            {dropProduct.dropTitle || dropProduct.name}
          </h2>

          <p className="text-xs sm:text-sm text-[#9c978e] font-light leading-relaxed max-w-md">
            {dropProduct.dropDescription || dropProduct.shortDescription || dropProduct.description}
          </p>

          {!isReleased && timeLeft ? (
            <div className="flex items-center gap-3 pt-2">
              <div className="flex flex-col items-center p-3 sm:p-4 bg-[#121212] border border-white/[0.08] min-w-[72px]">
                <span className="text-2xl sm:text-3xl font-mono font-bold text-[#b89a5a]">
                  {String(timeLeft.hours).padStart(2, "0")}
                </span>
                <span className="text-[9px] font-mono text-[#9c978e] uppercase tracking-[0.2em] mt-1">HOURS</span>
              </div>
              <span className="text-lg font-mono text-white/30">:</span>
              <div className="flex flex-col items-center p-3 sm:p-4 bg-[#121212] border border-white/[0.08] min-w-[72px]">
                <span className="text-2xl sm:text-3xl font-mono font-bold text-[#b89a5a]">
                  {String(timeLeft.minutes).padStart(2, "0")}
                </span>
                <span className="text-[9px] font-mono text-[#9c978e] uppercase tracking-[0.2em] mt-1">MINS</span>
              </div>
              <span className="text-lg font-mono text-white/30">:</span>
              <div className="flex flex-col items-center p-3 sm:p-4 bg-[#121212] border border-white/[0.08] min-w-[72px]">
                <span className="text-2xl sm:text-3xl font-mono font-bold text-[#b89a5a]">
                  {String(timeLeft.seconds).padStart(2, "0")}
                </span>
                <span className="text-[9px] font-mono text-[#9c978e] uppercase tracking-[0.2em] mt-1">SECS</span>
              </div>
            </div>
          ) : null}

          <div className="pt-2">
            {isReleased ? (
              <Link
                href={`/product/${dropProduct.slug}`}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-[#f3f0e8] text-[#080808] hover:bg-[#b89a5a] hover:text-[#080808] text-[11px] font-mono font-semibold uppercase tracking-[0.2em] transition-all duration-300"
              >
                SHOP DROP NOW <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <button
                disabled
                className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-[#171717] text-[#9c978e] text-[11px] font-mono font-semibold uppercase tracking-[0.2em] cursor-not-allowed border border-white/10"
              >
                <Lock className="w-3.5 h-3.5" /> LAUNCHING SOON
              </button>
            )}
          </div>
        </div>

        {/* Right: Drop Preview Image */}
        <div className="relative aspect-[4/5] overflow-hidden bg-[#121212] border border-white/[0.08]">
          <Image
            src={primaryImage}
            alt={dropProduct.name}
            fill
            className="object-cover hover:scale-105 transition-transform duration-700"
          />
        </div>
      </div>
    </section>
  );
}
