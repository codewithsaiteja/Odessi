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
      <section className="my-16 py-16 px-4 bg-[#0A0A0A] text-white rounded-3xl overflow-hidden relative">
        <div className="max-w-3xl mx-auto text-center space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B89A5A]/20 text-[#B89A5A] text-xs font-semibold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            Limited Drops
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold uppercase tracking-tight">
            NEXT DROP IN PREPARATION
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
            Our design studio is curating the next limited capsule. Join the Odessi Club or subscribe to notifications for private access windows.
          </p>
          <div className="pt-2">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 border border-[#B89A5A] text-[#B89A5A] hover:bg-[#B89A5A] hover:text-[#0A0A0A] text-xs font-semibold uppercase tracking-widest rounded-full transition-all"
            >
              EXPLORE CURRENT CAPSULES <ArrowRight className="w-4 h-4" />
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
    <section className="my-16 py-12 px-6 bg-[#0A0A0A] text-white rounded-3xl overflow-hidden relative border border-neutral-800">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-6xl mx-auto">
        {/* Left: Details & Countdown */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B89A5A]/20 text-[#B89A5A] text-xs font-semibold uppercase tracking-widest">
            <Timer className="w-3.5 h-3.5 animate-pulse" />
            {isReleased ? "LIVE DROP NOW" : "UPCOMING LIMITED DROP"}
          </div>

          <h2 className="text-3xl sm:text-4xl font-serif font-bold uppercase tracking-tight text-white">
            {dropProduct.dropTitle || dropProduct.name}
          </h2>

          <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed">
            {dropProduct.dropDescription || dropProduct.shortDescription || dropProduct.description}
          </p>

          {!isReleased && timeLeft ? (
            <div className="flex items-center gap-4 pt-2">
              <div className="flex flex-col items-center p-3 bg-neutral-900 border border-neutral-800 rounded-xl min-w-[70px]">
                <span className="text-2xl font-serif font-bold font-mono text-[#B89A5A]">
                  {String(timeLeft.hours).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest">HOURS</span>
              </div>
              <span className="text-xl font-bold text-neutral-600">:</span>
              <div className="flex flex-col items-center p-3 bg-neutral-900 border border-neutral-800 rounded-xl min-w-[70px]">
                <span className="text-2xl font-serif font-bold font-mono text-[#B89A5A]">
                  {String(timeLeft.minutes).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest">MINS</span>
              </div>
              <span className="text-xl font-bold text-neutral-600">:</span>
              <div className="flex flex-col items-center p-3 bg-neutral-900 border border-neutral-800 rounded-xl min-w-[70px]">
                <span className="text-2xl font-serif font-bold font-mono text-[#B89A5A]">
                  {String(timeLeft.seconds).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest">SECS</span>
              </div>
            </div>
          ) : null}

          <div className="pt-2">
            {isReleased ? (
              <Link
                href={`/product/${dropProduct.slug}`}
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#B89A5A] text-[#0A0A0A] hover:bg-[#a3864a] text-xs font-bold uppercase tracking-widest rounded-full transition-all shadow-lg"
              >
                SHOP DROP NOW <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <button
                disabled
                className="inline-flex items-center gap-2 px-8 py-4 bg-neutral-800 text-neutral-400 text-xs font-bold uppercase tracking-widest rounded-full cursor-not-allowed border border-neutral-700"
              >
                <Lock className="w-4 h-4" /> LAUNCHING SOON
              </button>
            )}
          </div>
        </div>

        {/* Right: Drop Preview Image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800">
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
