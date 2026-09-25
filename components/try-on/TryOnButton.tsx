"use client";

import React from "react";
import { Sparkles, Camera } from "lucide-react";

interface TryOnButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function TryOnButton({ onClick, disabled = false, className = "" }: TryOnButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Real-time virtual try-on with Lucy VTON"
      className={`
        group relative w-full overflow-hidden rounded-sm px-6 py-3.5
        bg-[#0D0D0D] hover:bg-[#171717] active:bg-[#050505]
        text-white font-medium text-xs tracking-[0.2em] uppercase
        border border-[#262626] hover:border-[#D4AF37]/60
        shadow-[0_4px_20px_rgba(0,0,0,0.25)]
        transition-all duration-300 ease-out
        flex items-center justify-between
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {/* Subtle luxury gold gradient shimmer on hover */}
      <span
        className="pointer-events-none absolute -inset-full bg-gradient-to-r from-transparent via-[#D4AF37]/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-1000 ease-in-out"
        aria-hidden="true"
      />

      <div className="flex items-center gap-2.5 z-10">
        <span className="p-1 rounded-sm bg-neutral-900 border border-neutral-800 text-[#D4AF37] group-hover:text-[#F3E5AB] group-hover:scale-110 transition-transform duration-300">
          <Camera size={14} strokeWidth={2} />
        </span>
        <span className="font-semibold tracking-[0.18em]">Virtual Try-On</span>
      </div>

      <div className="flex items-center gap-1.5 z-10">
        <span className="inline-flex items-center gap-1 text-[10px] tracking-widest text-[#D4AF37] font-semibold bg-[#D4AF37]/10 px-2 py-0.5 rounded-full border border-[#D4AF37]/30">
          <Sparkles size={10} className="animate-pulse" />
          <span>LIVE VTON</span>
        </span>
      </div>
    </button>
  );
}

export default TryOnButton;
