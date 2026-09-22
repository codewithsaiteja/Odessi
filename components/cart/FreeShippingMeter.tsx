"use client";

import { Sparkles, Truck } from "lucide-react";
import { formatPrice } from "@/lib/cart";

interface FreeShippingMeterProps {
  subtotal: number;
  threshold?: number;
  className?: string;
}

export function FreeShippingMeter({
  subtotal,
  threshold = 999,
  className = "",
}: FreeShippingMeterProps) {
  const isUnlocked = subtotal >= threshold;
  const remaining = Math.max(0, threshold - subtotal);
  const percentage = Math.min(100, Math.round((subtotal / threshold) * 100));

  return (
    <div className={`p-3.5 bg-[#FAF9F6] border border-neutral-200/80 rounded-sm ${className}`}>
      <div className="flex items-center justify-between text-xs mb-2">
        <div className="flex items-center gap-1.5 font-medium text-[var(--color-odessi-black)]">
          {isUnlocked ? (
            <>
              <Sparkles size={14} className="text-[#D4AF37] animate-pulse" />
              <span className="font-semibold text-[#0A0A0A] tracking-tight">
                Complimentary Shipping Unlocked!
              </span>
            </>
          ) : (
            <>
              <Truck size={14} className="text-[#0A0A0A]" />
              <span>
                Add <strong className="text-[#0A0A0A] font-mono">{formatPrice(remaining)}</strong> for Free Shipping
              </span>
            </>
          )}
        </div>
        <span className="text-[11px] font-mono text-neutral-500 font-medium">
          {percentage}%
        </span>
      </div>

      {/* Progress Track */}
      <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out rounded-full ${
            isUnlocked ? "bg-[#D4AF37]" : "bg-[#0A0A0A]"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
